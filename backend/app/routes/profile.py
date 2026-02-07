"""GET /profile - Retrieve current user's profile."""

from __future__ import annotations

import struct

from fastapi import APIRouter, Depends, HTTPException

from app.core.supabase_auth import get_current_user
from app.db.supabase_client import get_profile_by_id
from app.models.schemas import User

router = APIRouter()


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
