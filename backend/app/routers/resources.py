from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from app.dependencies import get_current_user
from app.services.ai_service import AIServiceError, ai_service

router = APIRouter(prefix="/resources", tags=["resources"])


def _sanitize_resource(res: dict) -> dict:
    res = dict(res)
    url = res.get("url") or ""
    if not url or url.strip() in ("", "#"):
        res["url"] = "https://www.coursera.org"
    elif url.startswith("http://"):
        res["url"] = "https://" + url[7:]
    elif not url.startswith("https://"):
        res["url"] = f"https://{url}"
    return res


@router.get("")
async def get_resources(current_user: dict = Depends(get_current_user)):
    try:
        items = ai_service.resources(current_user)
        return [_sanitize_resource(item) for item in items]
    except AIServiceError as exc:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(exc)) from exc


@router.get("/recommended")
async def get_recommended(current_user: dict = Depends(get_current_user)):
    try:
        items = ai_service.resources(current_user)[:5]
        return [_sanitize_resource(item) for item in items]
    except AIServiceError as exc:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(exc)) from exc


@router.get("/{resource_id}")
async def get_resource(resource_id: str, current_user: dict = Depends(get_current_user)):
    try:
        resource = next((r for r in ai_service.resources(current_user) if r["id"] == resource_id), None)
    except AIServiceError as exc:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(exc)) from exc

    if not resource:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Resource not found")
    return _sanitize_resource(resource)
