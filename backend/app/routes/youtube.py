from __future__ import annotations

from fastapi import APIRouter, HTTPException

from app.integrations.youtube import fetch_youtube_interests

router = APIRouter(prefix="/youtube", tags=["youtube"])


@router.get("/interests")
def get_youtube_interests(user_id: str):
    interests = fetch_youtube_interests(user_id=user_id)
    if not interests:
        raise HTTPException(
            status_code=404,
            detail="No YouTube interests found for this user",
        )
    return {"user_id": user_id, "interests": interests}
