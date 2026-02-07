from __future__ import annotations

from fastapi import APIRouter, HTTPException

from app.integrations.github import fetch_github_interests

router = APIRouter(prefix="/github", tags=["github"])


@router.get("/interests")
def get_github_interests(user_id: str):
    interests = fetch_github_interests(user_id=user_id)
    if not interests:
        raise HTTPException(
            status_code=404,
            detail="No GitHub interests found for this user",
        )
    return {"user_id": user_id, "interests": interests}
