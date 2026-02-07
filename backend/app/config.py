"""
Application configuration using environment variables.
Updated for Google Gemini AI (2026 Edition).
"""

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    # Supabase
    supabase_url: str
    supabase_service_role_key: str

    # Google Gemini AI
    gemini_api_key: str

    # Spotify (optional)
    spotipy_client_id: str = ""
    spotipy_client_secret: str = ""

    # Steam (optional)
    steam_api_key: str = ""

    # App settings
    debug: bool = False

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()
