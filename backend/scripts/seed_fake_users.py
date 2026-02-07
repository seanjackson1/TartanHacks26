#!/usr/bin/env python3
from __future__ import annotations

import json
import math
import os
import random
import time
import uuid
from collections import Counter
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


def _lookup_user_id_by_email(email: str) -> str | None:
    url = f"{_auth_base()}/admin/users"
    params_candidates = [
        {"filter": email, "page": 1, "per_page": 1000},
        {"filter": f"email:{email}", "page": 1, "per_page": 1000},
        {"filter": f"email=={email}", "page": 1, "per_page": 1000},
    ]
    for params in params_candidates:
        resp = requests.get(url, headers=_headers(), params=params, timeout=15)
        if not resp.ok:
            continue
        data = resp.json()
        users = data.get("users", [])
        for user in users:
            if user.get("email", "").lower() == email.lower():
                return user.get("id")

    # Fallback: paginate without filters in case filters are unsupported.
    page = 1
    while True:
        resp = requests.get(
            url,
            headers=_headers(),
            params={"page": page, "per_page": 1000},
            timeout=15,
        )
        resp.raise_for_status()
        data = resp.json()
        users = data.get("users", [])
        if not users:
            break
        for user in users:
            if user.get("email", "").lower() == email.lower():
                return user.get("id")
        page += 1

    return None


def _bio_fragment(bio: str) -> str:
    text = bio.strip()
    if text.endswith("."):
        text = text[:-1]
    if text:
        text = text[0].lower() + text[1:]
    return text


def _format_list(items: list[str]) -> str:
    if not items:
        return ""
    if len(items) == 1:
        return items[0]
    if len(items) == 2:
        return f"{items[0]} and {items[1]}"
    return f"{items[0]}, {items[1]}, and {items[2]}"


def _make_profile_summary(
    display_name: str,
    bio: str,
    interests: list[str],
    youtube_items: list[str],
    steam_items: list[str],
) -> str:
    sentences: list[str] = []
    top_interests = random.sample(interests, k=min(3, len(interests)))
    if top_interests:
        sentences.append(
            f"{display_name} is interested in {_format_list(top_interests)}."
        )

    bio_text = _bio_fragment(bio)
    if bio_text:
        sentences.append(f"Their bio mentions {bio_text}.")

    if youtube_items:
        picks = random.sample(youtube_items, k=min(2, len(youtube_items)))
        sentences.append(f"They often watch videos like {_format_list(picks)}.")

    if steam_items:
        picks = random.sample(steam_items, k=min(2, len(steam_items)))
        sentences.append(f"They play games such as {_format_list(picks)} on Steam.")

    base_closers = [
        "They balance creative and technical interests in their day-to-day.",
        "They seem curious and open to new ideas.",
        "They value steady learning and thoughtful collaboration.",
        "Overall, their profile suggests a mix of focus and exploration.",
        "They tend to explore new projects while keeping a practical mindset.",
    ]

    target = random.randint(4, 6)
    closers = base_closers[:]
    random.shuffle(closers)
    while len(sentences) < target and closers:
        sentences.append(closers.pop())
    while len(sentences) < target:
        sentences.append(random.choice(base_closers))

    return " ".join(sentences[:target])




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
        try:
            error_body = resp.json()
        except ValueError:
            error_body = {"raw": resp.text}

        error_text = json.dumps(error_body).lower()
        duplicate_markers = [
            "already registered",
            "already exists",
            "email_exists",
            "email already",
            "duplicate",
        ]
        if not any(marker in error_text for marker in duplicate_markers):
            raise SystemExit(
                f"Auth create failed for {email} with 422: {error_body}"
            )
        user_id = _lookup_user_id_by_email(email)
        if user_id:
            return user_id
        raise SystemExit(
            "Auth lookup did not return a matching email. "
            "Check that the admin users endpoint supports the email filter."
        )
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

    emails = [u.get("email") for u in users if u.get("email")]
    email_counts = Counter(emails)
    dup_emails = [email for email, count in email_counts.items() if count > 1]
    if dup_emails:
        raise SystemExit(
            "Duplicate emails in seed data. Regenerate seed data. "
            f"Examples: {', '.join(dup_emails[:5])}"
        )

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

        dna_string = _make_profile_summary(
            user_def["display_name"],
            user_def.get("bio", ""),
            interests,
            youtube_items,
            steam_items,
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
