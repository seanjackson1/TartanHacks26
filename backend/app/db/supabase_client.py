from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Optional
from urllib.parse import urlencode

import requests

from app.config import settings

OAUTH_TABLE = "oauth_accounts"


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
    headers = _headers() | {"Prefer": "resolution=merge-duplicates,return=representation"}
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
    resp = requests.get(
        url + "?" + urlencode(query), headers=_headers(), timeout=10
    )
    resp.raise_for_status()
    data = resp.json()
    return data[0] if isinstance(data, list) and data else None
