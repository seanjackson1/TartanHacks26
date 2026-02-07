"""POST /ingest - Convert raw user data into a Personality Vector."""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException

from app.core.openrouter_logic import get_embedding
from app.core.supabase_auth import get_current_user
from app.db.supabase_client import upsert_profile
from app.integrations.youtube import fetch_youtube_interests
from app.models.schemas import (
    CLUSTER_COLORS,
    IngestRequest,
    IngestResponse,
    InterestCluster,
)

router = APIRouter()


def _choose_cluster(interests: list[str]) -> InterestCluster:
    blob = " ".join(interests).lower()
    if any(k in blob for k in ["code", "dev", "developer", "software", "ai", "tech"]):
        return InterestCluster.TECH_DEV
    if any(k in blob for k in ["art", "design", "music", "creative", "photo", "film"]):
        return InterestCluster.CREATIVE_ARTS
    if any(k in blob for k in ["game", "gaming", "esports", "steam"]):
        return InterestCluster.GAMING
    if any(k in blob for k in ["fitness", "gym", "workout", "run", "yoga", "sport"]):
        return InterestCluster.FITNESS
    return InterestCluster.TECH_DEV


@router.post("/ingest", response_model=IngestResponse)
def ingest(
    request: IngestRequest, current_user: dict = Depends(get_current_user)
) -> IngestResponse:
    try:
        user_id = str(current_user.get("id"))
        print(f"DEBUG: ingest user_id={user_id!r}")
        
        # Get user-provided interests
        interests = [i.strip() for i in request.interests if i.strip()]
        
        # Fetch and merge YouTube interests (if OAuth connected)
        youtube_interests = fetch_youtube_interests(user_id=user_id)
        if youtube_interests:
            print(f"DEBUG: Found {len(youtube_interests)} YouTube interests")
            interests = interests + youtube_interests
        
        if not interests:
            raise HTTPException(
                status_code=400, detail="Interests list cannot be empty."
            )

        dna_parts = [
            f"Username: {request.username}",
            f"Bio: {request.bio}" if request.bio else None,
            "Interests: " + ", ".join(interests),
        ]
        dna_string = "\n".join([p for p in dna_parts if p])

        embedding = get_embedding(dna_string)
        cluster = _choose_cluster(interests)
        marker_color = CLUSTER_COLORS[cluster]
        metadata = {
            "interests": interests[:5],
            "youtube_username": request.youtube_username,
            "steam_id": request.steam_id,
            "github_username": request.github_username,
        }

        location_wkt = f"SRID=4326;POINT({request.longitude} {request.latitude})"

        if request.user_id and str(request.user_id) != user_id:
            raise HTTPException(status_code=403, detail="User ID mismatch.")

        profile = upsert_profile(
            user_id=user_id,
            username=request.username,
            location_wkt=location_wkt,
            embedding=embedding,
            bio=request.bio,
            ideology_score=request.ideology_score,
            instagram_handle=request.instagram_handle,
            marker_color=marker_color,
            metadata=metadata,
            dna_string=dna_string,
        )

        return IngestResponse(user_id=profile["id"], marker_color=marker_color)
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc
