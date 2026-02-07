For a hackathon where speed and cost-efficiency are king, **Cloudflare Workers AI** (specifically the `@cf/baai/bge-m3` model) or **Google Gemini API** (via `text-embedding-004`) are currently the best "free-forever" options.

Since you are already a student at CMU and likely have access to Google Cloud/AI Studio credits, and given that **Gemini 1.5 Flash/2.0** provides a massive free tier (1,500 requests per day), I have updated the spec to use **Google AI Studio (Gemini)**. It is significantly faster than OpenAI for free-tier users and requires no credit card for the initial tier.

---

# Technical Specification: Project Global Mosaic (2026 Edition)

## 1. System Overview

**Global Mosaic** is a geospatial-social discovery platform. It uses **Next.js** (Frontend), **FastAPI** (Backend), and **Supabase** (Database/Vector Store).

* **AI Provider**: Google AI Studio (Gemini) – chosen for its high-rate free tier and superior multilingual support.
* **Vector Model**: `text-embedding-004` (768 dimensions).

---

## 2. File Structure

The project is a monorepo split into `mosaic/` (Frontend) and `server/` (Backend).

```text
/
├── mosaic/                 # Next.js Frontend
│   ├── src/
│   │   ├── components/     # UI: Map, ProfileCard, ControlPanel
│   │   ├── hooks/          # useMapData, useUserLocation
│   │   ├── lib/            # Supabase & Gemini client wrappers
│   │   └── types/          # TypeScript interfaces (User, Vector, Mode)
│   ├── public/             # Map assets, custom markers
│   └── tailwind.config.ts  # Theme: Mosaic (Deep Navys, Neon Accents)
├── server/                 # FastAPI Backend
│   ├── app/
│   │   ├── main.py         # Entry point
│   │   ├── routes/         # /ingest, /search, /analytics
│   │   ├── core/           # Gemini Embedding logic, Vector math
│   │   └── db/             # Supabase wrappers
│   ├── scripts/            # generate_mosaic.py (Synthetic data)
│   └── requirements.txt    # FastAPI, google-generativeai, postgis-helpers
└── .env                    # GEMINI_API_KEY, SUPABASE_URL, etc.

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
| `embedding` | VECTOR(768) | Index: HNSW | **Google text-embedding-004** output |
| `marker_color` | VARCHAR(7) |  | Hex code based on interest cluster |
| `metadata` | JSONB |  | Extracted top interests for UI cards |

---

## 4. API Specification (FastAPI)

### `POST /ingest`

* **Provider**: `google.generativeai`
* **Input**: `username`, `interests[]`, `latitude`, `longitude`.
* **Logic**:
1. Clean and concatenate strings into a semantic bio.
2. Call `genai.embed_content(model="models/text-embedding-004", content=dna_string)`.
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
3. **Batching**: Use the Gemini Python SDK's batch embedding feature to process all 500 users in seconds.

---

## 7. AI Agent Instructions (The "System Prompt")

* **Vector Dimensions**: Ensure `profiles` table is initialized with `vector(768)`.
* **No Latency**: Use `TaskType.RETRIEVAL_QUERY` in Gemini embeddings for the search function to optimize for speed.
* **Z-Index**: Ensure the "Profile Card" component has a higher z-index than the Leaflet map controls.

**Would you like me to generate the initialization SQL script to set up the `profiles` table with the correct 768-dimension vector support?**