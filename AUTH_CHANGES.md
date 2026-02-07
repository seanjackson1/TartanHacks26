# Backend Update Summary

## Overview
- Implemented OpenRouter embeddings integration using `intfloat/e5-large-v2`.
- Added Supabase profile upsert and match query helpers.
- Implemented authenticated `/ingest` and `/search` endpoints.
- Updated schema models to align with `instagram_handle` and auth-based workflows.
- Fixed Supabase migration UUID defaults to use `gen_random_uuid()`.

## Files Changed
- `backend/app/core/openrouter_logic.py`: OpenRouter client + embedding helpers.
- `backend/app/core/supabase_auth.py`: Supabase Auth token validation helper.
- `backend/app/db/supabase_client.py`: Profile upsert, lookups, and RPC match helpers.
- `backend/app/routes/ingest.py`: Ingest endpoint with embeddings + profile upsert.
- `backend/app/routes/search.py`: Search endpoint using authenticated user context.
- `backend/app/routes/__init__.py`: Router exports updated.
- `backend/app/main.py`: Routers registered.
- `backend/app/models/schemas.py`: `instagram_handle`, optional fields, search request updated.
- `supabase/migrations/001_initial_schema.sql`: UUID defaults switched to `gen_random_uuid()`; `pgcrypto` enabled.

## Notes
- `/search` now derives the user ID from the Supabase JWT (no `user_id` in request body).
- `/ingest` requires `Authorization: Bearer <token>` and will use the token's user ID.
