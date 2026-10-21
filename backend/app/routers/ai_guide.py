from __future__ import annotations

from typing import List, Optional
from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field

from app.dependencies import get_current_user
from app.database import get_collection
from app.services.ai_service import ai_service, AIServiceError

router = APIRouter(prefix="/ai-guide", tags=["ai-guide"])


class ChatRequest(BaseModel):
    message: str = Field(..., max_length=1000)
    history: List[dict] = Field(default_factory=list, max_length=20)


@router.post("/chat")
async def chat(req: ChatRequest, current_user: dict = Depends(get_current_user)):
    msg = req.message.strip().lower()
    user_name = current_user.get("name", "Learner").split()[0]
    target_career = current_user.get("target_career") or "your target career"
    weekly_hours = current_user.get("weekly_learning_hours", 7)

    # Fetch user's active route to ground responses in real data
    routes_col = get_collection("routes")
    user_id = str(current_user["_id"])
    active_route = await routes_col.find_one({"user_id": user_id, "is_current": True})

    current_stage = active_route.get("current_stage", "") if active_route else ""
    next_checkpoint = active_route.get("next_checkpoint", "") if active_route else ""
    progress_pct = active_route.get("progress", 0) if active_route else 0
    stages = active_route.get("stages", []) if active_route else []
    remaining_stages = [s for s in stages if s.get("status") != "completed"]

    # Retrieve real skill gaps if possible
    top_gap = None
    try:
        gaps_report = ai_service.skill_gaps(current_user)
        gaps_list = gaps_report.get("skill_gaps", [])
        if gaps_list:
            top_gap = gaps_list[0].get("skill")
    except Exception:
        top_gap = None

    focus_topic = current_stage or top_gap or "Foundational Skills"

    if "why is this my next step" in msg or "next step" in msg:
        if current_stage:
            response = (
                f"{user_name}, '{current_stage}' is your active milestone on your route toward {target_career}. "
                f"The curriculum graph places it next because you have met the prerequisites. "
                f"Completing this checkpoint directly unlocks the subsequent stages in your learning path."
            )
        else:
            response = (
                f"{user_name}, your next step is focused on '{focus_topic}'. "
                f"Establishing this core competency is the prerequisite for advancing into {target_career} topics."
            )

    elif "skip" in msg:
        response = (
            f"Skipping '{focus_topic}' is not recommended. In the RouteMaster skill dependency graph, "
            f"this stage acts as a required prerequisite for your downstream {target_career} milestones. "
            f"Spending focused time here prevents knowledge gaps later when working on complex projects."
        )

    elif "practice today" in msg or "what should i practice" in msg or "today" in msg:
        checkpoint = next_checkpoint or focus_topic
        response = (
            f"Today, focus on practicing '{checkpoint}'. "
            f"With your {weekly_hours} hours/week schedule, dedicating 45–60 minutes to hands-on exercises "
            f"or a recommended project milestone will keep your momentum strong."
        )

    elif "why do i need this skill" in msg or "why do i need" in msg:
        response = (
            f"'{focus_topic}' is an essential requirement for {target_career}. "
            f"Our dataset shows that practical roles heavily require proficiency in this area "
            f"to successfully design, build, and evaluate real-world engineering solutions."
        )

    elif "how long" in msg or "duration" in msg or "weeks" in msg or "time" in msg:
        remaining_count = len(remaining_stages) or 4
        # Estimate ~1-2 weeks per remaining stage given weekly hours
        est_weeks = max(2, round(remaining_count * (10 / max(1, weekly_hours))))
        response = (
            f"Based on your commitment of {weekly_hours} hours/week and current progress of {progress_pct}%, "
            f"you have approximately {remaining_count} stages remaining. "
            f"At this pace, completing your {target_career} route will take roughly {est_weeks} weeks."
        )

    else:
        response = (
            f"Hello {user_name}! Based on your active profile for {target_career}, "
            f"your primary focus is currently '{focus_topic}' ({progress_pct}% overall progress). "
            f"Let me know if you would like guidance on why specific skills are sequenced, "
            f"how prerequisites are structured, or what exercises to tackle today."
        )

    return {"response": response, "role": "assistant"}
