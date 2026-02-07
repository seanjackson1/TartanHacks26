from __future__ import annotations

import logging
from typing import Any

import requests

from app.db.supabase_client import get_oauth_account

logger = logging.getLogger(__name__)

DISCORD_API_BASE = "https://discord.com/api/v10"


def _get_discord_account(user_id: str) -> dict[str, Any] | None:
    return get_oauth_account(user_id, "discord")


def _make_discord_request(
    url: str,
    headers: dict[str, str],
    user_id: str,
) -> requests.Response | None:
    """
    Make a Discord API request.
    Returns the response on success, or None if the request fails.
    """
    try:
        resp = requests.get(url, headers=headers, timeout=10)
        
        if resp.status_code == 401:
            logger.warning("Discord token expired for user %s", user_id)
            return None
        
        return resp
    except requests.RequestException as exc:
        logger.warning("Discord request failed for user %s: %s", user_id, exc)
        return None


def fetch_discord_guilds(user_id: str, max_guilds: int = 20) -> list[str]:
    """
    Fetch the user's Discord servers (guilds).
    Returns a list of guild names.
    """
    account = _get_discord_account(user_id)
    if not account or not account.get("access_token"):
        logger.warning("No Discord OAuth account or access token for user %s", user_id)
        return []

    access_token = account["access_token"]
    headers = {"Authorization": f"Bearer {access_token}"}
    
    resp = _make_discord_request(
        f"{DISCORD_API_BASE}/users/@me/guilds",
        headers,
        user_id,
    )
    
    if not resp or not resp.ok:
        return []
    
    try:
        guilds = resp.json()
        guild_names = [g.get("name") for g in guilds if g.get("name")]
        return guild_names[:max_guilds]
    except Exception as exc:
        logger.warning("Failed to parse Discord guilds for user %s: %s", user_id, exc)
        return []


def fetch_discord_connections(user_id: str) -> list[str]:
    """
    Fetch the user's connected accounts (Spotify, Steam, GitHub, etc.).
    Returns a list of connection descriptions.
    """
    account = _get_discord_account(user_id)
    if not account or not account.get("access_token"):
        logger.warning("No Discord OAuth account or access token for user %s", user_id)
        return []

    access_token = account["access_token"]
    headers = {"Authorization": f"Bearer {access_token}"}
    
    resp = _make_discord_request(
        f"{DISCORD_API_BASE}/users/@me/connections",
        headers,
        user_id,
    )
    
    if not resp or not resp.ok:
        return []
    
    try:
        connections = resp.json()
        connection_strs = []
        for conn in connections:
            platform = conn.get("type", "Unknown")
            name = conn.get("name", "")
            if name:
                connection_strs.append(f"{platform}: {name}")
        return connection_strs
    except Exception as exc:
        logger.warning("Failed to parse Discord connections for user %s: %s", user_id, exc)
        return []


def fetch_discord_user(user_id: str) -> dict[str, Any]:
    """
    Fetch the user's Discord profile info.
    Returns user data dict with username, avatar, etc.
    """
    account = _get_discord_account(user_id)
    if not account or not account.get("access_token"):
        logger.warning("No Discord OAuth account or access token for user %s", user_id)
        return {}

    access_token = account["access_token"]
    headers = {"Authorization": f"Bearer {access_token}"}
    
    resp = _make_discord_request(
        f"{DISCORD_API_BASE}/users/@me",
        headers,
        user_id,
    )
    
    if not resp or not resp.ok:
        return {}
    
    try:
        return resp.json()
    except Exception as exc:
        logger.warning("Failed to parse Discord user for user %s: %s", user_id, exc)
        return {}


def fetch_discord_interests(user_id: str, max_guilds: int = 15) -> list[str]:
    """
    Convenience function that aggregates Discord interests.
    Fetches guilds (servers) and connected accounts.
    Returns a list of interest strings.
    """
    interests: list[str] = []
    
    # Get user info
    user_data = fetch_discord_user(user_id)
    username = user_data.get("username") or user_data.get("global_name")
    if username:
        interests.append(f"Discord user: {username}")
    
    # Get guilds (servers)
    guilds = fetch_discord_guilds(user_id, max_guilds)
    for guild in guilds:
        interests.append(f"Server: {guild}")
    
    # Get connected accounts
    connections = fetch_discord_connections(user_id)
    for conn in connections:
        interests.append(f"Connected: {conn}")
    
    return interests
