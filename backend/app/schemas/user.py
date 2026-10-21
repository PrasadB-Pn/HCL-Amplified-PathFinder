from __future__ import annotations

from typing import Optional, List
from pydantic import BaseModel, Field


class LearningPreferencesUpdate(BaseModel):
    style: Optional[str] = Field(default=None, max_length=100)
    pace: Optional[str] = Field(default=None, max_length=100)
    content: Optional[str] = Field(default=None, max_length=100)
    weekly_hours: Optional[int] = Field(default=None, ge=1, le=168)


class UserProfileUpdate(BaseModel):
    name: Optional[str] = Field(default=None, min_length=1, max_length=100)
    education: Optional[str] = Field(default=None, max_length=200)
    branch: Optional[str] = Field(default=None, max_length=200)
    experience: Optional[str] = Field(default=None, max_length=100)
    skills: Optional[List[str]] = Field(default=None, max_length=50)
    interests: Optional[List[str]] = Field(default=None, max_length=50)
    projects: Optional[str] = Field(default=None, max_length=2000)
    certifications: Optional[str] = Field(default=None, max_length=2000)
    target_career: Optional[str] = Field(default=None, max_length=200)
    weekly_learning_hours: Optional[int] = Field(default=None, ge=1, le=168)
    onboarding_completed: Optional[bool] = None
    learning_preferences: Optional[LearningPreferencesUpdate] = None


class UserProfileResponse(BaseModel):
    id: str
    name: str
    email: str
    education: str = ""
    branch: str = ""
    experience: str = "Intermediate"
    skills: List[str] = []
    interests: List[str] = []
    projects: str = ""
    certifications: str = ""
    target_career: str = ""
    weekly_learning_hours: int = 7
    onboarding_completed: bool = False
    learning_preferences: dict = {}
