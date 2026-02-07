from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Optional

from supabase import Client, create_client

from app.config import settings

_supabase: Optional[Client] = None

OAUTH_TABLE = "oauth_accounts"


def get_supabase() -> Client:
    global _supabase
    if _supabase is None:
        _supabase = create_client(
            settings.supabase_url, settings.supabase_service_role_key
        )
    return _supabase


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
    sb = get_supabase()
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
    result = (
        sb.table(OAUTH_TABLE)
        .upsert(payload, on_conflict="user_id,provider")
        .execute()
    )
    return result.data[0] if result.data else payload


def get_oauth_account(user_id: str, provider: str) -> Optional[dict[str, Any]]:
    sb = get_supabase()
    result = (
        sb.table(OAUTH_TABLE)
        .select("*")
        .eq("user_id", user_id)
        .eq("provider", provider)
        .limit(1)
        .execute()
    )
    return result.data[0] if result.data else None
