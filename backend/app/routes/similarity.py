"""GET /match/{other_user_id}/summary - Generate similarity summary between users."""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from app.core.openrouter_logic import generate_similarity_summary
from app.core.supabase_auth import get_current_user
from app.db.supabase_client import get_profile_by_id

router = APIRouter()


class SimilaritySummaryResponse(BaseModel):
    summary: str


@router.get("/match/{other_user_id}/summary", response_model=SimilaritySummaryResponse)
def get_similarity_summary(
    other_user_id: str,
    current_user: dict = Depends(get_current_user),
) -> SimilaritySummaryResponse:
    """Generate a 1-sentence summary of what two users have in common.
    
    Compares the current authenticated user's DNA string with the specified
    other user's DNA string and returns an LLM-generated similarity summary.
    """
    user_id = str(current_user.get("id"))
    
    # Get current user's profile
    current_profile = get_profile_by_id(user_id)
    if not current_profile:
        raise HTTPException(status_code=404, detail="Current user profile not found")
    
    # Get other user's profile
    other_profile = get_profile_by_id(other_user_id)
    if not other_profile:
        raise HTTPException(status_code=404, detail="Other user profile not found")
    
    # Get interests from metadata
    current_metadata = current_profile.get("metadata") or {}
    other_metadata = other_profile.get("metadata") or {}
    
    current_interests = current_metadata.get("all_interests") or []
    other_interests = other_metadata.get("all_interests") or []
    
    print(f"DEBUG similarity: current_interests count={len(current_interests)}, other_interests count={len(other_interests)}")
    print(f"DEBUG similarity: current_interests sample={current_interests[:5] if current_interests else 'EMPTY'}")
    print(f"DEBUG similarity: other_interests sample={other_interests[:5] if other_interests else 'EMPTY'}")
    
    # Generate similarity summary using LLM
    try:
        summary = generate_similarity_summary(current_interests, other_interests)
        print(f"DEBUG similarity: generated summary={summary}")
    except Exception as exc:
        print(f"DEBUG: similarity summary generation failed: {exc}")
        summary = "You both share similar interests."
    
    return SimilaritySummaryResponse(summary=summary)
