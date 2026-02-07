"""
Application configuration using environment variables.
Uses OpenRouter as the AI provider.
"""

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    # Supabase
    supabase_url: str
    supabase_service_role_key: str
    supabase_anon_key: str

    # OpenRouter
    openrouter_api_key: str
    openrouter_base_url: str = "https://openrouter.ai/api/v1"

    # Spotify (optional)
    spotipy_client_id: str = ""
    spotipy_client_secret: str = ""

    # GitHub (optional)
    github_client_id: str = ""
    github_client_secret: str = ""

    # Google / YouTube (optional)
    google_client_id: str = ""
    google_client_secret: str = ""

    # Steam (optional)
    steam_api_key: str = ""

    # OAuth settings
    oauth_redirect_base_url: str = "http://localhost:8001"
    oauth_state_secret: str = "change-me"

    # App settings
    debug: bool = False

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()
