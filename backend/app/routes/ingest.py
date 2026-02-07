"""POST /ingest - Convert raw user data into a Personality Vector."""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException

from app.core.profile_pipeline import run_profile_pipeline
from app.core.supabase_auth import get_current_user
from app.db.supabase_client import upsert_profile
from app.models.schemas import IngestRequest, IngestResponse

router = APIRouter()


@router.post("/ingest", response_model=IngestResponse)
def ingest(
    request: IngestRequest, current_user: dict = Depends(get_current_user)
) -> IngestResponse:
    try:
        user_id = str(current_user.get("id"))
        print(f"DEBUG: ingest user_id={user_id!r}")

        # Validate interests
        interests = [i.strip() for i in request.interests if i.strip()]
        if not interests:
            raise HTTPException(
                status_code=400, detail="Interests list cannot be empty."
            )

        # Run the shared profile pipeline
        result = run_profile_pipeline(
            username=request.username,
            bio=request.bio,
            user_interests=interests,
            user_id=user_id,
        )

        # Get avatar URL from auth user metadata
        user_metadata = current_user.get("user_metadata", {})
        avatar_url = user_metadata.get("avatar_url") or user_metadata.get("picture")

        metadata = {
            "all_interests": result.all_interests,
            "youtube_username": request.youtube_username,
            "steam_id": request.steam_id,
            "github_username": request.github_username,
            "avatar_url": avatar_url,
        }

        location_wkt = f"SRID=4326;POINT({request.longitude} {request.latitude})"

        if request.user_id and str(request.user_id) != user_id:
            raise HTTPException(status_code=403, detail="User ID mismatch.")

        profile = upsert_profile(
            user_id=user_id,
            username=request.username,
            location_wkt=location_wkt,
            embedding=result.embedding,
            bio=request.bio,
            ideology_score=request.ideology_score,
            instagram_handle=request.instagram_handle,
            marker_color=result.marker_color,
            metadata=metadata,
            dna_string=result.dna_string,
        )

        return IngestResponse(user_id=profile["id"], marker_color=result.marker_color)
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc
