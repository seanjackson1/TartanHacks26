-- Create messages table for 1-on-1 chat persistence
CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    receiver_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    read_at TIMESTAMPTZ
);

-- Composite index for efficient conversation queries
-- Uses LEAST/GREATEST to treat (A,B) and (B,A) as same conversation
CREATE INDEX idx_messages_conversation ON messages(
    LEAST(sender_id, receiver_id), 
    GREATEST(sender_id, receiver_id), 
    created_at DESC
);

-- Index for unread message queries
CREATE INDEX idx_messages_unread ON messages(receiver_id, read_at) WHERE read_at IS NULL;
