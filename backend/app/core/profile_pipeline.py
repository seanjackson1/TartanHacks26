"""Shared profile pipeline logic for generating dna_string and embeddings."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any

from app.core.openrouter_logic import generate_profile_summary, get_embedding
from app.db.supabase_client import get_oauth_account
from app.integrations.steam import fetch_steam_interests_sync
from app.integrations.youtube import fetch_youtube_interests
from app.models.schemas import CLUSTER_COLORS, InterestCluster


def choose_cluster(interests: list[str]) -> InterestCluster:
    """Determine user cluster based on interest keywords."""
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


@dataclass
class PlatformInterests:
    """Container for interests from connected platforms."""
    youtube: list[str]
    steam: list[str]


def fetch_platform_interests(user_id: str) -> PlatformInterests:
    """Fetch interests from all connected platforms for a user."""
    # YouTube
    youtube_interests = fetch_youtube_interests(user_id=user_id) or []
    if youtube_interests:
        print(f"DEBUG: Found {len(youtube_interests)} YouTube interests")

    # Steam
    steam_interests: list[str] = []
    steam_account = get_oauth_account(user_id, "steam")
    if steam_account and steam_account.get("provider_user_id"):
        steam_id = steam_account["provider_user_id"]
        steam_interests = fetch_steam_interests_sync(steam_id) or []
        if steam_interests:
            print(f"DEBUG: Found {len(steam_interests)} Steam interests")

    return PlatformInterests(youtube=youtube_interests, steam=steam_interests)


def merge_interests(
    user_interests: list[str],
    platform: PlatformInterests,
    dedupe: bool = True,
) -> list[str]:
    """Merge user interests with platform interests.
    
    Args:
        user_interests: Interests provided directly by user
        platform: Interests fetched from connected platforms
        dedupe: If True, remove duplicates (user interests take priority)
    
    Returns:
        Combined list of all interests
    """
    all_interests = user_interests + platform.youtube + platform.steam
    if dedupe:
        return list(dict.fromkeys(all_interests))
    return all_interests


@dataclass
class ProfilePipelineResult:
    """Result of running the profile pipeline."""
    dna_string: str
    embedding: list[float]
    marker_color: str
    all_interests: list[str]
    youtube_interests: list[str]
    steam_interests: list[str]


def run_profile_pipeline(
    *,
    username: str,
    bio: str | None,
    user_interests: list[str],
    user_id: str,
) -> ProfilePipelineResult:
    """Run the full profile pipeline: fetch platforms, merge, generate dna_string + embedding.
    
    Args:
        username: User's display name
        bio: User's bio text (optional)
        user_interests: Interests directly provided by user
        user_id: Supabase user ID for fetching OAuth connections
    
    Returns:
        ProfilePipelineResult with dna_string, embedding, and metadata
    """
    # Step 1: Fetch platform interests
    platform = fetch_platform_interests(user_id)
    
    # Step 2: Merge all interests (user first, deduplicated)
    all_interests = merge_interests(user_interests, platform, dedupe=True)
    
    # Step 3: Generate dna_string via LLM
    try:
        summary = generate_profile_summary(
            username=username,
            bio=bio,
            interests=all_interests,
            youtube_interests=platform.youtube,
            steam_interests=platform.steam,
        )
    except Exception as exc:
        print(f"DEBUG: summary generation failed: {exc}")
        summary = ""
    
    if not summary:
        bio_fragment = f" They mention: {bio}." if bio else ""
        summary = (
            f"{username} is interested in {', '.join(all_interests[:12])}."
            f"{bio_fragment} Their activity hints at broader, related interests."
        )
    
    dna_string = summary
    
    # Step 4: Generate embedding
    embedding = get_embedding(dna_string)
    
    # Step 5: Choose cluster and color
    cluster = choose_cluster(all_interests)
    marker_color = CLUSTER_COLORS[cluster]
    
    return ProfilePipelineResult(
        dna_string=dna_string,
        embedding=embedding,
        marker_color=marker_color,
        all_interests=all_interests,
        youtube_interests=platform.youtube,
        steam_interests=platform.steam,
    )
