# Technical Specification: Project Global Mosaic (2026 Edition)

## 1. System Overview

**Global Mosaic** is a geospatial-social discovery platform. It uses **Next.js** (Frontend), **FastAPI** (Backend), and **Supabase** (Database/Vector Store).

* **AI Provider**: **OpenRouter** – unified API gateway to access multiple LLM/embedding providers with a single API key.
* **Vector Model**: `intfloat/e5-large-v2` via OpenRouter (1024 dimensions).

---

## 2. File Structure

The project is a monorepo split into `mosaic/` (Frontend) and `backend/` (Backend).

```text
/
├── mosaic/                 # Next.js Frontend
│   ├── src/
│   │   ├── components/     # UI: Map, ProfileCard, ControlPanel
│   │   ├── hooks/          # useMapData, useUserLocation
│   │   ├── lib/            # Supabase & OpenRouter client wrappers
│   │   └── types/          # TypeScript interfaces (User, Vector, Mode)
│   ├── public/             # Map assets, custom markers
│   └── tailwind.config.ts  # Theme: Mosaic (Deep Navys, Neon Accents)
├── backend/                # FastAPI Backend
│   ├── app/
│   │   ├── main.py         # Entry point
│   │   ├── routes/         # /ingest, /search, /analytics
│   │   ├── core/           # OpenRouter Embedding logic, Vector math
│   │   └── db/             # Supabase wrappers
│   ├── scripts/            # generate_mosaic.py (Synthetic data)
│   └── requirements.txt    # FastAPI, openai (for OpenRouter), postgis-helpers
└── .env                    # OPENROUTER_API_KEY, SUPABASE_URL, etc.

```

---

## 3. Data Schema (PostgreSQL/Supabase)

### Table: `profiles`

| Field | Type | Constraint | Description |
| --- | --- | --- | --- |
| `id` | UUID | Primary Key | Linked to Auth.users |
| `username` | TEXT | Unique |  |
| `location` | GEOGRAPHY(Point, 4326) | Index: GIST | Real-world coordinates |
| `dna_string` | TEXT |  | Raw text for embedding |
| `embedding` | VECTOR(1024) | Index: HNSW | **intfloat/e5-large-v2** output |
| `marker_color` | VARCHAR(7) |  | Hex code based on interest cluster |
| `metadata` | JSONB |  | Extracted top interests for UI cards |

---

## 4. API Specification (FastAPI)

### `POST /ingest`

* **Provider**: OpenRouter (OpenAI-compatible API)
* **Input**: `username`, `interests[]`, `latitude`, `longitude`.
* **Logic**:
1. Clean and concatenate strings into a semantic bio.
2. Call OpenRouter embeddings endpoint with `intfloat/e5-large-v2`.
3. Upsert to Supabase.



### `POST /search`

* **Harmony Mode**: `ORDER BY embedding <=> query_vector ASC LIMIT 10`.
* **Contrast Mode**: `ORDER BY embedding <=> query_vector DESC` + `WHERE ST_Distance(location, user_loc) > 5000000`.

---

## 5. Frontend & Mapping Logic (Next.js)

### The Map Engine (Leaflet)

* **Tile Provider**: `Stadia.AlidadeSmoothDark` (or `CartoDB.DarkMatter`).
* **Visuals**: Use **`CircleMarker`** (Canvas mode) to ensure 500+ dots don't lag the browser.
* **Colors**:
* `#00F2FF` (Cyan): Tech/Dev
* `#FF007A` (Magenta): Creative/Arts
* `#ADFF2F` (Green): Gaming
* `#FFA500` (Orange): Fitness



---

## 6. Synthetic Data Strategy (`generate_mosaic.py`)

To populate the map for the demo:

1. **Archetypes**: Define 5 JSON "Personalities" (e.g., *The Tokyo J-Pop Fan*, *The NYC Rust Dev*).
2. **Jittering**: Pick 50 global cities. Use `random.uniform(-0.05, 0.05)` on Lat/Long to create natural-looking clusters around urban hubs.
3. **Batching**: Use OpenRouter's batch embedding to process all 500 users efficiently.

---

## 7. AI Agent Instructions (The "System Prompt")

* **Vector Dimensions**: Ensure `profiles` table is initialized with `vector(1024)`.
* **OpenRouter Base URL**: `https://openrouter.ai/api/v1`
* **Z-Index**: Ensure the "Profile Card" component has a higher z-index than the Leaflet map controls.