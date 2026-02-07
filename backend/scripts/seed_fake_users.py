#!/usr/bin/env python3
from __future__ import annotations

import json
import math
import os
import random
import time
import uuid
from pathlib import Path
from typing import Any

import requests


SUPABASE_URL = os.getenv("SUPABASE_URL", "").rstrip("/")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")

NUM_USERS = int(os.getenv("SEED_NUM_USERS", "1000"))
RANDOM_SEED = int(os.getenv("SEED_RANDOM_SEED", "42"))
SEED_JSON_PATH = Path(os.getenv("SEED_JSON_PATH", "backend/scripts/data/seed_data.json"))


def _headers() -> dict[str, str]:
    return {
        "apikey": SUPABASE_SERVICE_ROLE_KEY,
        "Authorization": f"Bearer {SUPABASE_SERVICE_ROLE_KEY}",
        "Content-Type": "application/json",
    }


def _rest_base() -> str:
    return f"{SUPABASE_URL}/rest/v1"


def _auth_base() -> str:
    return f"{SUPABASE_URL}/auth/v1"


def _require_env() -> None:
    missing = []
    if not SUPABASE_URL:
        missing.append("SUPABASE_URL")
    if not SUPABASE_SERVICE_ROLE_KEY:
        missing.append("SUPABASE_SERVICE_ROLE_KEY")
    if missing:
        raise SystemExit(f"Missing env vars: {', '.join(missing)}")


def _rand_embedding(dim: int = 1024) -> list[float]:
    vec = [random.gauss(0, 1) for _ in range(dim)]
    norm = math.sqrt(sum(v * v for v in vec)) or 1.0
    return [v / norm for v in vec]


# Rough land anchors (city-based) to keep points on land.
CITY_ANCHORS = [
    ("New York", 40.7128, -74.0060),
    ("Los Angeles", 34.0522, -118.2437),
    ("Mexico City", 19.4326, -99.1332),
    ("Bogotá", 4.7110, -74.0721),
    ("São Paulo", -23.5505, -46.6333),
    ("Buenos Aires", -34.6037, -58.3816),
    ("Lima", -12.0464, -77.0428),
    ("London", 51.5074, -0.1278),
    ("Paris", 48.8566, 2.3522),
    ("Berlin", 52.5200, 13.4050),
    ("Madrid", 40.4168, -3.7038),
    ("Rome", 41.9028, 12.4964),
    ("Warsaw", 52.2297, 21.0122),
    ("Istanbul", 41.0082, 28.9784),
    ("Cairo", 30.0444, 31.2357),
    ("Lagos", 6.5244, 3.3792),
    ("Nairobi", -1.2921, 36.8219),
    ("Johannesburg", -26.2041, 28.0473),
    ("Cape Town", -33.9249, 18.4241),
    ("Dubai", 25.2048, 55.2708),
    ("Riyadh", 24.7136, 46.6753),
    ("Delhi", 28.7041, 77.1025),
    ("Mumbai", 19.0760, 72.8777),
    ("Bengaluru", 12.9716, 77.5946),
    ("Karachi", 24.8607, 67.0011),
    ("Dhaka", 23.8103, 90.4125),
    ("Bangkok", 13.7563, 100.5018),
    ("Hanoi", 21.0278, 105.8342),
    ("Ho Chi Minh City", 10.8231, 106.6297),
    ("Singapore", 1.3521, 103.8198),
    ("Jakarta", -6.2088, 106.8456),
    ("Manila", 14.5995, 120.9842),
    ("Tokyo", 35.6762, 139.6503),
    ("Osaka", 34.6937, 135.5023),
    ("Seoul", 37.5665, 126.9780),
    ("Beijing", 39.9042, 116.4074),
    ("Shanghai", 31.2304, 121.4737),
    ("Taipei", 25.0330, 121.5654),
    ("Sydney", -33.8688, 151.2093),
    ("Melbourne", -37.8136, 144.9631),
    ("Auckland", -36.8509, 174.7645),
    ("Toronto", 43.6532, -79.3832),
    ("Vancouver", 49.2827, -123.1207),
    ("Montreal", 45.5017, -73.5673),
]


def _point_from_anchor(anchor: tuple[str, float, float]) -> tuple[float, float]:
    _, lat, lon = anchor
    lat += random.uniform(-2.0, 2.0)
    lon += random.uniform(-2.0, 2.0)
    return lat, lon


