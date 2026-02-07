from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Optional
from urllib.parse import urlencode

import requests

from app.config import settings

OAUTH_TABLE = "oauth_accounts"
PROFILES_TABLE = "profiles"


def _rest_base() -> str:
    return settings.supabase_url.rstrip("/") + "/rest/v1"


def _headers() -> dict[str, str]:
    return {
        "apikey": settings.supabase_service_role_key,
        "Authorization": f"Bearer {settings.supabase_service_role_key}",
        "Content-Type": "application/json",
    }


def upsert_oauth_account(
    *,
    user_id: str,
    provider: str,
    provider_user_id: str,
    access_token: str,
    refresh_token: Optional[str],
    expires_at: Optional[datetime],
    raw_token: Optional[dict[str, Any]] = None,
) -> dict[str, Any]:
    payload: dict[str, Any] = {
        "user_id": user_id,
        "provider": provider,
        "provider_user_id": provider_user_id,
        "access_token": access_token,
        "refresh_token": refresh_token,
        "expires_at": expires_at.isoformat() if expires_at else None,
        "raw_token": raw_token,
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }
    url = f"{_rest_base()}/{OAUTH_TABLE}"
    params = {"on_conflict": "user_id,provider"}
    headers = _headers() | {
        "Prefer": "resolution=merge-duplicates,return=representation"
    }
    resp = requests.post(url, params=params, json=payload, headers=headers, timeout=10)
    resp.raise_for_status()
    data = resp.json()
    return data[0] if isinstance(data, list) and data else payload


def get_oauth_account(user_id: str, provider: str) -> Optional[dict[str, Any]]:
    url = f"{_rest_base()}/{OAUTH_TABLE}"
    query = {
        "user_id": f"eq.{user_id}",
        "provider": f"eq.{provider}",
        "limit": 1,
    }
    resp = requests.get(url + "?" + urlencode(query), headers=_headers(), timeout=10)
    resp.raise_for_status()
    data = resp.json()
    return data[0] if isinstance(data, list) and data else None


def get_connected_providers(user_id: str) -> list[str]:
    """Get list of OAuth providers connected by a user."""
    url = f"{_rest_base()}/{OAUTH_TABLE}"
    query = {
        "user_id": f"eq.{user_id}",
        "select": "provider",
    }
    resp = requests.get(url + "?" + urlencode(query), headers=_headers(), timeout=10)
    resp.raise_for_status()
    data = resp.json()
    return [row["provider"] for row in data] if isinstance(data, list) else []


def upsert_profile(
    *,
    user_id: Optional[str] = None,
    username: str,
    location_wkt: str,
    embedding: list[float],
    bio: Optional[str] = None,
    ideology_score: Optional[int] = None,
    instagram_handle: Optional[str] = None,
    marker_color: Optional[str] = None,
    metadata: Optional[dict[str, Any]] = None,
    dna_string: Optional[str] = None,
) -> dict[str, Any]:
    payload: dict[str, Any] = {
        "username": username,
        "bio": bio,
        "ideology_score": ideology_score,
        "location": location_wkt,
        "instagram_handle": instagram_handle,
        "embedding": embedding,
        "marker_color": marker_color,
        "metadata": metadata,
        "dna_string": dna_string,
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }
    if user_id:
        payload["id"] = user_id
    url = f"{_rest_base()}/{PROFILES_TABLE}"
    params = {"on_conflict": "id" if user_id else "username"}
    headers = _headers() | {
        "Prefer": "resolution=merge-duplicates,return=representation"
    }
    resp = requests.post(url, params=params, json=payload, headers=headers, timeout=20)
    resp.raise_for_status()
    data = resp.json()
    return data[0] if isinstance(data, list) and data else payload


def get_profile_by_id(user_id: str) -> Optional[dict[str, Any]]:
    url = f"{_rest_base()}/{PROFILES_TABLE}"
    query = {"id": f"eq.{user_id}", "limit": 1}
    resp = requests.get(url + "?" + urlencode(query), headers=_headers(), timeout=10)
    resp.raise_for_status()
    data = resp.json()
    return data[0] if isinstance(data, list) and data else None


def update_profile(
    user_id: str,
    *,
    username: Optional[str] = None,
    latitude: Optional[float] = None,
    longitude: Optional[float] = None,
    instagram_handle: Optional[str] = None,
) -> Optional[dict[str, Any]]:
    """Update specific fields of a user's profile."""
    payload: dict[str, Any] = {
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }
    if username is not None:
        payload["username"] = username
    if latitude is not None and longitude is not None:
        payload["location"] = f"POINT({longitude} {latitude})"
    if instagram_handle is not None:
        payload["instagram_handle"] = instagram_handle

    url = f"{_rest_base()}/{PROFILES_TABLE}"
    query = {"id": f"eq.{user_id}"}
    headers = _headers() | {"Prefer": "return=representation"}
    resp = requests.patch(
        url + "?" + urlencode(query), json=payload, headers=headers, timeout=10
    )
    resp.raise_for_status()
    data = resp.json()
    return data[0] if isinstance(data, list) and data else None


def get_profiles_by_ids(user_ids: list[str]) -> list[dict[str, Any]]:
    if not user_ids:
        return []
    url = f"{_rest_base()}/{PROFILES_TABLE}"
    id_list = ",".join(user_ids)
    query = {"id": f"in.({id_list})"}
    resp = requests.get(url + "?" + urlencode(query), headers=_headers(), timeout=10)
    resp.raise_for_status()
    data = resp.json()
    return data if isinstance(data, list) else []


