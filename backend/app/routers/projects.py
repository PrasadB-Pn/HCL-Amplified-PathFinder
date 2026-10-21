from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from app.dependencies import get_current_user
from app.services.ai_service import AIServiceError, ai_service

router = APIRouter(prefix="/projects", tags=["projects"])


def _sanitize_project(p: dict) -> dict:
    p = dict(p)
    url = p.get("url") or ""
    if not url or url.strip() in ("", "#"):
        p["url"] = "https://github.com"
    elif url.startswith("http://"):
        p["url"] = "https://" + url[7:]
    elif not url.startswith("https://"):
        p["url"] = f"https://{url}"
    return p


@router.get("")
async def get_projects(current_user: dict = Depends(get_current_user)):
    try:
        items = ai_service.projects(current_user)
        return [_sanitize_project(item) for item in items]
    except AIServiceError as exc:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(exc)) from exc


@router.get("/recommended")
async def get_recommended(current_user: dict = Depends(get_current_user)):
    try:
        items = ai_service.projects(current_user)
        return [_sanitize_project(item) for item in items]
    except AIServiceError as exc:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(exc)) from exc


@router.get("/{project_id}")
async def get_project(project_id: str, current_user: dict = Depends(get_current_user)):
    try:
        project = next((p for p in ai_service.projects(current_user) if p["id"] == project_id), None)
    except AIServiceError as exc:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(exc)) from exc

    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
    return _sanitize_project(project)
