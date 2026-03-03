-- Migration: Schedule hourly video stats sync via pg_cron
-- Calls the sync-video-stats edge function every hour to fetch
-- views, likes, comments from YouTube, Instagram, and Facebook APIs

SELECT cron.schedule(
  'sync-video-stats-hourly',
  '0 * * * *', -- Every hour at minute 0
  $$
  SELECT net.http_post(
    url := 'https://pezvnqhexxttlhcnbtta.supabase.co/functions/v1/sync-video-stats',
    headers := '{"Content-Type": "application/json"}'::jsonb,
    body := '{}'::jsonb
  );
  $$
);
