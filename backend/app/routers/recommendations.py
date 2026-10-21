from __future__ import annotations

from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field

from app.dependencies import get_current_user
from app.services.ai_service import AIServiceError, ai_service

router = APIRouter(prefix="/recommendations", tags=["recommendations"])


class CareerRecommendationRequest(BaseModel):
    target_career: Optional[str] = Field(default=None, max_length=200)
    skills: Optional[List[str]] = Field(default=None, max_length=50)
    interests: Optional[List[str]] = Field(default=None, max_length=50)
    experience: Optional[str] = Field(default=None, max_length=100)


class SkillGapRequest(BaseModel):
    target_career: str = Field(..., max_length=200)
    current_skills: Optional[List[str]] = Field(default=None, max_length=50)


@router.post("/career")
async def career_recommendation(
    req: CareerRecommendationRequest,
    current_user: dict = Depends(get_current_user),
):
    try:
        return ai_service.career_recommendations(current_user, req.model_dump())
    except AIServiceError as exc:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(exc)) from exc


@router.post("/skill-gap")
async def skill_gap(
    req: SkillGapRequest,
    current_user: dict = Depends(get_current_user),
):
    try:
        merged_skills = req.current_skills or current_user.get("skills", [])
        return ai_service.skill_gaps({**current_user, "skills": merged_skills}, req.target_career)
    except AIServiceError as exc:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(exc)) from exc
