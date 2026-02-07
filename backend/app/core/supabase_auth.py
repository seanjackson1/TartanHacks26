"""Supabase Auth helpers for verifying access tokens."""

from __future__ import annotations

from typing import Any

import requests
from fastapi import Header, HTTPException

from app.config import settings


def get_current_user(authorization: str | None = Header(default=None)) -> dict[str, Any]:
    """Validate Supabase JWT by calling the Auth user endpoint."""
    if not authorization:
        raise HTTPException(status_code=401, detail="Missing Authorization header.")
    scheme, _, token = authorization.partition(" ")
    if scheme.lower() != "bearer" or not token:
        raise HTTPException(status_code=401, detail="Invalid Authorization header.")

    url = settings.supabase_url.rstrip("/") + "/auth/v1/user"
    headers = {
        "Authorization": f"Bearer {token}",
        "apikey": settings.supabase_service_role_key,
    }
    resp = requests.get(url, headers=headers, timeout=10)
    if resp.status_code == 401:
        raise HTTPException(status_code=401, detail="Invalid or expired token.")
    resp.raise_for_status()
    return resp.json()
