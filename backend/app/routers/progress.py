from __future__ import annotations

from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field

from app.dependencies import get_current_user
from app.database import get_collection

router = APIRouter(prefix="/progress", tags=["progress"])


class LogActivityRequest(BaseModel):
    day: Optional[str] = Field(default=None, max_length=10)
    hours: float = Field(..., ge=0.0, le=24.0)
    activity_type: Optional[str] = Field(default="practice", max_length=50)
    description: Optional[str] = Field(default="", max_length=200)


class CompleteStageRequest(BaseModel):
    stage_id: Optional[str] = Field(default=None, max_length=100)
    skill_name: Optional[str] = Field(default=None, max_length=100)


def _format_progress_doc(doc: dict) -> dict:
    doc = dict(doc)
    doc["id"] = str(doc.pop("_id", doc.get("id", "")))
    doc.pop("user_id", None)

    for k, v in list(doc.items()):
        if hasattr(v, "isoformat"):
            doc[k] = v.isoformat()

    # Provide dual casing (camelCase and snake_case) for frontend compatibility
    doc["percentage"] = doc.get("overall", 0)
    doc["skillsCompleted"] = doc.get("skills_completed", 0)
    doc["totalSkills"] = doc.get("total_skills", 0)
    doc["coursesCompleted"] = doc.get("courses_completed", 0)
    doc["projectsCompleted"] = doc.get("projects_completed", 0)
    doc["thisWeekHours"] = doc.get("this_week_hours", 0.0)
    doc["lessonsCompleted"] = doc.get("lessons_completed", 0)
    doc["skillsImproved"] = doc.get("skills_improved", 0)
    doc["weeklyActivity"] = doc.get("weekly_activity", [])
    doc["skillProgression"] = doc.get("skill_progression", [])

    return doc


async def _get_or_create_user_progress(current_user: dict) -> dict:
    progress_col = get_collection("progress")
    routes_col = get_collection("routes")
    user_id = str(current_user["_id"])

    existing = await progress_col.find_one({"user_id": user_id})
    if existing:
        return existing

    # Derive baseline progress dynamically from user's active route and profile
    active_route = await routes_col.find_one({"user_id": user_id, "is_current": True})
    stages = active_route.get("stages", []) if active_route else []
    completed_stages = [s for s in stages if s.get("status") == "completed"]
    total_stages = len(stages)
    progress_pct = active_route.get("progress", 0) if active_route else 0
    current_skill = active_route.get("current_stage", "Foundations") if active_route else "Foundations"
    next_skill = active_route.get("next_checkpoint", "Next Checkpoint") if active_route else "Next Checkpoint"

    user_skills_count = len(current_user.get("skills", []))

    now = datetime.now(timezone.utc)
    new_doc = {
        "user_id": user_id,
        "overall": int(progress_pct),
        "skills_completed": len(completed_stages) or min(user_skills_count, 3),
        "total_skills": total_stages or max(user_skills_count + 5, 10),
        "current_skill": current_skill,
        "next_skill": next_skill,
        "courses_completed": 0,
        "projects_completed": 0,
        "current_project": "Hands-on Foundation Practice",
        "this_week_hours": 0.0,
        "lessons_completed": len(completed_stages),
        "skills_improved": 0,
        "streak": 0,
        "weekly_activity": [
            {"day": "Mon", "hours": 0.0},
            {"day": "Tue", "hours": 0.0},
            {"day": "Wed", "hours": 0.0},
            {"day": "Thu", "hours": 0.0},
            {"day": "Fri", "hours": 0.0},
            {"day": "Sat", "hours": 0.0},
            {"day": "Sun", "hours": 0.0},
        ],
        "skill_progression": [
            {"month": "Month 1", "skills": min(user_skills_count, 2)},
            {"month": "Month 2", "skills": min(user_skills_count + 2, 5)},
            {"month": "Month 3", "skills": min(user_skills_count + 4, 8)},
        ],
        "created_at": now,
        "updated_at": now,
    }

    result = await progress_col.insert_one(new_doc)
    new_doc["_id"] = result.inserted_id
    return new_doc


@router.get("")
async def get_progress(current_user: dict = Depends(get_current_user)):
    doc = await _get_or_create_user_progress(current_user)
    return _format_progress_doc(doc)


@router.post("/activity")
async def log_activity(req: LogActivityRequest, current_user: dict = Depends(get_current_user)):
    progress_col = get_collection("progress")
    user_id = str(current_user["_id"])
    doc = await _get_or_create_user_progress(current_user)

    req_day = req.day or datetime.now(timezone.utc).strftime("%a")
    weekly = list(doc.get("weekly_activity", []))
    updated_weekly = False
    for item in weekly:
        if item.get("day", "").lower() == req_day.lower():
            item["hours"] = round(item.get("hours", 0) + req.hours, 1)
            updated_weekly = True
            break
    if not updated_weekly:
        weekly.append({"day": req_day[:3].capitalize(), "hours": req.hours})

    new_this_week = round(sum(i.get("hours", 0) for i in weekly), 1)

    recent = list(doc.get("recent_activities", []))
    recent.insert(0, {
        "date": datetime.now(timezone.utc).strftime("%b %d"),
        "title": req.description or f"{req.activity_type.capitalize()} session",
        "type": req.activity_type or "practice",
        "hours": req.hours,
    })

    await progress_col.update_one(
        {"user_id": user_id},
        {
            "$set": {
                "weekly_activity": weekly,
                "recent_activities": recent[:10],
                "this_week_hours": new_this_week,
                "updated_at": datetime.now(timezone.utc),
            },
            "$inc": {"streak": 1 if req.hours > 0 else 0},
        },
    )

    updated = await progress_col.find_one({"user_id": user_id})
    return _format_progress_doc(updated)


@router.post("/complete-stage")
async def complete_stage(req: CompleteStageRequest, current_user: dict = Depends(get_current_user)):
    routes_col = get_collection("routes")
    progress_col = get_collection("progress")
    user_id = str(current_user["_id"])

    active_route = await routes_col.find_one({"user_id": user_id, "is_current": True})
    if active_route:
        stages = active_route.get("stages", [])
        for s in stages:
            if (req.stage_id and s.get("id") == req.stage_id) or (req.skill_name and s.get("title", "").lower() == req.skill_name.lower()):
                s["status"] = "completed"
                break
        completed = len([s for s in stages if s.get("status") == "completed"])
        total = len(stages)
        new_progress = round((completed / total) * 100) if total else 0

        await routes_col.update_one(
            {"_id": active_route["_id"]},
            {"$set": {"stages": stages, "progress": new_progress, "updated_at": datetime.now(timezone.utc)}},
        )

        await progress_col.update_one(
            {"user_id": user_id},
            {
                "$set": {"overall": new_progress, "skills_completed": completed, "updated_at": datetime.now(timezone.utc)},
                "$inc": {"lessons_completed": 1, "skills_improved": 1},
                "$addToSet": {"completed_stages": req.stage_id or req.skill_name or "stage"},
            },
        )
    else:
        await progress_col.update_one(
            {"user_id": user_id},
            {
                "$inc": {"skills_completed": 1, "lessons_completed": 1, "skills_improved": 1, "overall": 10},
                "$addToSet": {"completed_stages": req.stage_id or req.skill_name or "stage"},
                "$set": {"updated_at": datetime.now(timezone.utc)},
            },
            upsert=True,
        )

    updated_progress = await _get_or_create_user_progress(current_user)
    return _format_progress_doc(updated_progress)
