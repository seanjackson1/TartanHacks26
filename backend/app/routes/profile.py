"""GET /profile - Retrieve current user's profile.
GET /profile/connections - Get connected OAuth providers.
POST /profile/refresh - Regenerate dna_string with latest platform data.
PUT /profile/interests - Update interests and regenerate dna_string.
PATCH /profile - Update current user's profile.
"""

from __future__ import annotations

import struct
from typing import Any

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from app.core.profile_pipeline import run_profile_pipeline
from app.core.supabase_auth import get_current_user
from app.db.supabase_client import (
    get_connected_providers,
    get_profile_by_id,
    update_profile,
    upsert_profile,
)
from app.models.schemas import ProfileUpdateRequest, User

router = APIRouter()

ALL_PROVIDERS = ["youtube", "steam", "github", "spotify"]


class ConnectionsResponse(BaseModel):
    connected: list[str]
    available: list[str]


def _parse_location(location: str | None) -> tuple[float, float] | None:
    """Parse PostGIS EWKB hex string to (latitude, longitude) tuple."""
    if not location:
        return None

    if "POINT" in location:
        try:
            inner = location.split("(")[1].split(")")[0]
            parts = inner.strip().split()
            lon, lat = float(parts[0]), float(parts[1])
            return (lat, lon)
        except (IndexError, ValueError):
            return None

    try:
        wkb = bytes.fromhex(location)
        if len(wkb) < 25:
            return None
        lon = struct.unpack_from("<d", wkb, 9)[0]
        lat = struct.unpack_from("<d", wkb, 17)[0]
        return (lat, lon)
    except (ValueError, struct.error):
        return None


@router.get("/profile", response_model=User | None)
def get_profile(current_user: dict = Depends(get_current_user)) -> User | None:
    """Get the current user's profile if it exists."""
    user_id = str(current_user.get("id"))
    profile = get_profile_by_id(user_id)

    if not profile:
        return None

    parsed_loc = _parse_location(profile.get("location"))
    lat = parsed_loc[0] if parsed_loc else None
    lon = parsed_loc[1] if parsed_loc else None

    return User(
        id=profile["id"],
        username=profile["username"],
        bio=profile.get("bio"),
        ideology_score=profile.get("ideology_score"),
        latitude=lat,
        longitude=lon,
        instagram_handle=profile.get("instagram_handle"),
        marker_color=profile.get("marker_color"),
        metadata=profile.get("metadata"),
        dna_string=profile.get("dna_string"),
    )


@router.patch("/profile", response_model=User | None)
def patch_profile(
    body: ProfileUpdateRequest,
    current_user: dict = Depends(get_current_user),
) -> User | None:
    """Update the current user's profile."""
    user_id = str(current_user.get("id"))

    # Check that user has an existing profile
    existing = get_profile_by_id(user_id)
    if not existing:
        raise HTTPException(status_code=404, detail="Profile not found")

    # Perform the update
    updated = update_profile(
        user_id,
        username=body.username,
        latitude=body.latitude,
        longitude=body.longitude,
        instagram_handle=body.instagram_handle,
    )

    if not updated:
        raise HTTPException(status_code=500, detail="Failed to update profile")

    parsed_loc = _parse_location(updated.get("location"))
    lat = parsed_loc[0] if parsed_loc else None
    lon = parsed_loc[1] if parsed_loc else None

    return User(
        id=updated["id"],
        username=updated["username"],
        bio=updated.get("bio"),
        ideology_score=updated.get("ideology_score"),
        latitude=lat,
        longitude=lon,
        instagram_handle=updated.get("instagram_handle"),
        marker_color=updated.get("marker_color"),
        metadata=updated.get("metadata"),
        dna_string=updated.get("dna_string"),
    )


