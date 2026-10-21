from __future__ import annotations

from datetime import datetime, timezone
from typing import Optional
from fastapi import APIRouter, HTTPException, Depends, status
from pydantic import BaseModel, Field
from bson import ObjectId

from app.dependencies import get_current_user
from app.database import get_collection
from app.services.ai_service import AIServiceError, ai_service

router = APIRouter(prefix="/routes", tags=["routes"])


class GenerateRouteRequest(BaseModel):
    career_title: Optional[str] = Field(default=None, max_length=200)
    goal: Optional[str] = Field(default=None, max_length=200)


def _serialize_route(doc: dict) -> dict:
    doc = dict(doc)
    route_id = str(doc.pop("_id", doc.get("id", "")))
    doc["id"] = route_id
    doc.pop("user_id", None)

    for k, v in list(doc.items()):
        if hasattr(v, 'isoformat'):
            doc[k] = v.isoformat()

    # Provide dual casing (camelCase and snake_case) so all frontend pages work reliably
    doc["isCurrent"] = doc.get("is_current", doc.get("isCurrent", True))
    doc["currentStage"] = doc.get("current_stage", doc.get("currentStage", ""))
    doc["nextCheckpoint"] = doc.get("next_checkpoint", doc.get("nextCheckpoint", ""))
    doc["estimatedWeeks"] = doc.get("estimated_weeks", doc.get("estimatedWeeks", 12))
    doc["weeklyHours"] = doc.get("weekly_hours", doc.get("weeklyHours", 7))
    doc["totalStages"] = doc.get("total_stages", doc.get("totalStages", len(doc.get("stages", []))))
    doc["totalSkills"] = doc.get("total_skills", doc.get("totalSkills", len(doc.get("stages", []))))
    doc["totalProjects"] = doc.get("total_projects", doc.get("totalProjects", 0))

    return doc


def _parse_object_id(oid_str: str) -> ObjectId:
    if not ObjectId.is_valid(oid_str):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Route not found")
    return ObjectId(oid_str)


@router.get("")
async def get_routes(current_user: dict = Depends(get_current_user)):
    routes_col = get_collection("routes")
    user_id = str(current_user["_id"])
    cursor = routes_col.find({"user_id": user_id}).sort("created_at", -1)
    routes = []
    async for doc in cursor:
        routes.append(_serialize_route(doc))
    return routes


@router.get("/{route_id}")
async def get_route(route_id: str, current_user: dict = Depends(get_current_user)):
    routes_col = get_collection("routes")
    user_id = str(current_user["_id"])
    oid = _parse_object_id(route_id)

    doc = await routes_col.find_one({"_id": oid, "user_id": user_id})
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Route not found")
    return _serialize_route(doc)


@router.post("/generate")
async def generate_user_route(
    req: GenerateRouteRequest,
    current_user: dict = Depends(get_current_user),
):
    routes_col = get_collection("routes")
    user_id = str(current_user["_id"])
    career_title = req.career_title or req.goal or current_user.get("target_career") or "AI / ML Engineer"

    try:
        route_data = ai_service.route(current_user, career_title)
    except AIServiceError as exc:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(exc)) from exc

    # Set existing routes for this user to inactive
    await routes_col.update_many({"user_id": user_id}, {"$set": {"is_current": False}})

    now = datetime.now(timezone.utc)
    doc = {
        "user_id": user_id,
        **route_data,
        "is_current": True,
        "created_at": now,
        "updated_at": now,
    }
    result = await routes_col.insert_one(doc)
    doc["_id"] = result.inserted_id
    return _serialize_route(doc)


@router.post("")
async def create_route(
    req: GenerateRouteRequest,
    current_user: dict = Depends(get_current_user),
):
    return await generate_user_route(req, current_user)


@router.patch("/{route_id}/pause")
async def pause_route(route_id: str, current_user: dict = Depends(get_current_user)):
    routes_col = get_collection("routes")
    user_id = str(current_user["_id"])
    oid = _parse_object_id(route_id)

    result = await routes_col.update_one(
        {"_id": oid, "user_id": user_id},
        {"$set": {"status": "paused", "updated_at": datetime.now(timezone.utc)}},
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Route not found")
    return {"success": True}


@router.patch("/{route_id}/resume")
async def resume_route(route_id: str, current_user: dict = Depends(get_current_user)):
    routes_col = get_collection("routes")
    user_id = str(current_user["_id"])
    oid = _parse_object_id(route_id)

    result = await routes_col.update_one(
        {"_id": oid, "user_id": user_id},
        {"$set": {"status": "active", "updated_at": datetime.now(timezone.utc)}},
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Route not found")
    return {"success": True}


@router.delete("/{route_id}")
async def delete_route(route_id: str, current_user: dict = Depends(get_current_user)):
    routes_col = get_collection("routes")
    user_id = str(current_user["_id"])
    oid = _parse_object_id(route_id)

    result = await routes_col.delete_one({"_id": oid, "user_id": user_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Route not found")
    return {"success": True}
