from __future__ import annotations

from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from bson import ObjectId

from app.config import settings
from app.database import get_collection
from app.dependencies import get_current_user, rate_limit_auth
from app.schemas.auth import (
    AuthResponse,
    LoginRequest,
    RefreshRequest,
    RegisterRequest,
    UserPublic,
)
from app.services.auth_service import (
    create_access_token,
    create_refresh_token,
    decode_refresh_token,
    generate_csrf_token,
    hash_password,
    verify_password,
)

router = APIRouter(prefix="/auth", tags=["auth"])


def _user_to_public(user: dict) -> UserPublic:
    return UserPublic(
        id=str(user["_id"]),
        name=user.get("name", ""),
        email=user.get("email", ""),
        onboarding_completed=user.get("onboarding_completed", False),
        target_career=user.get("target_career", ""),
        experience=user.get("experience", "Intermediate"),
    )


def _set_auth_cookies(
    response: Response,
    access_token: str,
    refresh_token: str,
    csrf_token: str,
) -> None:
    """Set secure HttpOnly authentication cookies and CSRF cookie."""
    cookie_kwargs = {
        "httponly": True,
        "secure": settings.resolved_cookie_secure,
        "samesite": settings.cookie_samesite,
        "domain": settings.cookie_domain,
    }

    # Access token cookie (short-lived)
    response.set_cookie(
        key="access_token",
        value=access_token,
        max_age=settings.jwt_access_expire_minutes * 60,
        **cookie_kwargs,
    )

    # Refresh token cookie (long-lived)
    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        max_age=settings.jwt_refresh_expire_days * 86400,
        **cookie_kwargs,
    )

    # CSRF cookie (non-HttpOnly so client-side code can send X-CSRF-Token header)
    response.set_cookie(
        key="csrf_token",
        value=csrf_token,
        max_age=settings.jwt_refresh_expire_days * 86400,
        httponly=False,
        secure=settings.resolved_cookie_secure,
        samesite=settings.cookie_samesite,
        domain=settings.cookie_domain,
    )


def _clear_auth_cookies(response: Response) -> None:
    """Clear all authentication and CSRF cookies."""
    for key in ("access_token", "refresh_token", "csrf_token"):
        response.delete_cookie(
            key=key,
            domain=settings.cookie_domain,
            secure=settings.resolved_cookie_secure,
            samesite=settings.cookie_samesite,
        )


@router.post(
    "/register",
    response_model=AuthResponse,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(rate_limit_auth)],
)
async def register(data: RegisterRequest, response: Response):
    users = get_collection("users")
    email = data.email.lower().strip()

    existing = await users.find_one({"email": email})
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email already exists.",
        )

    now = datetime.now(timezone.utc)
    doc = {
        "name": data.name.strip(),
        "email": email,
        "password_hash": hash_password(data.password),
        "education": "",
        "branch": "",
        "experience": "Intermediate",
        "skills": [],
        "interests": [],
        "projects": "",
        "certifications": "",
        "target_career": "",
        "weekly_learning_hours": 7,
        "learning_preferences": {
            "style": "Project-based",
            "pace": "Balanced",
            "content": "Mixed",
        },
        "onboarding_completed": False,
        "created_at": now,
        "updated_at": now,
    }

    result = await users.insert_one(doc)
    doc["_id"] = result.inserted_id

    try:
        await users.create_index("email", unique=True, background=True)
    except Exception:
        pass

    user_id_str = str(result.inserted_id)
    access_tok = create_access_token(user_id_str)
    refresh_tok = create_refresh_token(user_id_str)
    csrf_tok = generate_csrf_token()

    _set_auth_cookies(response, access_tok, refresh_tok, csrf_tok)

    return AuthResponse(
        token=access_tok,
        user=_user_to_public(doc),
        onboarding_completed=False,
        csrf_token=csrf_tok,
    )


@router.post(
    "/login",
    response_model=AuthResponse,
    dependencies=[Depends(rate_limit_auth)],
)
async def login(data: LoginRequest, response: Response):
    users = get_collection("users")
    email = data.email.lower().strip()

    user = await users.find_one({"email": email})
    if not user or not verify_password(data.password, user.get("password_hash", "")):
        # Generic login error: does not reveal if email exists or password was wrong
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
        )

    user_id_str = str(user["_id"])
    access_tok = create_access_token(user_id_str)
    refresh_tok = create_refresh_token(user_id_str)
    csrf_tok = generate_csrf_token()

    _set_auth_cookies(response, access_tok, refresh_tok, csrf_tok)

    return AuthResponse(
        token=access_tok,
        user=_user_to_public(user),
        onboarding_completed=user.get("onboarding_completed", False),
        csrf_token=csrf_tok,
    )


@router.post("/refresh", response_model=AuthResponse)
async def refresh_tokens(request: Request, response: Response, body: Optional[RefreshRequest] = None):
    # Extract refresh token from cookie or request body
    token = None
    if body and body.refresh_token:
        token = body.refresh_token
    elif "refresh_token" in request.cookies:
        token = request.cookies.get("refresh_token")

    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token missing",
        )

    payload = decode_refresh_token(token)
    if not payload or not payload.get("sub"):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired refresh token",
        )

    user_id = payload["sub"]
    users = get_collection("users")
    try:
        user = await users.find_one({"_id": ObjectId(user_id)})
    except Exception:
        user = await users.find_one({"_id": user_id})

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
        )

    # Rotate tokens: issue new access token and new refresh token
    new_access_tok = create_access_token(str(user["_id"]))
    new_refresh_tok = create_refresh_token(str(user["_id"]))
    csrf_tok = generate_csrf_token()

    _set_auth_cookies(response, new_access_tok, new_refresh_tok, csrf_tok)

    return AuthResponse(
        token=new_access_tok,
        user=_user_to_public(user),
        onboarding_completed=user.get("onboarding_completed", False),
        csrf_token=csrf_tok,
    )


@router.get("/me", response_model=UserPublic)
async def get_me(current_user: dict = Depends(get_current_user)):
    return _user_to_public(current_user)


@router.get("/csrf")
@router.get("/csrf-token")
async def get_csrf_token(response: Response):
    """Retrieve or initialize a CSRF token."""
    csrf_tok = generate_csrf_token()
    response.set_cookie(
        key="csrf_token",
        value=csrf_tok,
        max_age=settings.jwt_refresh_expire_days * 86400,
        httponly=False,
        secure=settings.resolved_cookie_secure,
        samesite=settings.cookie_samesite,
        domain=settings.cookie_domain,
    )
    return {"csrf_token": csrf_tok}


@router.post("/logout")
async def logout(response: Response):
    _clear_auth_cookies(response)
    return {"success": True, "message": "Logged out successfully"}
