# Backend TODO — Full Implementation Checklist

Everything below is currently a stub (`# TODO`). This document covers every file that needs implementation, every schema that needs updating, and every integration that needs wiring up.

---

## 1. Core Infrastructure

### 1.1 `app/main.py` — FastAPI App Setup
- [ ] Create the `FastAPI()` app instance with title/description/version
- [ ] Add CORS middleware allowing the frontend origin (`http://localhost:3000` + Vercel deploy URL)
- [ ] Mount the route files: `ingest.router`, `search.router`, `analytics.router`
- [ ] Add a root `GET /` health-check endpoint returning `{ "status": "ok" }`
- [ ] Add a startup event or lifespan that initializes the Supabase client and OpenRouter client

### 1.2 `app/db/supabase_client.py` — Supabase Client
- [ ] Import `settings` from `app/config.py`
- [ ] Create a singleton `supabase` client using `create_client(settings.supabase_url, settings.supabase_service_role_key)`
- [ ] Export the client as `supabase` for use in routes

### 1.3 `app/core/openrouter_logic.py` — Embedding Generation
- [ ] Initialize the OpenAI client with `base_url=settings.openrouter_base_url` and `api_key=settings.openrouter_api_key`
- [ ] Implement `async def generate_embedding(text: str) -> list[float]`
  - Call `client.embeddings.create(model="intfloat/e5-large-v2", input=text)`
  - The e5 model expects input prefixed with `"query: "` or `"passage: "` for best results — use `"passage: "` for user profiles
  - Return the 1024-dim float list from `response.data[0].embedding`
  - Wrap in try/except; on failure log the error and return `None` (don't crash the ingest)

### 1.4 `app/core/vector_math.py` — Matching Utilities
- [ ] Implement `def classify_cluster(interests: list[str]) -> InterestCluster`
  - Simple keyword matching against category word lists:
    - `tech`: programming, coding, python, javascript, AI, ML, linux, web dev, etc.
    - `arts`: music, drawing, painting, photography, film, writing, etc.
    - `gaming`: gaming, Valorant, League, Steam, Minecraft, RPG, FPS, etc.
    - `fitness`: gym, lifting, running, CrossFit, hiking, climbing, etc.
  - Count keyword hits per cluster, return highest. Default to `tech` if tied/no match.
- [ ] Implement `def get_marker_color(cluster: InterestCluster) -> str`
  - Return the hex color from `CLUSTER_COLORS` dict
- [ ] Implement `def compute_composite_score(cosine_sim: float, ideology_a: int | None, ideology_b: int | None) -> float`
  - Uses `W1=0.7`, `W2=0.3` from `MATCHING_WEIGHTS`
  - Ideological diversity: Gaussian function centered at distance=4, σ=2: `exp(-((distance - 4)^2) / (2 * 2^2))`
  - If either ideology score is None, set diversity term to 0.5
  - Return `W1 * cosine_sim + W2 * diversity`

---

## 2. API Endpoints

### 2.1 `app/routes/ingest.py` — POST `/ingest`
- [ ] Create an `APIRouter` with prefix="" and tag="ingest"
- [ ] Implement `POST /ingest` accepting `IngestRequest` body
- [ ] Pipeline steps:
  1. **Build dna_string**: Concatenate `interests` (joined by ", ") + bio + platform-fetched data (see §3) into one text blob
  2. **Generate embedding**: Call `generate_embedding(dna_string)` from openrouter_logic
  3. **Classify cluster**: Call `classify_cluster(interests)` → get `marker_color`
  4. **Build metadata**: Store top interests and platform sources as a JSONB dict, e.g. `{"top_interests": [...], "platforms": ["steam", "github"]}`
  5. **Insert into Supabase `profiles`**:
     - `username`, `bio`, `ideology_score`, `instagram_handle`
     - `location`: Pass as `f"POINT({longitude} {latitude})"` (WKT format for PostGIS geography)
     - `embedding`: The 1024-dim list (Supabase/pgvector accepts JSON arrays)
     - `marker_color`, `metadata`, `dna_string`
     - `youtube_username`, `steam_id`, `github_username` (new columns, see §4)
  6. **Insert into `interests` table**: One row per interest string with `source="manual"`
  7. **Insert platform-fetched interests**: If Steam/GitHub/YouTube returned data, insert rows with appropriate `source` values
  8. **Return** `IngestResponse` with `user_id`, `marker_color`, `message`
- [ ] Error handling: If embedding generation fails, still insert the profile (just with `embedding=None`). Log the error.
- [ ] If username already exists (unique constraint), return 409 Conflict

### 2.2 `app/routes/search.py` — POST `/search`
- [ ] Create an `APIRouter` with prefix="" and tag="search"
- [ ] Implement `POST /search` accepting `SearchRequest` body
- [ ] Pipeline steps:
  1. **Fetch the requesting user's profile** from `profiles` by `user_id` — need their `embedding`, `location`, and `ideology_score`
  2. **Call the appropriate Supabase RPC function**:
     - Harmony mode → `supabase.rpc("find_harmony_matches", { "query_embedding": embedding, "user_location": location, "match_limit": limit })`
     - Contrast mode → `supabase.rpc("find_contrast_matches", { ... })`
  3. **For each returned user_id**: Fetch the full profile row
  4. **Compute composite scores**: Use `compute_composite_score()` for each match
  5. **Exclude the requesting user** from results
  6. **Build and return** `SearchResponse` with `matches`, `total_found`, `mode`
- [ ] If the user has no embedding yet, return 400 with message "Profile not vectorized"

### 2.3 `app/routes/analytics.py` — GET `/analytics` (stretch goal)
- [ ] Total user count
- [ ] Cluster distribution (count per marker_color)
- [ ] Average ideology score
- [ ] Low priority — skip if time is tight

---

## 3. Platform Integrations

These run during the `/ingest` call. Each fetcher returns a `list[str]` of interest strings to fold into the dna_string. If any fails, log and skip — never crash the ingest.

### 3.1 Steam — `app/integrations/steam.py`
- [ ] Create the file
- [ ] Implement `async def fetch_steam_interests(steam_id: str) -> list[str]`
- [ ] Use `httpx` to call Steam Web API (no SDK needed):
  - Endpoint: `https://api.steampowered.com/IPlayerService/GetRecentlyPlayedGames/v0001/?key={STEAM_API_KEY}&steamid={steam_id}&format=json`
  - Requires `STEAM_API_KEY` env var (already in config)
  - User's profile must be public for this to work
- [ ] Parse response → extract game names from `response.games[].name`
- [ ] Return list like `["Counter-Strike 2", "Elden Ring", "Stardew Valley"]`
- [ ] On error (invalid ID, private profile, API down): log warning, return `[]`

### 3.2 GitHub — `app/integrations/github.py`
- [ ] Create the file
- [ ] Implement `async def fetch_github_interests(username: str) -> list[str]`
- [ ] Use `httpx` to call GitHub public API (no auth needed for public data):
  - `GET https://api.github.com/users/{username}/repos?sort=stars&per_page=10`
  - Extract repo names and languages
  - `GET https://api.github.com/users/{username}/starred?per_page=10`
  - Extract starred repo names
- [ ] Build interest strings like `["Python developer", "JavaScript", "starred: tensorflow", "repo: my-cool-project"]`
- [ ] Set `User-Agent` header (GitHub requires it)
- [ ] Respect rate limiting (60 req/hr unauthenticated) — for a hackathon this is fine
- [ ] On error (404 user, rate limited): log warning, return `[]`

### 3.3 YouTube — `app/integrations/youtube.py`
- [ ] Create the file
- [ ] Implement `async def fetch_youtube_interests(username: str) -> list[str]`
- [ ] **Reality check**: YouTube Data API v3 requires OAuth2 for subscriptions/likes. With just a username you can't fetch much without a Google API key + the channel ID.
- [ ] **Hackathon approach — two options**:
  - **Option A (simple)**: Just treat the YouTube username as a manual interest string. Return `["YouTube creator: {username}"]`. Lowest effort.
  - **Option B (API key)**: If you set up a `YOUTUBE_API_KEY` env var, you can search for the channel and fetch public playlists:
    - `GET https://www.googleapis.com/youtube/v3/search?part=snippet&q={username}&type=channel&key={API_KEY}`
    - Then fetch their public playlists/uploads
    - Extract video titles/categories
  - Recommend **Option A** for the hackathon, upgrade to B if time permits
- [ ] Add `YOUTUBE_API_KEY` to config.py and .env.example (optional)
- [ ] On error: log warning, return `[]`

---

## 4. Database Schema Updates

A new migration is needed to align the DB with the updated frontend fields.

### 4.1 New migration: `002_update_schema.sql`
- [ ] Create `supabase/migrations/002_update_schema.sql`
- [ ] Rename `discord_handle` → `instagram_handle`:
  ```sql
  ALTER TABLE profiles RENAME COLUMN discord_handle TO instagram_handle;
  ```
- [ ] Add new columns:
  ```sql
  ALTER TABLE profiles ADD COLUMN IF NOT EXISTS youtube_username TEXT;
  ALTER TABLE profiles ADD COLUMN IF NOT EXISTS steam_id TEXT;
  ALTER TABLE profiles ADD COLUMN IF NOT EXISTS github_username TEXT;
  ```
- [ ] Update `interests` source check constraint to allow new sources:
  ```sql
  ALTER TABLE interests DROP CONSTRAINT IF EXISTS interests_source_check;
  ALTER TABLE interests ADD CONSTRAINT interests_source_check
    CHECK (source IN ('youtube', 'steam', 'github', 'manual'));
  ```

---

## 5. Authentication (Supabase Auth)

### 5.1 Supabase Dashboard Setup
- [ ] Enable Google OAuth provider in Supabase Dashboard → Authentication → Providers
- [ ] Create Google OAuth credentials in Google Cloud Console (OAuth 2.0 Client ID, type: Web Application)
- [ ] Set authorized redirect URI to: `https://<your-supabase-project>.supabase.co/auth/v1/callback`
- [ ] Paste Google Client ID + Secret into the Supabase Dashboard

### 5.2 Backend Auth Middleware (if time permits)
- [ ] Create `app/middleware/auth.py`
- [ ] Implement a FastAPI dependency `get_current_user(authorization: str = Header(...))`:
  - Extract the Bearer token from the `Authorization` header
  - Call `supabase.auth.get_user(token)` to validate and get the user
  - Return the user's UUID
- [ ] Apply as a dependency to protected routes (ingest, search)
- [ ] Per CLAUDE.md: this is optional for MVP. The frontend can send `user_id` directly for hackathon speed.

### 5.3 Frontend Auth (for reference — not a backend task)
- Frontend needs: `@supabase/supabase-js` client, `signInWithOAuth({ provider: 'google' })`, store the session, send the JWT in the Authorization header or the user_id in the request body.

---

## 6. Backend Pydantic Schema Sync

The backend schemas (`app/models/schemas.py`) are out of sync with the frontend types. These need updating:

### 6.1 Update `InterestSource` enum
- [ ] Change from `SPOTIFY/STEAM/MANUAL_BELI/MANUAL_HEVY` to `YOUTUBE/STEAM/GITHUB/MANUAL`

### 6.2 Update `User` model
- [ ] Rename `discord_handle` → `instagram_handle`
- [ ] Add `youtube_username: Optional[str] = None`
- [ ] Add `steam_id: Optional[str] = None`
- [ ] Add `github_username: Optional[str] = None`

### 6.3 Update `IngestRequest`
- [ ] Rename `discord_handle` → `instagram_handle`
- [ ] Add `youtube_username: Optional[str] = None`
- [ ] Add `steam_id: Optional[str] = None`
- [ ] Add `github_username: Optional[str] = None`

### 6.4 Update `UserCreate`
- [ ] Rename `discord_handle` → `instagram_handle`

---

## 7. Config & Environment Updates

### 7.1 `app/config.py`
- [ ] Remove `spotipy_client_id` and `spotipy_client_secret`
- [ ] Add `youtube_api_key: str = ""` (optional)
- [ ] Add `github_token: str = ""` (optional — for higher rate limits)

### 7.2 `.env.example`
- [ ] Remove Spotify vars
- [ ] Add `YOUTUBE_API_KEY=` (optional)
- [ ] Add `GITHUB_TOKEN=` (optional)

### 7.3 `requirements.txt`
- [ ] Remove `spotipy>=2.23.0`
- [ ] Everything else (`openai`, `supabase`, `httpx`, `numpy`, `fastapi`, `uvicorn`, `pydantic`, `pydantic-settings`) is correct

---

## 8. Implementation Priority Order

For the hackathon, build in this order:

1. **Supabase client** (1.2) — everything depends on it
2. **OpenRouter embeddings** (1.3) — core feature
3. **Schema sync** (§6) — fix the models before writing routes
4. **DB migration** (§4) — run before testing routes
5. **Cluster classifier + marker color** (1.4) — needed by ingest
6. **`/ingest` endpoint** (2.1) — unblocks the frontend
7. **`main.py` setup** (1.1) — wire it all together, test end-to-end
8. **`/search` endpoint** (2.2) — enables the matching feature
9. **GitHub integration** (3.2) — easiest, public API, no auth
10. **Steam integration** (3.1) — public API with key you already have
11. **YouTube integration** (3.3) — just use Option A unless time permits
12. **Auth** (§5) — layer on last, everything works without it
13. **Analytics** (2.3) — stretch goal
