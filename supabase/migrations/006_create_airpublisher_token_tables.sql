-- Migration: Create AIR Publisher platform token tables
-- These tables are separate from existing token tables and optimized for AIR Publisher

-- Table: airpublisher_youtube_tokens
-- Stores YouTube OAuth tokens for AIR Publisher creators
CREATE TABLE IF NOT EXISTS airpublisher_youtube_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  creator_unique_identifier TEXT NOT NULL,
  google_access_token TEXT NOT NULL,
  google_refresh_token TEXT,
  token_type TEXT NOT NULL DEFAULT 'Bearer',
  scope TEXT,
  expires_at TIMESTAMPTZ,
  handle TEXT,
  channel_id TEXT,
  channel_title TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(creator_unique_identifier),
  UNIQUE(user_id)
);

-- Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_airpublisher_youtube_tokens_creator ON airpublisher_youtube_tokens(creator_unique_identifier);
CREATE INDEX IF NOT EXISTS idx_airpublisher_youtube_tokens_user ON airpublisher_youtube_tokens(user_id);

-- Table: airpublisher_instagram_tokens
-- Stores Instagram OAuth tokens for AIR Publisher creators
CREATE TABLE IF NOT EXISTS airpublisher_instagram_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  creator_unique_identifier TEXT NOT NULL,
  facebook_access_token TEXT NOT NULL,
  facebook_refresh_token TEXT,
  instagram_access_token TEXT,
  token_type TEXT NOT NULL DEFAULT 'Bearer',
  expires_at TIMESTAMPTZ,
  instagram_id TEXT,
  username TEXT,
  account_type TEXT CHECK (account_type IN ('PERSONAL', 'BUSINESS')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(creator_unique_identifier),
  UNIQUE(user_id)
);

-- Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_airpublisher_instagram_tokens_creator ON airpublisher_instagram_tokens(creator_unique_identifier);
CREATE INDEX IF NOT EXISTS idx_airpublisher_instagram_tokens_user ON airpublisher_instagram_tokens(user_id);

-- Table: airpublisher_tiktok_tokens
-- Stores TikTok OAuth tokens for AIR Publisher creators
CREATE TABLE IF NOT EXISTS airpublisher_tiktok_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  creator_unique_identifier TEXT NOT NULL,
  tiktok_access_token TEXT NOT NULL,
  tiktok_refresh_token TEXT,
  token_type TEXT NOT NULL DEFAULT 'Bearer',
  scope TEXT,
  expires_at TIMESTAMPTZ,
  tiktok_open_id TEXT,
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(creator_unique_identifier),
  UNIQUE(user_id)
);

-- Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_airpublisher_tiktok_tokens_creator ON airpublisher_tiktok_tokens(creator_unique_identifier);
CREATE INDEX IF NOT EXISTS idx_airpublisher_tiktok_tokens_user ON airpublisher_tiktok_tokens(user_id);

-- RLS Policies (enable RLS but allow authenticated users to read their own tokens)
ALTER TABLE airpublisher_youtube_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE airpublisher_instagram_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE airpublisher_tiktok_tokens ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own tokens
CREATE POLICY "Users can view own youtube tokens"
  ON airpublisher_youtube_tokens FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view own instagram tokens"
  ON airpublisher_instagram_tokens FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view own tiktok tokens"
  ON airpublisher_tiktok_tokens FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Service role can manage all tokens (for OAuth callbacks)
-- Note: OAuth callbacks use service role to bypass RLS
-- In production, you might want more restrictive policies

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_airpublisher_youtube_tokens_updated_at
  BEFORE UPDATE ON airpublisher_youtube_tokens
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_airpublisher_instagram_tokens_updated_at
  BEFORE UPDATE ON airpublisher_instagram_tokens
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_airpublisher_tiktok_tokens_updated_at
  BEFORE UPDATE ON airpublisher_tiktok_tokens
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();



