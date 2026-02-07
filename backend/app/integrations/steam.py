from __future__ import annotations

import logging
from typing import Any

import httpx

from app.config import settings

logger = logging.getLogger(__name__)

STEAM_API_BASE = "https://api.steampowered.com"


async def fetch_recently_played_games(steam_id: str, limit: int = 10) -> list[str]:
    """
    Returns a list of recently played game names.
    """
    if not steam_id or not settings.steam_api_key:
        return []
    url = f"{STEAM_API_BASE}/IPlayerService/GetRecentlyPlayedGames/v0001/"
    params = {"key": settings.steam_api_key, "steamid": steam_id, "format": "json"}
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.get(url, params=params)
            resp.raise_for_status()
            games = resp.json().get("response", {}).get("games", [])
            names = [g.get("name") for g in games if g.get("name")]
            return names[:limit]
    except Exception as exc:
        logger.warning("Steam recently played fetch failed: %s", exc)
        return []


async def fetch_owned_games(steam_id: str, limit: int = 10) -> list[str]:
    """
    Returns a list of owned games ordered by playtime (desc).
    """
    if not steam_id or not settings.steam_api_key:
        return []
    url = f"{STEAM_API_BASE}/IPlayerService/GetOwnedGames/v0001/"
    params = {
        "key": settings.steam_api_key,
        "steamid": steam_id,
        "include_appinfo": "1",
        "format": "json",
    }
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.get(url, params=params)
            resp.raise_for_status()
            games = resp.json().get("response", {}).get("games", [])
            games.sort(key=lambda g: g.get("playtime_forever", 0), reverse=True)
            names = [g.get("name") for g in games if g.get("name")]
            return names[:limit]
    except Exception as exc:
        logger.warning("Steam owned games fetch failed: %s", exc)
        return []


async def fetch_user_summary(steam_id: str) -> dict[str, Any]:
    """
    Returns user summary info (profile name, avatar, etc.).
    """
    if not steam_id or not settings.steam_api_key:
        return {}
    url = f"{STEAM_API_BASE}/ISteamUser/GetPlayerSummaries/v0002/"
    params = {"key": settings.steam_api_key, "steamids": steam_id}
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.get(url, params=params)
            resp.raise_for_status()
            players = resp.json().get("response", {}).get("players", [])
            return players[0] if players else {}
    except Exception as exc:
        logger.warning("Steam user summary fetch failed: %s", exc)
        return {}


async def fetch_steam_interests(steam_id: str) -> list[str]:
    """
    Convenience function that aggregates Steam interests.
    """
    recent = await fetch_recently_played_games(steam_id)
    top_owned = await fetch_owned_games(steam_id)
    interests = []
    interests.extend([f"Recently played: {g}" for g in recent])
    interests.extend([f"Top owned: {g}" for g in top_owned])
    return interests


def fetch_steam_interests_sync(steam_id: str) -> list[str]:
    """Synchronous wrapper for use in sync endpoints like /ingest."""
    import asyncio

    return asyncio.run(fetch_steam_interests(steam_id))
