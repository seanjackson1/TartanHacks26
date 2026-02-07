from __future__ import annotations

import logging
from typing import Any

import requests

from app.db.supabase_client import get_oauth_account

logger = logging.getLogger(__name__)


def _get_google_account(user_id: str) -> dict[str, Any] | None:
    account = get_oauth_account(user_id, "google")
    if account:
        return account
    return get_oauth_account(user_id, "youtube")


def fetch_youtube_interests(
    user_id: str | None = None,
    *,
    username: str | None = None,
    max_results: int = 10,
) -> list[str]:
    """
    Fetch basic YouTube interests using the Google OAuth token.
    Returns a list of interest strings. On any error, returns [].
    """
    if not user_id and username:
        return [f"YouTube creator: {username}"]

    if not user_id:
        return []

    account = _get_google_account(user_id)
    if not account or not account.get("access_token"):
        logger.warning("No Google OAuth account or access token for user %s", user_id)
        return []

    access_token = account["access_token"]
    headers = {"Authorization": f"Bearer {access_token}"}
    interests: list[str] = []

    try:
        # Fetch the user's channel (basic identity)
        channel_resp = requests.get(
            "https://www.googleapis.com/youtube/v3/channels",
            params={"part": "snippet", "mine": "true"},
            headers=headers,
            timeout=10,
        )
        if channel_resp.status_code == 401:
            logger.warning("YouTube token expired for user %s", user_id)
            return []
        channel_resp.raise_for_status()
        channel_data = channel_resp.json()
        items = channel_data.get("items", [])
        if items:
            title = items[0].get("snippet", {}).get("title")
            if title:
                interests.append(f"YouTube channel: {title}")

        # Fetch subscriptions (public signals of interest)
        subs_resp = requests.get(
            "https://www.googleapis.com/youtube/v3/subscriptions",
            params={
                "part": "snippet",
                "mine": "true",
                "maxResults": max_results,
            },
            headers=headers,
            timeout=10,
        )
        if subs_resp.status_code == 401:
            logger.warning("YouTube token expired for user %s", user_id)
            return interests
        subs_resp.raise_for_status()
        subs_data = subs_resp.json()
        for item in subs_data.get("items", []):
            snippet = item.get("snippet", {})
            channel_title = snippet.get("title")
            if channel_title:
                interests.append(f"Subscribed: {channel_title}")

        # Fetch most recently liked videos (playlist "LL")
        likes_resp = requests.get(
            "https://www.googleapis.com/youtube/v3/playlistItems",
            params={
                "part": "snippet",
                "playlistId": "LL",
                "maxResults": max_results,
            },
            headers=headers,
            timeout=10,
        )
        if likes_resp.status_code == 401:
            logger.warning("YouTube token expired for user %s", user_id)
            return interests
        likes_resp.raise_for_status()
        likes_data = likes_resp.json()
        for item in likes_data.get("items", []):
            snippet = item.get("snippet", {})
            title = snippet.get("title")
            if title and title != "Private video":
                interests.append(f"Liked: {title}")

    except requests.RequestException as exc:
        logger.warning("YouTube fetch failed for user %s: %s", user_id, exc)
        return []

    return interests
