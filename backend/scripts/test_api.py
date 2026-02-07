#!/usr/bin/env python3
"""
Smoke test for protected endpoints.

Usage:
  export MOSAIC_BASE_URL="http://localhost:8001"
  export SUPABASE_ACCESS_TOKEN="USER_ACCESS_TOKEN"
  python backend/scripts/test_api.py
"""

from __future__ import annotations

import os
import sys
from typing import Any

import requests


def _env(name: str) -> str:
    value = os.getenv(name)
    if not value:
        raise RuntimeError(f"Missing required env var: {name}")
    return value


def _headers(token: str) -> dict[str, str]:
    return {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}


def main() -> int:
    base_url = _env("MOSAIC_BASE_URL").rstrip("/")
    token = _env("SUPABASE_ACCESS_TOKEN")

    ingest_payload: dict[str, Any] = {
        "username": "demo_user",
        "interests": ["AI", "maps", "music", "fitness"],
        "latitude": 40.4433,
        "longitude": -79.9436,
        "bio": "Testing ingest from script",
    }
    resp = requests.post(
        f"{base_url}/ingest",
        json=ingest_payload,
        headers=_headers(token),
        timeout=30,
    )
    resp.raise_for_status()
    print("Ingest OK:", resp.json())

    search_payload: dict[str, Any] = {
        "mode": "harmony",
        "limit": 10,
    }
    resp = requests.post(
        f"{base_url}/search",
        json=search_payload,
        headers=_headers(token),
        timeout=30,
    )
    resp.raise_for_status()
    print("Search OK:", resp.json())
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except Exception as exc:
        print("Error:", exc)
        raise
