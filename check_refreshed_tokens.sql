-- Check if tokens were actually refreshed by the cron jobs
-- This helps verify the Edge Function calls are working

-- 1. Check YouTube tokens that were recently updated
SELECT 
  creator_unique_identifier,
  expires_at,
  updated_at,
  CASE 
    WHEN expires_at > NOW() THEN 'Valid'
    WHEN expires_at <= NOW() THEN 'Expired'
    ELSE 'No expiration set'
  END as token_status,
  NOW() - updated_at as time_since_update
FROM airpublisher_youtube_tokens
WHERE updated_at > NOW() - INTERVAL '1 hour'
ORDER BY updated_at DESC;

-- 2. Check if any tokens were refreshed in the last hour
SELECT 
  COUNT(*) as tokens_refreshed_recently,
  MIN(updated_at) as earliest_refresh,
  MAX(updated_at) as latest_refresh
FROM airpublisher_youtube_tokens
WHERE updated_at > NOW() - INTERVAL '1 hour';

-- 3. Check tokens that should be refreshed soon
SELECT 
  creator_unique_identifier,
  expires_at,
  expires_at - NOW() as time_until_expiry,
  CASE 
    WHEN expires_at <= NOW() + INTERVAL '5 minutes' THEN 'Needs refresh soon'
    WHEN expires_at <= NOW() + INTERVAL '1 hour' THEN 'Expiring in 1 hour'
    ELSE 'Valid'
  END as refresh_status
FROM airpublisher_youtube_tokens
WHERE expires_at IS NOT NULL
  AND expires_at <= NOW() + INTERVAL '1 hour'
ORDER BY expires_at ASC;

-- 4. Test the refresh function manually (optional)
-- SELECT refresh_expired_youtube_tokens();

