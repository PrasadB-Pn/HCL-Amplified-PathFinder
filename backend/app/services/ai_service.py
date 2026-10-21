"""Thin integration layer between the production API and ``ai/src``.

The AI package owns all recommendation logic. This module only converts the
authenticated MongoDB user document to that package's input/output contracts.
"""
from __future__ import annotations

import logging
import sys
from pathlib import Path
from typing import Any

logger = logging.getLogger(__name__)
PROJECT_ROOT = Path(__file__).resolve().parents[3]
AI_ROOT, AI_DATA, AI_MODEL = PROJECT_ROOT / "ai", PROJECT_ROOT / "ai" / "data" / "processed", PROJECT_ROOT / "ai" / "model"


def _ensure_ai_import_path() -> None:
    """Expose ``ai/src`` as the ``src`` package from any Uvicorn cwd."""
    ai_root = str(AI_ROOT)
    if ai_root not in sys.path:
        sys.path.insert(0, ai_root)


# Some public service methods import their request schema before they create an
# engine. Initialise the authoritative AI package once at module import time so
# every ``from src...`` import is reliable, regardless of the launch directory.
_ensure_ai_import_path()


class AIServiceError(RuntimeError):
    """Safe boundary error; the original exception is logged server-side."""

class AIService:
    def __init__(self):
        self._career = self._gap = self._project = self._hybrid = self._roadmap = None

    @staticmethod
    def _ensure_import_path():
        _ensure_ai_import_path()

    @staticmethod
    def _profile(user: dict) -> dict[str, Any]:
        interests = user.get("interests") or ""
        # CareerRecommender accepts free text (or a RIASEC map), whereas the
        # production user document stores interests as a list of selections.
        if isinstance(interests, list):
            interests = ", ".join(str(item) for item in interests)
        return {"current_skills": user.get("skills") or [], "transferable_skills": [],
                "interests": interests, "target_career": user.get("target_career") or None}

    def _career_engine(self):
        if self._career is None:
            self._ensure_import_path()
            from src.career_recommender.recommender import CareerRecommender
            self._career = CareerRecommender(processed_dir=AI_DATA, model_dir=AI_MODEL)
        return self._career

    def _gap_engine(self):
        if self._gap is None:
            self._ensure_import_path()
            from src.gap_engine.gap_engine import SkillGapEngine
            self._gap = SkillGapEngine(processed_dir=AI_DATA)
        return self._gap

    def _canonical_target(self, user: dict, requested: str | None = None) -> str:
        target = (requested or user.get("target_career") or "").strip()
        target = {"ai / ml engineer": "AI Engineer", "generative ai engineer": "AI Engineer",
                  "software development engineer": "Software Engineer"}.get(target.lower(), target)
        career = self._career_engine().get_career_by_id_or_title(target)
        if career:
            return career["career_title"]
        recommendations = self._career_engine().recommend(self._profile(user), top_k=1)["recommendations"]
        if not recommendations:
            raise AIServiceError("No career could be resolved for this profile")
        return recommendations[0]["career"]

    def career_recommendations(self, user: dict, overrides: dict[str, Any] | None = None) -> list[dict]:
        profile_user = dict(user)
        if overrides:
            for field in ("target_career", "skills", "interests"):
                if overrides.get(field) is not None:
                    profile_user[field] = overrides[field]
        try:
            result = self._career_engine().recommend(self._profile(profile_user), top_k=4)
            careers = {c["career_id"]: c for c in self._career_engine().careers_list}
            return [{"id": record["career_id"], "title": record["career"], "match": round(record["match_score"]),
                     "is_primary": index == 0, "isPrimary": index == 0, "reasons": [record["explanation"]],
                     "description": careers.get(record["career_id"], {}).get("career_description") or record["explanation"]}
                    for index, record in enumerate(result["recommendations"])]
        except Exception as exc:
            logger.exception("Career recommendation engine failed")
            raise AIServiceError("Career recommendations are temporarily unavailable") from exc

    def skill_gaps(self, user: dict, target: str | None = None) -> dict:
        try:
            from src.gap_engine.schemas import SkillGapRequest
            report = self._gap_engine().calculate_gap(SkillGapRequest(
                current_skills=user.get("skills") or [], target_career=self._canonical_target(user, target))).model_dump()
            gaps = [{"skill": item["skill_name"], "current": 0, "required": 100, "gap": 100, "priority": priority}
                    for priority, items in report["priority_gaps"].items() for item in items]
            report.update({
                "target_career": report.get("target_career_title", target or ""),
                "matching_skills": [s["skill_name"] for s in report["matched_technical_skills"]],
                "missing_skills": [s["skill_name"] for s in report["missing_technical_skills"]],
                "match_percentage": round(report.get("technical_match_percentage", 0)),
                "current_skills": [s["skill_name"] for s in report["matched_technical_skills"]],
                "required_skills": [s["skill_name"] for s in report["matched_technical_skills"] + report["missing_technical_skills"]],
                "skill_gaps": gaps,
            })
            return report
        except Exception as exc:
            logger.exception("Skill gap engine failed")
            raise AIServiceError("Skill-gap analysis is temporarily unavailable") from exc

    def _project_engine(self):
        if self._project is None:
            self._ensure_import_path()
            from src.project_recommender.engine import ProjectRecommender
            self._project = ProjectRecommender(processed_dir=AI_DATA, model_dir=AI_MODEL)
        return self._project

    def _hybrid_engine(self):
        if self._hybrid is None:
            self._ensure_import_path()
            from src.hybrid_recommender.engine import HybridRecommender
            self._hybrid = HybridRecommender(processed_dir=AI_DATA, model_dir=AI_MODEL)
        return self._hybrid

    def projects(self, user: dict) -> list[dict]:
        try:
            from src.project_recommender.schemas import ProjectRecommendationRequest
            result = self._project_engine().recommend_projects(ProjectRecommendationRequest(
                skills=user.get("skills") or [], interests=user.get("interests") or "", target_role=self._canonical_target(user),
                difficulty=user.get("experience") or "Any Level", top_k=10)).model_dump()
            return [{"id": p["project_id"], "title": p["project_name"], "status": "recommended", "stage": p["domain"],
                     "skills": p["skills_to_develop"], "difficulty": p["difficulty"], "estimated_hours": 0,
                     "description": p["reason"], "why": p["reason"], "url": p["github_url"]} for p in result["projects"]]
        except Exception as exc:
            logger.exception("Project recommendation engine failed")
            raise AIServiceError("Project recommendations are temporarily unavailable") from exc

    def resources(self, user: dict) -> list[dict]:
        try:
            from src.hybrid_recommender.schemas import RecommendationRequest
            result = self._hybrid_engine().recommend(RecommendationRequest(
                current_skills=user.get("skills") or [], interests=user.get("interests") or "",
                target_career=self._canonical_target(user), difficulty=user.get("experience") or "Any Level", top_k=10)).model_dump()
            return [{"id": c["course_id"], "title": c["course_name"], "subtitle": c["organization"], "type": "course",
                     "duration": "", "level": c["course_difficulty"], "skills": c["missing_relevant_skills"],
                     "relevance": round(c["final_score"] * 100), "is_current": False, "description": c["reason"],
                     "url": c["course_url"]} for c in result["courses"]]
        except Exception as exc:
            logger.exception("Course recommendation engine failed")
            raise AIServiceError("Resource recommendations are temporarily unavailable") from exc

    def route(self, user: dict, target: str | None = None) -> dict:
        try:
            if self._roadmap is None:
                self._ensure_import_path()
                from src.roadmap_generator.engine import RoadmapGenerator
                self._roadmap = RoadmapGenerator(processed_dir=AI_DATA, model_dir=AI_MODEL)
            from src.roadmap_generator.schemas import RoadmapRequest
            result = self._roadmap.generate_roadmap(RoadmapRequest(skills=user.get("skills") or [], interests=user.get("interests") or "",
                target_role=self._canonical_target(user, target), difficulty=user.get("experience") or "Any Level")).model_dump()
            stages = [{"id": n["id"], "number": f"{n['sequence']:02d}", "title": n["skill_name"],
                       "status": "completed" if n["status"] == "completed" else "current" if n["status"] == "next" else "upcoming",
                       "skills": [n["skill_name"]], "completed_skills": [n["skill_name"]] if n["status"] == "completed" else [],
                       "current_skill": n["skill_name"] if n["status"] == "next" else None,
                       "upcoming_skills": [] if n["status"] == "completed" else [n["skill_name"]], "estimated_minutes": 0}
                      for n in result["nodes"]]
            summary, current = result["summary"], next((s for s in stages if s["status"] == "current"), stages[0] if stages else {})
            return {"title": result["career"]["career_title"], "progress": round(summary["progress_percentage"]), "status": "active",
                    "is_current": True, "current_stage": current.get("title", ""), "next_checkpoint": current.get("current_skill") or current.get("title", ""),
                    "estimated_weeks": 0, "weekly_hours": user.get("weekly_learning_hours", 7), "level": user.get("experience") or "",
                    "total_stages": len(stages), "total_skills": len(stages), "total_projects": sum(len(n["projects"]) for n in result["nodes"]),
                    "stages": stages, "ai_roadmap": result}
        except Exception as exc:
            logger.exception("Roadmap generator failed")
            raise AIServiceError("Route generation is temporarily unavailable") from exc

ai_service = AIService()
