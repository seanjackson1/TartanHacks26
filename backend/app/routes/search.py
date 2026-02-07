"""POST /search - Retrieve neighbors based on Mode (harmony/contrast)."""

from __future__ import annotations

import struct

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


def _parse_location(location: str | dict | None) -> tuple[float, float] | None:
    """Parse PostGIS EWKB hex string OR GeoJSON dict to (latitude, longitude) tuple."""
    if not location:
        return None

    # Handle GeoJSON dict
    if isinstance(location, dict):
        try:
            coords = location.get("coordinates")
            if coords and len(coords) >= 2:
                # GeoJSON coordinates are [lon, lat]
                return (float(coords[1]), float(coords[0]))
        except (IndexError, ValueError, TypeError):
            return None
        return None

    # Handle WKT string
    if isinstance(location, str) and "POINT" in location:
        try:
            inner = location.split("(")[1].split(")")[0]
            parts = inner.strip().split()
            lon, lat = float(parts[0]), float(parts[1])
            return (lat, lon)
        except (IndexError, ValueError, AttributeError):
            return None

    # Handle WKB hex string
    try:
        if isinstance(location, str):
            wkb = bytes.fromhex(location)
            if len(wkb) < 25:
                return None
            lon = struct.unpack_from("<d", wkb, 9)[0]
            lat = struct.unpack_from("<d", wkb, 17)[0]
            return (lat, lon)
    except (ValueError, TypeError, struct.error):
        pass

    return None


@router.post("/search", response_model=SearchResponse)
def search(
    request: SearchRequest, current_user: dict = Depends(get_current_user)
) -> SearchResponse:
    user_id = str(current_user.get("id"))
    profile = get_profile_by_id(user_id)
    if not profile:
        raise HTTPException(status_code=404, detail="User not found.")

    embedding = profile.get("embedding")
    location_data = profile.get("location")

    # robustly parse location
    parsed_loc = _parse_location(location_data)

    if not embedding or not parsed_loc:
        raise HTTPException(
            status_code=400, detail="User must have embedding and location."
        )

    # Reconstruct WKT for RPC calls to ensure valid format
    lat, lon = parsed_loc
    location_wkt = f"SRID=4326;POINT({lon} {lat})"

    if request.mode == Mode.HARMONY:
        matches = find_harmony_matches(
            query_embedding=embedding,
            user_location_wkt=location_wkt,
            limit=request.limit,
        )
    else:
        # Contrast mode: find people with different interests (low similarity)
        # No distance filter - contrast is about diversity of interests, not location
        matches = find_contrast_matches(
            query_embedding=embedding,
            user_location_wkt=location_wkt,
            min_distance_meters=0,  # No minimum distance requirement
            limit=request.limit,
        )

    user_ids = [m["user_id"] for m in matches]
    profiles = get_profiles_by_ids(user_ids)
    profile_map = {p["id"]: p for p in profiles}

    results: list[MatchResult] = []
    for m in matches:
        # Skip the current user
        if m["user_id"] == user_id:
            continue

        user = profile_map.get(m["user_id"])
        if not user:
            continue

        similarity = m.get("similarity") or (1 - m.get("diversity", 0))
        distance_km = None
        if m.get("distance_meters") is not None:
            distance_km = m["distance_meters"] / 1000

        ideological_distance = None
        if (
            user.get("ideology_score") is not None
            and profile.get("ideology_score") is not None
        ):
            ideological_distance = abs(
                user["ideology_score"] - profile["ideology_score"]
            )

        # Parse location once
        parsed_loc = _parse_location(user.get("location"))
        lat = parsed_loc[0] if parsed_loc else None
        lon = parsed_loc[1] if parsed_loc else None

        results.append(
            MatchResult(
                user=User(
                    id=user["id"],
                    username=user["username"],
                    bio=user.get("bio"),
                    ideology_score=user.get("ideology_score"),
                    latitude=lat,
                    longitude=lon,
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
