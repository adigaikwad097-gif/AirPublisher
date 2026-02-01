-- Test and troubleshoot cron jobs
-- Run these queries to diagnose why jobs haven't executed

-- 1. Check if pg_cron extension is enabled
SELECT * FROM pg_extension WHERE extname = 'pg_cron';

-- 2. Check job details and next run time
SELECT 
  jobid,
  jobname,
  schedule,
  active,
  -- Calculate next run (approximate)
  CASE 
    WHEN schedule = '*/10 * * * *' THEN 
      NOW() + INTERVAL '10 minutes' - (EXTRACT(MINUTE FROM NOW())::INTEGER % 10 || ' minutes')::INTERVAL
    WHEN schedule = '0 */6 * * *' THEN
      DATE_TRUNC('hour', NOW()) + 
      CASE 
        WHEN EXTRACT(HOUR FROM NOW())::INTEGER % 6 = 0 THEN INTERVAL '6 hours'
        ELSE (6 - (EXTRACT(HOUR FROM NOW())::INTEGER % 6)) || ' hours'
      END
    ELSE 'Unknown'
  END as estimated_next_run
FROM cron.job
WHERE jobid IN (3, 4);

-- 3. Check for any errors in job execution
SELECT 
  runid,
  jobid,
  status,
  return_message,
  start_time,
  end_time
FROM cron.job_run_details
WHERE jobid IN (3, 4)
ORDER BY start_time DESC
LIMIT 10;

-- 4. Manually trigger a job to test (YouTube - runs faster)
SELECT refresh_expired_youtube_tokens();

-- 5. Check if the manual execution worked
SELECT 
  runid,
  jobid,
  status,
  return_message,
  start_time
FROM cron.job_run_details
WHERE jobid = 3
ORDER BY start_time DESC
LIMIT 1;

-- 6. Verify pg_cron worker is running
-- This checks if the background worker process is active
SELECT 
  pid,
  usename,
  application_name,
  state,
  query_start,
  state_change
FROM pg_stat_activity
WHERE application_name LIKE '%cron%';

