# Verbose Change Log (Backend)

This document describes all backend-related changes implemented during the current setup and debugging cycle. It is intended to be a complete, human-readable record of what was added/updated and why.

## 1. Supabase Schema Adjustments

- **UUID defaults**: Switched UUID generation from `uuid_generate_v4()` to `gen_random_uuid()` and enabled the `pgcrypto` extension. This avoids missing-function errors in Supabase.
- **Profiles table**: Ensured `profiles` uses `VECTOR(1024)` for embeddings (OpenRouter `intfloat/e5-large-v2`) and `GEOGRAPHY(Point, 4326)` for location.
- **Indexes**: HNSW index for vector similarity search and GIST index for geospatial queries.
- **Auth FK**: `profiles.id` references `auth.users(id)`; the backend now expects authenticated user IDs.

## 2. OpenRouter Embedding Integration

- Implemented OpenRouter embedding client in `backend/app/core/openrouter_logic.py`.
- Uses OpenRouter base URL and `intfloat/e5-large-v2` for 1024-d embeddings.
- Provides both single and batch embedding helpers.

## 3. Supabase Auth Verification

- Added `backend/app/core/supabase_auth.py` to validate Supabase JWTs.
- Verification calls `/auth/v1/user` with the **user access token**.
- Uses `SUPABASE_ANON_KEY` (not the service role key) to call the Auth endpoint.

## 4. Supabase Client Wrapper Enhancements

Updated `backend/app/db/supabase_client.py`:

- **Profile upsert**:
  - Accepts optional `user_id`.
  - Upserts on `id` when `user_id` is provided (Supabase Auth users).
  - Falls back to `username` if no `user_id` is present.
- **Profile fetch helpers**:
  - `get_profile_by_id`
  - `get_profiles_by_ids`
- **Vector search helpers**:
  - `find_harmony_matches` (RPC call)
  - `find_contrast_matches` (RPC call)

## 5. API Endpoints

- **POST `/ingest`**
  - Builds a `dna_string` from username, bio, interests.
  - Generates embedding via OpenRouter.
  - Upserts the profile into Supabase.
  - Requires `Authorization: Bearer <user_access_token>`.

- **POST `/search`**
  - Uses authenticated user ID (no `user_id` in request body).
  - Loads the user’s embedding and location.
  - Calls Supabase RPC to find matches.
  - Returns similarity and distance metrics.

## 6. Data Models & Config

Updated models and config:

- `instagram_handle` replaced `discord_handle`.
- Added `SUPABASE_ANON_KEY` to `backend/app/config.py`.
- `/search` request model no longer includes `user_id`.

## 7. Testing Utilities

- **Python script**: `backend/scripts/test_api.py`
  - Calls `/ingest` then `/search`.
  - Reads `MOSAIC_BASE_URL` and `SUPABASE_ACCESS_TOKEN`.

- **HTTP test file**: `backend/requests.http`
  - Supports REST Client usage.

- **REST Client env templates**:
  - `.rest-client.env.json` (repo root)
  - `backend/.http.env.json`

These are templates with placeholder tokens.

## 8. Auth Debugging Lessons (Resolved)

- The Supabase CLI access token is **not** a valid Auth user token.
- `/auth/v1/user` must be called with the **anon key** + **user access token**.
- Password grant does not work for Google OAuth accounts; you must use a real session access token from the frontend.

## 9. Git / Repo Cleanup

- Removed tracked `__pycache__` files and ensured they’re ignored.
- Added `SUPABASE_ANON_KEY` to `.env.example`.
- Added test files and REST client templates.

## 10. Current Verified Flow

1. User logs in via Supabase Auth (Google).
2. Frontend grabs `session.access_token`.
3. Backend validates the token via Supabase.
4. `/ingest` inserts/updates the user’s profile and embedding.
5. `/search` returns vector matches.
