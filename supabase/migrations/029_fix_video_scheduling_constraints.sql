-- Fix status CHECK: add 'processing' for atomic locking in cron
ALTER TABLE air_publisher_videos DROP CONSTRAINT air_publisher_videos_status_check;
ALTER TABLE air_publisher_videos ADD CONSTRAINT air_publisher_videos_status_check
  CHECK (status = ANY (ARRAY['draft','scheduled','processing','posted','failed']));

-- Fix platform_target CHECK: add 'facebook' (UI already supports it)
ALTER TABLE air_publisher_videos DROP CONSTRAINT air_publisher_videos_platform_target_check;
ALTER TABLE air_publisher_videos ADD CONSTRAINT air_publisher_videos_platform_target_check
  CHECK (platform_target IS NULL OR platform_target = ANY (ARRAY['youtube','instagram','facebook','tiktok','internal']));

-- Recover any stuck 'processing' videos back to 'scheduled'
UPDATE air_publisher_videos SET status = 'scheduled' WHERE status = 'processing';