def find_harmony_matches(
    *,
    query_embedding: list[float],
    user_location_wkt: str,
    limit: int = 10,
) -> list[dict[str, Any]]:
    url = f"{_rest_base()}/rpc/find_harmony_matches"
    payload = {
        "query_embedding": query_embedding,
        "user_location": user_location_wkt,
        "match_limit": limit,
    }
    resp = requests.post(url, json=payload, headers=_headers(), timeout=20)
    resp.raise_for_status()
    data = resp.json()
    return data if isinstance(data, list) else []


def find_contrast_matches(
    *,
    query_embedding: list[float],
    user_location_wkt: str,
    min_distance_meters: float = 5_000_000,
    limit: int = 10,
) -> list[dict[str, Any]]:
    url = f"{_rest_base()}/rpc/find_contrast_matches"
    payload = {
        "query_embedding": query_embedding,
        "user_location": user_location_wkt,
        "min_distance_meters": min_distance_meters,
        "match_limit": limit,
    }
    resp = requests.post(url, json=payload, headers=_headers(), timeout=20)
    resp.raise_for_status()
    data = resp.json()
    return data if isinstance(data, list) else []


# ============================================================================
# Messages
# ============================================================================

MESSAGES_TABLE = "messages"


def insert_message(
    *,
    sender_id: str,
    receiver_id: str,
    content: str,
) -> dict[str, Any]:
    """Insert a new message and return it."""
    payload = {
        "sender_id": sender_id,
        "receiver_id": receiver_id,
        "content": content,
    }
    url = f"{_rest_base()}/{MESSAGES_TABLE}"
    headers = _headers() | {"Prefer": "return=representation"}
    resp = requests.post(url, json=payload, headers=headers, timeout=10)
    resp.raise_for_status()
    data = resp.json()
    return data[0] if isinstance(data, list) and data else payload


def get_messages_between(
    user_a: str,
    user_b: str,
    limit: int = 50,
    offset: int = 0,
) -> list[dict[str, Any]]:
    """
    Get paginated message history between two users.
    Messages are returned in chronological order (oldest first).
    """
    url = f"{_rest_base()}/{MESSAGES_TABLE}"
    # Query for messages where (sender=A AND receiver=B) OR (sender=B AND receiver=A)
    query = {
        "or": f"(and(sender_id.eq.{user_a},receiver_id.eq.{user_b}),and(sender_id.eq.{user_b},receiver_id.eq.{user_a}))",
        "order": "created_at.asc",
        "limit": limit,
        "offset": offset,
    }
    resp = requests.get(url + "?" + urlencode(query), headers=_headers(), timeout=10)
    resp.raise_for_status()
    data = resp.json()
    return data if isinstance(data, list) else []


def get_conversations(user_id: str) -> list[dict[str, Any]]:
    """
    Get all conversations for a user with the latest message and unread count.
    Returns a list of conversation summaries sorted by most recent message.
    """
    url = f"{_rest_base()}/{MESSAGES_TABLE}"
    # Fetch recent messages involving this user, newest first
    query = {
        "or": f"(sender_id.eq.{user_id},receiver_id.eq.{user_id})",
        "order": "created_at.desc",
        "limit": 500,
    }
    resp = requests.get(url + "?" + urlencode(query), headers=_headers(), timeout=10)
    resp.raise_for_status()
    messages = resp.json()
    if not isinstance(messages, list):
        return []

    # Group by conversation partner
    conversations: dict[str, dict[str, Any]] = {}
    for msg in messages:
        other_id = msg["receiver_id"] if msg["sender_id"] == user_id else msg["sender_id"]
        if other_id not in conversations:
            conversations[other_id] = {
                "user_id": other_id,
                "last_message": msg["content"],
                "last_message_at": msg["created_at"],
                "unread_count": 0,
            }
        # Count unread: messages sent TO this user that haven't been read
        if msg["receiver_id"] == user_id and msg.get("read_at") is None:
            conversations[other_id]["unread_count"] += 1

    if not conversations:
        return []

    # Fetch profile info for all conversation partners
    partner_ids = list(conversations.keys())
    profiles = get_profiles_by_ids(partner_ids)
    profile_map = {p["id"]: p for p in profiles}

    result = []
    for partner_id, conv in conversations.items():
        profile = profile_map.get(partner_id, {})
        conv["username"] = profile.get("username", "Unknown")
        conv["avatar_url"] = profile.get("metadata", {}).get("avatar_url") if profile.get("metadata") else None
        result.append(conv)

    # Sort by most recent message
    result.sort(key=lambda c: c["last_message_at"], reverse=True)
    return result


def mark_messages_read(user_id: str, sender_id: str) -> int:
    """
    Mark all unread messages from sender_id to user_id as read.
    Returns the number of messages marked as read.
    """
    url = f"{_rest_base()}/{MESSAGES_TABLE}"
    query = {
        "receiver_id": f"eq.{user_id}",
        "sender_id": f"eq.{sender_id}",
        "read_at": "is.null",
    }
    payload = {"read_at": datetime.now(timezone.utc).isoformat()}
    headers = _headers() | {"Prefer": "return=representation"}
    resp = requests.patch(
        url + "?" + urlencode(query), json=payload, headers=headers, timeout=10
    )
    resp.raise_for_status()
    data = resp.json()
    return len(data) if isinstance(data, list) else 0

