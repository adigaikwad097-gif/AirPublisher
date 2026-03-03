-- Migration: Create Unified Connections Registry for AIR Publisher
-- This table serves as the single source of truth for all linked social accounts

CREATE TABLE IF NOT EXISTS airpublisher_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  primary_identifier TEXT NOT NULL, -- The user's main Air Clone identity
  platform TEXT NOT NULL CHECK (platform IN ('youtube', 'instagram', 'facebook', 'tiktok')),
  connection_identifier TEXT NOT NULL, -- Platform specific ID (e.g., yt_12345, igg_12345)
  platform_name TEXT, -- The name/title of the channel or account
  platform_avatar_url TEXT, -- Profile picture URL for the UI
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, platform, connection_identifier)
);

-- Enable RLS
ALTER TABLE airpublisher_connections ENABLE ROW LEVEL SECURITY;

-- Policies for airpublisher_connections
CREATE POLICY "Users can view own connections"
  ON airpublisher_connections FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own connections"
  ON airpublisher_connections FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own connections"
  ON airpublisher_connections FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own connections"
  ON airpublisher_connections FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger for updated_at (assumes update_updated_at_column exists)
DO $$
BEGIN
  CREATE TRIGGER update_airpublisher_connections_updated_at
    BEFORE UPDATE ON airpublisher_connections
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
EXCEPTION
  WHEN undefined_function THEN NULL;
END $$;

-- Backfill existing connections from token tables
-- NOTE: We use the actual table names found in the database

-- YouTube
INSERT INTO airpublisher_connections (user_id, primary_identifier, platform, connection_identifier, platform_name)
SELECT 
  user_id, 
  COALESCE(creator_unique_identifier, 'unknown'), 
  'youtube', 
  COALESCE(creator_unique_identifier, 'unknown'), 
  channel_title
FROM youtube_tokens
ON CONFLICT (user_id, platform, connection_identifier) DO NOTHING;

-- Instagram
INSERT INTO airpublisher_connections (user_id, primary_identifier, platform, connection_identifier, platform_name)
SELECT 
  user_id, 
  COALESCE(creator_unique_identifier, 'unknown'), 
  'instagram', 
  COALESCE(creator_unique_identifier, 'unknown'), 
  username
FROM instagram_tokens
ON CONFLICT (user_id, platform, connection_identifier) DO NOTHING;

-- Add a comment
COMMENT ON TABLE airpublisher_connections IS 'Unified registry for all linked social media platforms. Frontend should use this as the primary source of truth.';
