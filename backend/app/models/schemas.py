"""
Pydantic data models for the Global Mosaic API.
Uses OpenRouter with intfloat/e5-large-v2 (1024 dimensions).
"""

from datetime import datetime
from enum import Enum
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, Field


# ============================================================================
# Constants
# ============================================================================

EMBEDDING_DIMENSIONS = 1024  # intfloat/e5-large-v2


# ============================================================================
# Enums
# ============================================================================


class Mode(str, Enum):
    """Search mode for finding neighbors."""

    HARMONY = "harmony"  # Find similar users (cosine similarity ASC)
    CONTRAST = "contrast"  # Find diverse users (cosine similarity DESC)


class InterestCluster(str, Enum):
    """User interest cluster categories for marker colors."""

    TECH_DEV = "tech"  # #00F2FF (Cyan)
    CREATIVE_ARTS = "arts"  # #FF007A (Magenta)
    GAMING = "gaming"  # #ADFF2F (Green)
    FITNESS = "fitness"  # #FFA500 (Orange)


class InterestSource(str, Enum):
    """Source of user interests."""

    SPOTIFY = "spotify"
    STEAM = "steam"
    MANUAL_BELI = "manual_beli"
    MANUAL_HEVY = "manual_hevy"


# ============================================================================
# Database Models (matching Supabase schema)
# ============================================================================


class User(BaseModel):
    """User profile from the `profiles` table."""

    id: UUID
    username: str
    bio: Optional[str] = None
    ideology_score: Optional[int] = Field(
        None, ge=1, le=10, description="1=Left, 10=Right"
    )
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    instagram_handle: Optional[str] = None
    embedding: Optional[list[float]] = Field(
        None, description="1024-dim vector from intfloat/e5-large-v2"
    )
    marker_color: Optional[str] = Field(None, pattern=r"^#[0-9A-Fa-f]{6}$")
    metadata: Optional[dict] = None  # JSONB for extracted top interests
    dna_string: Optional[str] = None  # Raw text for embedding

    class Config:
        from_attributes = True


class Interest(BaseModel):
    """User interest from the `interests` table."""

    id: UUID
    user_id: UUID
    source: InterestSource
    raw_text: str
    timestamp: datetime

    class Config:
        from_attributes = True


# ============================================================================
# Request/Response Models for API Endpoints
# ============================================================================

# --- /ingest endpoint ---


class IngestRequest(BaseModel):
    """Request body for POST /ingest."""

    user_id: Optional[UUID] = None
    username: str
    interests: list[str] = Field(
        ..., description="List of interest strings to vectorize"
    )
    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(..., ge=-180, le=180)
    bio: Optional[str] = None
    ideology_score: Optional[int] = Field(None, ge=1, le=10)
    instagram_handle: Optional[str] = None
    youtube_username: Optional[str] = None
    steam_id: Optional[str] = None
    github_username: Optional[str] = None


class IngestResponse(BaseModel):
    """Response body for POST /ingest."""

    user_id: UUID
    marker_color: str
    message: str = "Profile successfully created and vectorized"


# --- /search endpoint ---


class SearchRequest(BaseModel):
    """Request body for POST /search."""

    mode: Mode
    limit: int = Field(10, ge=1, le=100)
    radius_km: Optional[float] = Field(
        None, ge=0, description="Max distance in km, uses ST_DWithin"
    )


class MatchResult(BaseModel):
    """A single match result with similarity score."""

    user: User
    similarity_score: float = Field(
        ..., ge=0, le=1, description="Cosine similarity score"
    )
    ideological_distance: Optional[int] = Field(
        None, description="Absolute difference in ideology scores"
    )
    composite_score: Optional[float] = Field(
        None, description="Weighted composite score"
    )
    distance_km: Optional[float] = None


class SearchResponse(BaseModel):
    """Response body for POST /search."""

    matches: list[MatchResult]
    total_found: int
    mode: Mode


# --- User CRUD ---


class UserCreate(BaseModel):
    """Create a new user profile."""

    username: str
    bio: Optional[str] = None
    ideology_score: Optional[int] = Field(None, ge=1, le=10)
    latitude: float
    longitude: float
    instagram_handle: Optional[str] = None


class UserResponse(BaseModel):
    """Public user response (no embedding data)."""

    id: UUID
    username: str
    bio: Optional[str] = None
    marker_color: Optional[str] = None
    metadata: Optional[dict] = None

    class Config:
        from_attributes = True


class InterestCreate(BaseModel):
    """Add an interest to a user."""

    user_id: UUID
    source: InterestSource
    raw_text: str


# --- OAuth ---


class OAuthRefreshRequest(BaseModel):
    """Request body for POST /auth/{provider}/refresh."""

    user_id: UUID


class OAuthCallbackResponse(BaseModel):
    """Response body for OAuth callbacks."""

    connected: bool
    provider: str
    provider_user_id: str


# ============================================================================
# Matching Algorithm Constants (from CLAUDE.md)
# ============================================================================

MATCHING_WEIGHTS = {
    "interest_similarity": 0.7,  # W1
    "ideological_diversity": 0.3,  # W2
}

CLUSTER_COLORS = {
    InterestCluster.TECH_DEV: "#00F2FF",  # Cyan
    InterestCluster.CREATIVE_ARTS: "#FF007A",  # Magenta
    InterestCluster.GAMING: "#ADFF2F",  # Green
    InterestCluster.FITNESS: "#FFA500",  # Orange
}
