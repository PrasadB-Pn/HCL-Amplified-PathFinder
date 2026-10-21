from __future__ import annotations

import secrets
import time
from collections import defaultdict
from typing import Optional, Dict, List

from fastapi import Depends, HTTPException, Request, Response, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from bson import ObjectId

from app.config import settings
from app.database import get_collection
from app.services.auth_service import decode_access_token

bearer_scheme = HTTPBearer(auto_error=False)


# ── In-Memory Sliding-Window Rate Limiter ──────────────────────────────────────
class RateLimiter:
    """Sliding-window IP rate limiter for sensitive endpoints like auth."""
    def __init__(self, max_requests: int = 10, window_seconds: int = 60):
        self.max_requests = max_requests
        self.window_seconds = window_seconds
        self._requests: Dict[str, List[float]] = defaultdict(list)

    def reset(self) -> None:
        self._requests.clear()

    def check(self, key: str) -> None:
        now = time.time()
        window_start = now - self.window_seconds
        # Clean older entries
        self._requests[key] = [t for t in self._requests[key] if t > window_start]
        if len(self._requests[key]) >= self.max_requests:
            retry_after = int(self._requests[key][0] + self.window_seconds - now) + 1
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Too many attempts. Please try again later.",
                headers={"Retry-After": str(max(1, retry_after))},
            )
        self._requests[key].append(now)


auth_rate_limiter = RateLimiter(max_requests=10, window_seconds=60)


async def rate_limit_auth(request: Request) -> None:
    """Rate limit login and registration endpoints by client IP."""
    client_ip = request.client.host if request.client else "unknown"
    # Also check X-Forwarded-For if behind proxy
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        client_ip = forwarded.split(",")[0].strip()
    auth_rate_limiter.check(client_ip)


def verify_csrf_if_cookie_auth(request: Request, is_cookie_auth: bool) -> None:
    """Verify CSRF token for cookie-authenticated state-changing requests."""
    if not is_cookie_auth:
        return
    if request.method in ("GET", "HEAD", "OPTIONS"):
        return

    csrf_header = request.headers.get("x-csrf-token")
    csrf_cookie = request.cookies.get("csrf_token")

    if not csrf_header or not csrf_cookie or not secrets.compare_digest(csrf_header, csrf_cookie):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="CSRF token validation failed",
        )


async def get_current_user(
    request: Request,
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(bearer_scheme),
) -> dict:
    """FastAPI dependency that returns the authenticated MongoDB user document.
    
    Supports Authorization: Bearer <token> or HttpOnly access_token cookie.
    Enforces CSRF validation when cookie-based authentication is used.
    """
    token: Optional[str] = None
    is_cookie_auth = False

    if credentials and credentials.credentials:
        token = credentials.credentials
    elif "access_token" in request.cookies:
        token = request.cookies.get("access_token")
        is_cookie_auth = True

    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"},
        )

    verify_csrf_if_cookie_auth(request, is_cookie_auth)

    user_id = decode_access_token(token)
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )

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
    return user
