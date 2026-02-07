from __future__ import annotations

from dataclasses import dataclass
from typing import Optional

from app.config import settings


@dataclass(frozen=True)
class ProviderConfig:
    name: str
    auth_url: str
    token_url: str
    userinfo_url: str
    scopes: list[str]
    supports_refresh: bool
    client_id: str
    client_secret: str


def get_provider_config(provider: str) -> Optional[ProviderConfig]:
    provider = provider.lower()
    if provider == "spotify":
        return ProviderConfig(
            name="spotify",
            auth_url="https://accounts.spotify.com/authorize",
            token_url="https://accounts.spotify.com/api/token",
            userinfo_url="https://api.spotify.com/v1/me",
            scopes=[
                "user-read-email",
                "user-top-read",
                "playlist-read-private",
            ],
            supports_refresh=True,
            client_id=settings.spotipy_client_id,
            client_secret=settings.spotipy_client_secret,
        )
    if provider == "github":
        return ProviderConfig(
            name="github",
            auth_url="https://github.com/login/oauth/authorize",
            token_url="https://github.com/login/oauth/access_token",
            userinfo_url="https://api.github.com/user",
            scopes=["read:user", "user:email"],
            supports_refresh=False,
            client_id=settings.github_client_id,
            client_secret=settings.github_client_secret,
        )
    if provider == "discord":
        return ProviderConfig(
            name="discord",
            auth_url="https://discord.com/api/oauth2/authorize",
            token_url="https://discord.com/api/oauth2/token",
            userinfo_url="https://discord.com/api/users/@me",
            scopes=["identify", "email", "guilds", "connections"],
            supports_refresh=True,
            client_id=settings.discord_client_id,
            client_secret=settings.discord_client_secret,
        )
    if provider in {"google", "youtube"}:
        return ProviderConfig(
            name="google",
            auth_url="https://accounts.google.com/o/oauth2/v2/auth",
            token_url="https://oauth2.googleapis.com/token",
            userinfo_url="https://openidconnect.googleapis.com/v1/userinfo",
            scopes=[
                "openid",
                "email",
                "profile",
                "https://www.googleapis.com/auth/youtube.readonly",
            ],
            supports_refresh=True,
            client_id=settings.google_client_id,
            client_secret=settings.google_client_secret,
        )
    if provider == "discord":
        return ProviderConfig(
            name="discord",
            auth_url="https://discord.com/api/oauth2/authorize",
            token_url="https://discord.com/api/oauth2/token",
            userinfo_url="https://discord.com/api/v10/users/@me",
            scopes=["identify", "guilds", "connections"],
            supports_refresh=True,
            client_id=settings.discord_client_id,
            client_secret=settings.discord_client_secret,
        )
    return None
