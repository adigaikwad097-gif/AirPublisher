-- Migration: Create AIR Publisher tables
-- These tables extend the existing AIR ecosystem schema

-- Table: air_publisher_videos
-- Stores video content for publishing (AI-generated or UGC)
CREATE TABLE IF NOT EXISTS air_publisher_videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_unique_identifier TEXT NOT NULL,
  source_type TEXT NOT NULL CHECK (source_type IN ('ai_generated', 'ugc')),
  title TEXT NOT NULL,
  description TEXT,
  video_url TEXT,
  thumbnail_url TEXT,
  platform_target TEXT NOT NULL CHECK (platform_target IN ('youtube', 'instagram', 'tiktok', 'internal')),
  scheduled_at TIMESTAMPTZ,
  posted_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'posted', 'failed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for creator lookups
CREATE INDEX IF NOT EXISTS idx_air_publisher_videos_creator ON air_publisher_videos(creator_unique_identifier);
-- Index for scheduled posts
CREATE INDEX IF NOT EXISTS idx_air_publisher_videos_scheduled ON air_publisher_videos(scheduled_at) WHERE status = 'scheduled';
-- Index for status filtering
CREATE INDEX IF NOT EXISTS idx_air_publisher_videos_status ON air_publisher_videos(status);

-- Table: air_leaderboards
-- Stores leaderboard rankings and scores
CREATE TABLE IF NOT EXISTS air_leaderboards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_unique_identifier TEXT NOT NULL,
  total_views INTEGER NOT NULL DEFAULT 0,
  total_likes INTEGER NOT NULL DEFAULT 0,
  total_comments INTEGER NOT NULL DEFAULT 0,
  estimated_revenue DECIMAL(10, 2) NOT NULL DEFAULT 0,
  score DECIMAL(12, 2) NOT NULL DEFAULT 0,
  rank INTEGER NOT NULL DEFAULT 0,
  period TEXT NOT NULL CHECK (period IN ('daily', 'weekly', 'all_time')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(creator_unique_identifier, period)
);

-- Index for leaderboard queries
CREATE INDEX IF NOT EXISTS idx_air_leaderboards_period ON air_leaderboards(period, score DESC);
CREATE INDEX IF NOT EXISTS idx_air_leaderboards_creator ON air_leaderboards(creator_unique_identifier);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_air_publisher_videos_updated_at
  BEFORE UPDATE ON air_publisher_videos
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_air_leaderboards_updated_at
  BEFORE UPDATE ON air_leaderboards
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE air_publisher_videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE air_leaderboards ENABLE ROW LEVEL SECURITY;

-- RLS Policies for air_publisher_videos
-- NOTE: Assumes creator_profiles table has a user_id column that matches Supabase Auth users
-- Creators can view and manage their own videos
CREATE POLICY "Creators can view own videos"
  ON air_publisher_videos FOR SELECT
  USING (auth.uid()::text IN (
    SELECT user_id::text FROM creator_profiles 
    WHERE unique_identifier = air_publisher_videos.creator_unique_identifier
  ));

CREATE POLICY "Creators can insert own videos"
  ON air_publisher_videos FOR INSERT
  WITH CHECK (auth.uid()::text IN (
    SELECT user_id::text FROM creator_profiles 
    WHERE unique_identifier = air_publisher_videos.creator_unique_identifier
  ));

CREATE POLICY "Creators can update own videos"
  ON air_publisher_videos FOR UPDATE
  USING (auth.uid()::text IN (
    SELECT user_id::text FROM creator_profiles 
    WHERE unique_identifier = air_publisher_videos.creator_unique_identifier
  ));

-- RLS Policies for air_leaderboards
-- Everyone can view leaderboards (public read)
CREATE POLICY "Anyone can view leaderboards"
  ON air_leaderboards FOR SELECT
  USING (true);

-- Only system can update leaderboards (via service role)
-- This will be handled server-side

