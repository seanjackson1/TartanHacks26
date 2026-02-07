from __future__ import annotations

from fastapi import APIRouter, HTTPException

from app.integrations.discord import fetch_discord_interests

router = APIRouter(prefix="/discord", tags=["discord"])


@router.get("/interests")
def get_discord_interests(user_id: str):
    interests = fetch_discord_interests(user_id=user_id)
    if not interests:
        raise HTTPException(
            status_code=404,
            detail="No Discord interests found for this user",
        )
    return {"user_id": user_id, "interests": interests}
