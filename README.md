# TartanHacks26

**Backend Integration APIs**

This project exposes **modular integration functions** (not routes by default) that you can call from your own endpoints or pipelines. Below is how to use them and what they return.

**YouTube Integration**

**File:** `backend/app/integrations/youtube.py`

**Purpose:** Fetch YouTube signals for a user using their stored Google OAuth access token.

**Prereqs**
1. User completes Google OAuth in our backend (tokens stored in `oauth_accounts`).
2. `.env` has `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`.

**Function**
```python
fetch_youtube_interests(
    user_id: str | None = None,
    *,
    username: str | None = None,
    max_results: int = 10,
) -> list[str]
```

**What it does**
1. If `user_id` is provided and the Google OAuth token exists, it calls the YouTube Data API.
2. It returns a list of interest strings derived from:
   - The user’s channel name
   - Their subscriptions
   - Their most recently liked videos (playlist `LL`)
3. If `user_id` is not provided but `username` is provided, it returns a simple manual interest:
   - `["YouTube creator: {username}"]`
4. On error or missing token, it returns `[]`.

**Return shape example**
```json
[
  "YouTube channel: MyChannel",
  "Subscribed: Kurzgesagt – In a Nutshell",
  "Liked: Why Neural Nets Work"
]
```

**Local test snippet**
```bash
python - <<'PY'
from app.integrations.youtube import fetch_youtube_interests

user_id = "YOUR_USER_UUID"
print(fetch_youtube_interests(user_id=user_id))
PY
```

---

**Steam Integration**

**File:** `backend/app/integrations/steam.py`

**Purpose:** Fetch Steam activity signals using a Steam API key + user SteamID64.

**Prereqs**
1. `.env` has `STEAM_API_KEY`.
2. You have the user’s numeric SteamID64.

**Core functions**
```python
fetch_recently_played_games(steam_id: str, limit: int = 10) -> list[str]
fetch_owned_games(steam_id: str, limit: int = 10) -> list[str]
fetch_user_summary(steam_id: str) -> dict[str, Any]
fetch_steam_interests(steam_id: str) -> list[str]
```

**What they do**
1. `fetch_recently_played_games` returns names of recently played games.
2. `fetch_owned_games` returns owned games ordered by playtime (top `limit`).
3. `fetch_user_summary` returns profile metadata (name, avatar, etc.).
4. `fetch_steam_interests` aggregates into interest strings:
   - `Recently played: {game}`
   - `Top owned: {game}`

**Return shape example**
```json
[
  "Recently played: Dota 2",
  "Recently played: Hades",
  "Top owned: Counter-Strike 2"
]
```

**Local test snippet**
```bash
python - <<'PY'
import asyncio
from app.integrations.steam import fetch_steam_interests

steam_id = "YOUR_STEAM_ID"

async def main():
    print(await fetch_steam_interests(steam_id))

asyncio.run(main())
PY
```

---

**Notes**
1. These functions are intentionally **modular**. They do not depend on FastAPI routes.
2. You can call them from `/ingest`, background jobs, or custom endpoints later.
