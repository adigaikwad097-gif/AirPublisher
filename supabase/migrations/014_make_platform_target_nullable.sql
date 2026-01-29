-- Make platform_target nullable (videos can be drafts without a platform selected)
-- Users will select platform when publishing, not when uploading

-- Drop the existing NOT NULL constraint
ALTER TABLE air_publisher_videos 
  ALTER COLUMN platform_target DROP NOT NULL;

-- Update the CHECK constraint to allow NULL
ALTER TABLE air_publisher_videos 
  DROP CONSTRAINT IF EXISTS air_publisher_videos_platform_target_check;

ALTER TABLE air_publisher_videos 
  ADD CONSTRAINT air_publisher_videos_platform_target_check 
  CHECK (platform_target IS NULL OR platform_target IN ('youtube', 'instagram', 'tiktok', 'internal'));



