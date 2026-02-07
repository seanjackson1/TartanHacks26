-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- ============================================================================
-- Table: users (profiles)
-- ============================================================================
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4() REFERENCES auth.users(id) ON DELETE CASCADE,
    username TEXT UNIQUE NOT NULL,
    bio TEXT,
    ideology_score INT CHECK (ideology_score >= 1 AND ideology_score <= 10),
    location GEOGRAPHY(Point, 4326),
    discord_handle TEXT,
    embedding VECTOR(1536),  -- OpenAI text-embedding-3-small
    cluster_id INT,
    marker_color VARCHAR(7),
    metadata JSONB,
    dna_string TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create GIST index for location-based queries
CREATE INDEX IF NOT EXISTS idx_users_location ON users USING GIST(location);

-- Create HNSW index for vector similarity search
CREATE INDEX IF NOT EXISTS idx_users_embedding ON users USING hnsw(embedding vector_cosine_ops);

-- ============================================================================
-- Table: interests
-- ============================================================================
CREATE TABLE IF NOT EXISTS interests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    source TEXT NOT NULL CHECK (source IN ('spotify', 'steam', 'manual_beli', 'manual_hevy')),
    raw_text TEXT NOT NULL,
    timestamp TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_interests_user_id ON interests(user_id);

-- ============================================================================
-- Functions for matching
-- ============================================================================

-- Function to find similar users using cosine distance (harmony mode)
CREATE OR REPLACE FUNCTION find_similar_users(
    query_embedding VECTOR(1536),
    match_limit INT DEFAULT 10,
    radius_meters FLOAT DEFAULT NULL,
    user_location GEOGRAPHY DEFAULT NULL
)
RETURNS TABLE (
    user_id UUID,
    similarity FLOAT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        u.id,
        1 - (u.embedding <=> query_embedding) AS similarity
    FROM users u
    WHERE u.embedding IS NOT NULL
        AND (radius_meters IS NULL OR user_location IS NULL 
             OR ST_DWithin(u.location, user_location, radius_meters))
    ORDER BY u.embedding <=> query_embedding ASC
    LIMIT match_limit;
END;
$$ LANGUAGE plpgsql;

-- Function to find diverse users (contrast mode)
CREATE OR REPLACE FUNCTION find_diverse_users(
    query_embedding VECTOR(1536),
    match_limit INT DEFAULT 10,
    min_distance_meters FLOAT DEFAULT 1000
)
RETURNS TABLE (
    user_id UUID,
    diversity FLOAT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        u.id,
        (u.embedding <=> query_embedding) AS diversity
    FROM users u
    WHERE u.embedding IS NOT NULL
    ORDER BY u.embedding <=> query_embedding DESC
    LIMIT match_limit;
END;
$$ LANGUAGE plpgsql;
