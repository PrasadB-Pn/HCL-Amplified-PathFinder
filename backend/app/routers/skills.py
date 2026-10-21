from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from app.services.ai_service import AIServiceError, ai_service
from app.dependencies import get_current_user

router = APIRouter(prefix="/skills", tags=["skills"])

SKILL_CATALOG = [
    {"id": "s1", "name": "Python", "category": "Programming", "proficiency": 92, "status": "strong"},
    {"id": "s2", "name": "SQL", "category": "Programming", "proficiency": 88, "status": "strong"},
    {"id": "s3", "name": "JavaScript", "category": "Programming", "proficiency": 72, "status": "developing"},
    {"id": "s4", "name": "Pandas", "category": "Data", "proficiency": 84, "status": "strong"},
    {"id": "s5", "name": "NumPy", "category": "Data", "proficiency": 82, "status": "strong"},
    {"id": "s6", "name": "Data Cleaning", "category": "Data", "proficiency": 79, "status": "strong"},
    {"id": "s7", "name": "Feature Engineering", "category": "Data", "proficiency": 61, "status": "developing"},
    {"id": "s8", "name": "Statistics", "category": "Data", "proficiency": 78, "status": "developing"},
    {"id": "s9", "name": "Supervised Learning", "category": "Machine Learning", "proficiency": 70, "status": "developing"},
    {"id": "s10", "name": "Classification", "category": "Machine Learning", "proficiency": 68, "status": "developing"},
    {"id": "s11", "name": "Regression", "category": "Machine Learning", "proficiency": 65, "status": "developing"},
    {"id": "s12", "name": "Model Evaluation", "category": "Machine Learning", "proficiency": 48, "status": "needs_attention"},
    {"id": "s13", "name": "Neural Networks", "category": "AI / Deep Learning", "proficiency": 34, "status": "needs_attention"},
    {"id": "s14", "name": "Deep Learning", "category": "AI / Deep Learning", "proficiency": 31, "status": "needs_attention"},
    {"id": "s15", "name": "Transformers", "category": "AI / Deep Learning", "proficiency": 14, "status": "needs_attention"},
    {"id": "s16", "name": "Docker", "category": "MLOps", "proficiency": 22, "status": "needs_attention"},
    {"id": "s17", "name": "Deployment", "category": "MLOps", "proficiency": 19, "status": "needs_attention"},
    {"id": "s18", "name": "Monitoring", "category": "MLOps", "proficiency": 18, "status": "needs_attention"},
]


@router.get("")
async def get_skills(current_user: dict = Depends(get_current_user)):
    user_skills = current_user.get("skills", [])
    if not user_skills:
        return SKILL_CATALOG

    catalog = []
    seen = set()
    for skill in SKILL_CATALOG:
        is_user = any(skill["name"].lower() in s.lower() or s.lower() in skill["name"].lower() for s in user_skills)
        if is_user:
            catalog.append({**skill, "status": "strong", "proficiency": min(skill["proficiency"] + 10, 99)})
            seen.add(skill["name"].lower())
        else:
            catalog.append(dict(skill))

    for s in user_skills:
        if s.lower() not in seen:
            catalog.append({
                "id": f"custom-{len(catalog) + 1}",
                "name": s,
                "category": "Specialized",
                "proficiency": 80,
                "status": "strong",
            })
            seen.add(s.lower())

    return catalog


@router.get("/gaps")
async def get_skill_gaps(current_user: dict = Depends(get_current_user)):
    try:
        return ai_service.skill_gaps(current_user)
    except AIServiceError as exc:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(exc)) from exc


@router.get("/target-profile")
async def get_target_profile(current_user: dict = Depends(get_current_user)):
    return {"target_career": current_user.get("target_career", ""), "skills": SKILL_CATALOG}
