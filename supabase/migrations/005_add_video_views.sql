-- Migration: Add views tracking to air_publisher_videos
-- This allows tracking views on videos for leaderboard calculations

-- Add views column to air_publisher_videos table
ALTER TABLE air_publisher_videos
ADD COLUMN IF NOT EXISTS views INTEGER NOT NULL DEFAULT 0;

-- Add index for views sorting (for discover page)
CREATE INDEX IF NOT EXISTS idx_air_publisher_videos_views ON air_publisher_videos(views DESC);

-- Add index for status filtering (only show posted videos on discover)
CREATE INDEX IF NOT EXISTS idx_air_publisher_videos_status_posted ON air_publisher_videos(status, views DESC) 
WHERE status = 'posted';

-- Update RLS to allow viewing all posted videos (for discover page)
-- Note: We already have a policy that allows authenticated users to view videos
-- This ensures users can browse all posted videos

-- Comment: The existing RLS policies allow authenticated users to view videos
-- This is sufficient for the discover page to show all posted videos


