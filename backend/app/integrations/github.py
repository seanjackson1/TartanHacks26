from __future__ import annotations

import logging
from typing import Any

import requests

from app.db.supabase_client import get_oauth_account

logger = logging.getLogger(__name__)


def _get_github_account(user_id: str) -> dict[str, Any] | None:
    return get_oauth_account(user_id, "github")


def fetch_github_interests(user_id: str, max_repos: int = 10) -> list[str]:
    """
    Fetch GitHub interests using the stored OAuth token.
    Returns a list of interest strings. On any error, returns [].
    """
    account = _get_github_account(user_id)
    if not account or not account.get("access_token"):
        logger.warning("No GitHub OAuth account or access token for user %s", user_id)
        return []

    access_token = account["access_token"]
    headers = {
        "Authorization": f"Bearer {access_token}",
        "Accept": "application/vnd.github+json",
        "User-Agent": "tartanhacks-backend",
    }
    interests: list[str] = []

    try:
        # Get the authenticated user
        user_resp = requests.get("https://api.github.com/user", headers=headers, timeout=10)
        if user_resp.status_code == 401:
            logger.warning("GitHub token expired for user %s", user_id)
            return []
        user_resp.raise_for_status()
        user_data = user_resp.json()
        login = user_data.get("login")
        if login:
            interests.append(f"GitHub user: {login}")

        # Fetch repos (most recently updated)
        repos_resp = requests.get(
            "https://api.github.com/user/repos",
            params={"per_page": max_repos, "sort": "updated"},
            headers=headers,
            timeout=10,
        )
        if repos_resp.status_code == 401:
            logger.warning("GitHub token expired for user %s", user_id)
            return interests
        repos_resp.raise_for_status()
        repos = repos_resp.json()
        for repo in repos:
            name = repo.get("name")
            lang = repo.get("language")
            if name:
                interests.append(f"Repo: {name}")
            if lang:
                interests.append(lang)

        # Fetch starred repos
        starred_resp = requests.get(
            "https://api.github.com/user/starred",
            params={"per_page": max_repos},
            headers=headers,
            timeout=10,
        )
        if starred_resp.status_code == 401:
            logger.warning("GitHub token expired for user %s", user_id)
            return interests
        starred_resp.raise_for_status()
        starred = starred_resp.json()
        for repo in starred:
            name = repo.get("name")
            if name:
                interests.append(f"Starred: {name}")

    except requests.RequestException as exc:
        logger.warning("GitHub fetch failed for user %s: %s", user_id, exc)
        return []

    return interests
