from __future__ import annotations

from datetime import datetime, timezone
from fastapi import APIRouter, Depends
from bson import ObjectId

from app.dependencies import get_current_user
from app.schemas.user import UserProfileUpdate, UserProfileResponse, LearningPreferencesUpdate
from app.database import get_collection

router = APIRouter(prefix="/users", tags=["users"])


def _to_response(user: dict) -> UserProfileResponse:
    return UserProfileResponse(
        id=str(user["_id"]),
        name=user.get("name", ""),
        email=user.get("email", ""),
        education=user.get("education", ""),
        branch=user.get("branch", ""),
        experience=user.get("experience", "Intermediate"),
        skills=user.get("skills", []),
        interests=user.get("interests", []),
        projects=user.get("projects", ""),
        certifications=user.get("certifications", ""),
        target_career=user.get("target_career", ""),
        weekly_learning_hours=user.get("weekly_learning_hours", 7),
        onboarding_completed=user.get("onboarding_completed", False),
        learning_preferences=user.get("learning_preferences", {}),
    )


@router.get("/me", response_model=UserProfileResponse)
async def get_profile(current_user: dict = Depends(get_current_user)):
    return _to_response(current_user)


@router.put("/me", response_model=UserProfileResponse)
async def update_profile(
    data: UserProfileUpdate,
    current_user: dict = Depends(get_current_user),
):
    users = get_collection("users")
    update_fields = data.model_dump(exclude_none=True)

    if "learning_preferences" in update_fields and isinstance(update_fields["learning_preferences"], dict):
        existing_prefs = current_user.get("learning_preferences", {})
        existing_prefs.update({k: v for k, v in update_fields["learning_preferences"].items() if v is not None})
        update_fields["learning_preferences"] = existing_prefs

    update_fields["updated_at"] = datetime.now(timezone.utc)

    await users.update_one(
        {"_id": ObjectId(str(current_user["_id"]))},
        {"$set": update_fields},
    )

    updated = await users.find_one({"_id": ObjectId(str(current_user["_id"]))})
    return _to_response(updated)


@router.get("/me/preferences")
async def get_preferences(current_user: dict = Depends(get_current_user)):
    return current_user.get("learning_preferences", {})


@router.put("/me/preferences")
async def update_preferences(
    data: LearningPreferencesUpdate,
    current_user: dict = Depends(get_current_user),
):
    users = get_collection("users")
    prefs = current_user.get("learning_preferences", {})
    prefs.update({k: v for k, v in data.model_dump(exclude_none=True).items() if v is not None})

    await users.update_one(
        {"_id": ObjectId(str(current_user["_id"]))},
        {"$set": {"learning_preferences": prefs, "updated_at": datetime.now(timezone.utc)}},
    )
    return prefs