@router.get("/profile/connections", response_model=ConnectionsResponse)
def get_connections(current_user: dict = Depends(get_current_user)) -> ConnectionsResponse:
    """Get list of connected and available OAuth providers."""
    user_id = str(current_user.get("id"))
    connected = get_connected_providers(user_id)
    available = [p for p in ALL_PROVIDERS if p not in connected]
    return ConnectionsResponse(connected=connected, available=available)


class RefreshResponse(BaseModel):
    success: bool
    interests_count: int
    dna_string: str


class UpdateInterestsRequest(BaseModel):
    interests: list[str]


def _save_profile_with_pipeline_result(
    *,
    user_id: str,
    profile: dict[str, Any],
    result: Any,  # ProfilePipelineResult
    current_user: dict,
) -> None:
    """Save profile with pipeline result (shared by update_interests and refresh_profile)."""
    metadata = profile.get("metadata") or {}
    user_metadata = current_user.get("user_metadata", {})
    avatar_url = user_metadata.get("avatar_url") or user_metadata.get("picture")

    new_metadata = {
        **metadata,
        "all_interests": result.all_interests,
        "avatar_url": avatar_url or metadata.get("avatar_url"),
    }

    # Get location from existing profile
    location = profile.get("location")
    parsed_loc = _parse_location(location)
    lat = parsed_loc[0] if parsed_loc else 0.0
    lon = parsed_loc[1] if parsed_loc else 0.0
    location_wkt = f"SRID=4326;POINT({lon} {lat})"

    upsert_profile(
        user_id=user_id,
        username=profile.get("username", "User"),
        location_wkt=location_wkt,
        embedding=result.embedding,
        bio=profile.get("bio"),
        ideology_score=profile.get("ideology_score"),
        instagram_handle=profile.get("instagram_handle"),
        marker_color=result.marker_color,
        metadata=new_metadata,
        dna_string=result.dna_string,
    )


@router.put("/profile/interests", response_model=RefreshResponse)
def update_interests(
    body: UpdateInterestsRequest,
    current_user: dict = Depends(get_current_user)
) -> RefreshResponse:
    """Update user interests and regenerate dna_string/embedding."""
    user_id = str(current_user.get("id"))
    
    # Validate interests
    interests = [i.strip() for i in body.interests if i.strip()]
    if not interests:
        raise HTTPException(status_code=400, detail="Interests cannot be empty")
    
    # Get existing profile
    profile = get_profile_by_id(user_id)
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    
    # Run the shared profile pipeline
    result = run_profile_pipeline(
        username=profile.get("username", "User"),
        bio=profile.get("bio"),
        user_interests=interests,
        user_id=user_id,
    )
    
    # Save profile
    _save_profile_with_pipeline_result(
        user_id=user_id,
        profile=profile,
        result=result,
        current_user=current_user,
    )
    
    return RefreshResponse(
        success=True,
        interests_count=len(result.all_interests),
        dna_string=result.dna_string,
    )


@router.post("/profile/refresh", response_model=RefreshResponse)
def refresh_profile(current_user: dict = Depends(get_current_user)) -> RefreshResponse:
    """Regenerate dna_string and embedding with latest platform data."""
    user_id = str(current_user.get("id"))
    
    # Get existing profile
    profile = get_profile_by_id(user_id)
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    
    # Get existing interests from metadata
    metadata = profile.get("metadata") or {}
    existing_interests = metadata.get("all_interests") or []
    
    if not existing_interests:
        raise HTTPException(status_code=400, detail="No interests found")
    
    # Run the shared profile pipeline
    result = run_profile_pipeline(
        username=profile.get("username", "User"),
        bio=profile.get("bio"),
        user_interests=existing_interests,
        user_id=user_id,
    )
    
    # Save profile
    _save_profile_with_pipeline_result(
        user_id=user_id,
        profile=profile,
        result=result,
        current_user=current_user,
    )
    
    return RefreshResponse(
        success=True,
        interests_count=len(result.all_interests),
        dna_string=result.dna_string,
    )
