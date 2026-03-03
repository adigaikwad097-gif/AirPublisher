-- Add error_message column to track why video posts fail
ALTER TABLE air_publisher_videos
  ADD COLUMN IF NOT EXISTS error_message TEXT;
