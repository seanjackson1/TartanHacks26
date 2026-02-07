-- Improve contrast mode: weight further users more without hard cutoff
-- This replaces the find_contrast_matches function

CREATE OR REPLACE FUNCTION find_contrast_matches(
    query_embedding VECTOR(1024),
    user_location GEOGRAPHY,
    min_distance_meters FLOAT DEFAULT 0,
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
        (p.embedding <=> query_embedding) + 
            (LEAST(ST_Distance(p.location, user_location), 10000000) / 20000000.0) AS diversity,
        ST_Distance(p.location, user_location) AS distance_meters
    FROM profiles p
    WHERE p.embedding IS NOT NULL
        AND ST_Distance(p.location, user_location) > min_distance_meters
    ORDER BY diversity DESC
    LIMIT match_limit;
END;
$$ LANGUAGE plpgsql;
