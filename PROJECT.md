This specification is designed to be ingested by an AI coding agent (like Cursor, Windsurf, or a custom GPT) to scaffold the entire project with minimal hallucination.

# Technical Specification: Project Global Mosaic

## 1. System Overview

**Global Mosaic** is a geospatial-social discovery platform. It uses **Next.js** (Frontend), **FastAPI** (Backend), and **Supabase** (Database/Vector Store). The core value prop is visualizing human similarity through high-dimensional vector embeddings displayed on a 2D map.

---

## 2. File Structure

The project is a monorepo split into `mosaic/` (Frontend) and `server/` (Backend).

```text
/
├── mosaic/                 # Next.js Frontend
│   ├── src/
│   │   ├── components/     # UI: Map, ProfileCard, ControlPanel
│   │   ├── hooks/          # useMapData, useUserLocation
│   │   ├── lib/            # Supabase client, utils
│   │   └── types/          # TypeScript interfaces (User, Vector, Mode)
│   ├── public/             # Map assets, custom markers
│   └── tailwind.config.ts  # Theme: Mosaic (Deep Navys, Neon Accents)
├── server/                 # FastAPI Backend
│   ├── app/
│   │   ├── main.py         # Entry point
│   │   ├── routes/         # /ingest, /search, /analytics
│   │   ├── core/           # OpenAI logic, Vector math
│   │   └── db/             # Supabase wrappers
│   ├── scripts/            # generate_mosaic.py (Synthetic data)
│   └── requirements.txt    # FastAPI, OpenAI, Postgis-helpers
└── docker-compose.yml      # (Optional) For local dev

```

---

## 3. Data Schema (PostgreSQL/Supabase)

### Table: `profiles`

| Field | Type | Constraint | Description |
| --- | --- | --- | --- |
| `id` | UUID | Primary Key | Linked to Auth.users |
| `username` | TEXT | Unique |  |
| `location` | GEOGRAPHY(Point, 4326) | Index: GIST | Real-world coordinates |
| `dna_string` | TEXT |  | Raw text: "Spotify: X, Steam: Y" |
| `embedding` | VECTOR(1536) | Index: HNSW | OpenAI text-embedding-3-small |
| `cluster_id` | INT |  | 1:Gamer, 2:Coder, 3:Artist, etc. |
| `marker_color` | VARCHAR(7) |  | Hex code based on cluster_id |
| `metadata` | JSONB |  | Extracted top interests for UI cards |

---

## 4. API Specification (FastAPI)

### `POST /ingest`

* **Purpose**: Convert raw user data into a "Personality Vector."
* **Input**: `username`, `interests[]`, `latitude`, `longitude`.
* **Logic**:
1. Concatenate interests into a single semantic string.
2. Call OpenAI `embeddings` API.
3. Calculate "Cluster" based on top keyword frequency.
4. Upsert to Supabase.



### `POST /search`

* **Purpose**: Retrieve neighbors based on "Mode."
* **Input**: `user_id`, `mode` ("harmony" | "contrast"), `limit`.
* **Logic**:
* **Harmony**: `ORDER BY embedding <=> query_vector ASC`.
* **Contrast**: `ORDER BY embedding <=> query_vector DESC` + `WHERE ST_Distance > X`.



---

## 5. Frontend & Mapping Logic (Next.js)

### The Map Engine (Leaflet)

* **Tileset**: `Stadia.AlidadeSmoothDark` (to make colored dots pop).
* **Rendering**: Use `CircleMarker` instead of standard Pins for a "Mosaic Tile" aesthetic.
* **Colors**:
* `#00F2FF` (Cyan): Tech/Dev
* `#FF007A` (Magenta): Creative/Arts
* `#ADFF2F` (Green): Gaming/Esports
* `#FFA500` (Orange): Fitness/Outdoors



### Animation Stack

* **Framer Motion**: Use `AnimatePresence` for the "Profile Card" slide-in when a dot is clicked.
* **D3.js Interop**: If `leafet.heat` is used, ensure the gradient matches the Mosaic neon palette.

---

## 6. Synthetic Data Strategy (`generate_mosaic.py`)

To ensure the demo looks "Global" in a local hackathon environment:

1. **Archetypes**: Define 5 JSON templates (e.g., *The Berlin Techno-Coder*).
2. **Jittering**: Pick 20 global hubs (SF, NYC, London, Tokyo, Berlin). Apply a random Gaussian noise to the coordinates so points scatter realistically around cities.
3. **Batching**: Use `psycopg2` or Supabase Python SDK to `upsert` 500+ records in a single transaction.

---

## 7. AI Agent Instructions (The "System Prompt")

*When generating code for this project, follow these conventions:*

* **Naming**: Use PascalCase for React components, snake_case for Python variables.
* **Errors**: All API endpoints must return standard HTTP exception detail.
* **Leaflet**: Always check if `window` is defined before rendering the Map component (Next.js SSR safety).
* **Vector Logic**: Use Cosine Distance (`<=>`) for similarity, not Euclidean (`<->`).

**Would you like me to generate the `generate_mosaic.py` script so you can immediately populate your database with these colorful global data points?**