def _load_seed_data() -> dict[str, Any]:
    if not SEED_JSON_PATH.exists():
        raise SystemExit(
            f"Seed data not found: {SEED_JSON_PATH}. "
            "Run backend/scripts/generate_seed_data.py first."
        )
    return json.loads(SEED_JSON_PATH.read_text())




def _create_auth_user(email: str, password: str) -> str:
    url = f"{_auth_base()}/admin/users"
    payload = {
        "email": email,
        "password": password,
        "email_confirm": True,
    }
    resp = requests.post(url, headers=_headers(), json=payload, timeout=15)
    if resp.status_code == 422:
        # Likely already exists; try to look it up by email
        lookup = requests.get(
            f"{_auth_base()}/admin/users",
            headers=_headers(),
            params={"email": email},
            timeout=15,
        )
        lookup.raise_for_status()
        data = lookup.json()
        users = data.get("users", [])
        if users:
            return users[0]["id"]
    resp.raise_for_status()
    data = resp.json()
    return data["id"]


def _insert_profile(payload: dict[str, Any]) -> None:
    url = f"{_rest_base()}/profiles"
    headers = _headers() | {"Prefer": "resolution=merge-duplicates"}
    resp = requests.post(
        url,
        headers=headers,
        params={"on_conflict": "id"},
        json=payload,
        timeout=15,
    )
    resp.raise_for_status()


def _insert_interests(rows: list[dict[str, Any]]) -> None:
    if not rows:
        return
    url = f"{_rest_base()}/interests"
    resp = requests.post(url, headers=_headers(), json=rows, timeout=15)
    resp.raise_for_status()


def main() -> None:
    _require_env()
    random.seed(RANDOM_SEED)

    data = _load_seed_data()
    general_pool = data.get("general_pool", [])
    youtube_pool = data.get("youtube_pool", [])
    steam_pool = data.get("steam_pool", [])
    users = data.get("users", [])

    if not general_pool or not youtube_pool or not steam_pool or not users:
        raise SystemExit("Seed pools are empty. Regenerate seed data.")

    marker_colors = ["#00F2FF", "#FF007A", "#ADFF2F", "#FFA500"]

    anchors = CITY_ANCHORS[:]
    random.shuffle(anchors)

    for i in range(NUM_USERS):
        user_def = users[i % len(users)]
        email = user_def["email"]
        password = uuid.uuid4().hex
        user_id = _create_auth_user(email, password)

        anchor = anchors[i % len(anchors)]
        lat, lon = _point_from_anchor(anchor)
        interests = random.sample(
            general_pool, k=min(len(general_pool), random.randint(5, 10))
        )
        youtube_items = random.sample(
            youtube_pool, k=min(len(youtube_pool), random.randint(3, 6))
        )
        steam_items = random.sample(
            steam_pool, k=min(len(steam_pool), random.randint(3, 6))
        )

        dna_string = " | ".join(
            [
                ", ".join(interests),
                "YouTube: " + ", ".join(youtube_items),
                "Steam: " + ", ".join(steam_items),
            ]
        )

        now = time.time()
        created_at_ts = now - random.randint(7, 365) * 86400
        updated_at_ts = created_at_ts + random.randint(0, 30) * 86400
        created_at = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime(created_at_ts))
        updated_at = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime(updated_at_ts))

        profile_payload = {
            "id": user_id,
            "username": user_def["username"],
            "bio": user_def.get("bio"),
            "instagram_handle": user_def.get("instagram_handle"),
            "ideology_score": random.randint(1, 10),
            "location": f"POINT({lon} {lat})",
            "embedding": _rand_embedding(),
            "marker_color": random.choice(marker_colors),
            "metadata": {
                "top_interests": interests[:5],
                "platforms": ["youtube", "steam"],
            },
            "dna_string": dna_string,
            "created_at": created_at,
            "updated_at": updated_at,
        }

        _insert_profile(profile_payload)

        interest_rows = []
        for text in interests:
            interest_rows.append(
                {"user_id": user_id, "source": "manual_beli", "raw_text": text}
            )
        for text in steam_items:
            interest_rows.append(
                {"user_id": user_id, "source": "steam", "raw_text": text}
            )
        for text in youtube_items:
            interest_rows.append(
                {"user_id": user_id, "source": "manual_hevy", "raw_text": text}
            )
        _insert_interests(interest_rows)

        if (i + 1) % 50 == 0:
            print(f"Seeded {i + 1}/{NUM_USERS}")
            time.sleep(0.2)

    print("Seeding complete.")


if __name__ == "__main__":
    main()
