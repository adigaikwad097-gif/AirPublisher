-- Migration: Add stats_updated_at column for tracking when stats were last fetched
ALTER TABLE air_publisher_videos
  ADD COLUMN IF NOT EXISTS stats_updated_at TIMESTAMPTZ;
