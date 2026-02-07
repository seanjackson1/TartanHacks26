-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- ============================================================================
-- Table: profiles
-- Using 1024-dimension vectors for intfloat/e5-large-v2 via OpenRouter
-- ============================================================================
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4() REFERENCES auth.users(id) ON DELETE CASCADE,
    username TEXT UNIQUE NOT NULL,
    bio TEXT,
    ideology_score INT CHECK (ideology_score >= 1 AND ideology_score <= 10),
    location GEOGRAPHY(Point, 4326),
    discord_handle TEXT,
    embedding VECTOR(1024),  -- intfloat/e5-large-v2 via OpenRouter
    marker_color VARCHAR(7),
    metadata JSONB,
    dna_string TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create GIST index for location-based queries
CREATE INDEX IF NOT EXISTS idx_profiles_location ON profiles USING GIST(location);

-- Create HNSW index for vector similarity search (cosine distance)
CREATE INDEX IF NOT EXISTS idx_profiles_embedding ON profiles USING hnsw(embedding vector_cosine_ops);

-- ============================================================================
-- Table: interests
-- ============================================================================
CREATE TABLE IF NOT EXISTS interests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    source TEXT NOT NULL CHECK (source IN ('spotify', 'steam', 'manual_beli', 'manual_hevy')),
    raw_text TEXT NOT NULL,
    timestamp TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_interests_user_id ON interests(user_id);

-- ============================================================================
-- Functions for matching
-- ============================================================================

-- Harmony mode: Find similar users using cosine distance
CREATE OR REPLACE FUNCTION find_harmony_matches(
    query_embedding VECTOR(1024),
    user_location GEOGRAPHY,
    match_limit INT DEFAULT 10
)
RETURNS TABLE (
    user_id UUID,
    similarity FLOAT,
    distance_meters FLOAT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        1 - (p.embedding <=> query_embedding) AS similarity,
        ST_Distance(p.location, user_location) AS distance_meters
    FROM profiles p
    WHERE p.embedding IS NOT NULL
    ORDER BY p.embedding <=> query_embedding ASC
    LIMIT match_limit;
END;
$$ LANGUAGE plpgsql;

-- Contrast mode: Find diverse users (dissimilar + far away)
CREATE OR REPLACE FUNCTION find_contrast_matches(
    query_embedding VECTOR(1024),
    user_location GEOGRAPHY,
    min_distance_meters FLOAT DEFAULT 5000000,  -- 5000km default
    match_limit INT DEFAULT 10
)
RETURNS TABLE (
    user_id UUID,
    diversity FLOAT,
    distance_meters FLOAT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        (p.embedding <=> query_embedding) AS diversity,
        ST_Distance(p.location, user_location) AS distance_meters
    FROM profiles p
    WHERE p.embedding IS NOT NULL
        AND ST_Distance(p.location, user_location) > min_distance_meters
    ORDER BY p.embedding <=> query_embedding DESC
    LIMIT match_limit;
END;
$$ LANGUAGE plpgsql;
