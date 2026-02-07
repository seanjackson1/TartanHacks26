"""POST /search - Retrieve neighbors based on Mode (harmony/contrast)."""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException

from app.core.supabase_auth import get_current_user
from app.db.supabase_client import (
    find_contrast_matches,
    find_harmony_matches,
    get_profile_by_id,
    get_profiles_by_ids,
)
from app.models.schemas import MatchResult, Mode, SearchRequest, SearchResponse, User

router = APIRouter()


@router.post("/search", response_model=SearchResponse)
def search(
    request: SearchRequest, current_user: dict = Depends(get_current_user)
) -> SearchResponse:
    user_id = str(current_user.get("id"))
    profile = get_profile_by_id(user_id)
    if not profile:
        raise HTTPException(status_code=404, detail="User not found.")

    embedding = profile.get("embedding")
    location = profile.get("location")
    if not embedding or not location:
        raise HTTPException(
            status_code=400, detail="User must have embedding and location."
        )

    if request.mode == Mode.HARMONY:
        matches = find_harmony_matches(
            query_embedding=embedding,
            user_location_wkt=location,
            limit=request.limit,
        )
    else:
        min_distance = (request.radius_km or 5000) * 1000
        matches = find_contrast_matches(
            query_embedding=embedding,
            user_location_wkt=location,
            min_distance_meters=min_distance,
            limit=request.limit,
        )

    user_ids = [m["user_id"] for m in matches]
    profiles = get_profiles_by_ids(user_ids)
    profile_map = {p["id"]: p for p in profiles}

    results: list[MatchResult] = []
    for m in matches:
        user = profile_map.get(m["user_id"])
        if not user:
            continue

        similarity = m.get("similarity") or (1 - m.get("diversity", 0))
        distance_km = None
        if m.get("distance_meters") is not None:
            distance_km = m["distance_meters"] / 1000

        ideological_distance = None
        if user.get("ideology_score") is not None and profile.get("ideology_score") is not None:
            ideological_distance = abs(
                user["ideology_score"] - profile["ideology_score"]
            )

        results.append(
            MatchResult(
                user=User(
                    id=user["id"],
                    username=user["username"],
                    bio=user.get("bio"),
                    ideology_score=user.get("ideology_score"),
                    instagram_handle=user.get("instagram_handle"),
                    marker_color=user.get("marker_color"),
                    metadata=user.get("metadata"),
                    dna_string=user.get("dna_string"),
                ),
                similarity_score=similarity,
                ideological_distance=ideological_distance,
                distance_km=distance_km,
            )
        )

    return SearchResponse(matches=results, total_found=len(results), mode=request.mode)
