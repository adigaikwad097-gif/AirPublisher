# Understanding Cron Job Schedule Output

## What "schedule 4" Means

When you see `schedule 4` (or any number), it means:
- ✅ A cron job was successfully created
- ✅ The number is the **job ID** (unique identifier)
- ✅ The job is now active and will run on schedule

## Migration 021 Creates Two Jobs

The migration `021_implement_actual_token_refresh.sql` creates **two** cron jobs:

1. **refresh-expired-youtube-tokens** 
   - Schedule: Every 10 minutes (`*/10 * * * *`)
   - Job ID: Likely `4` (or next available)

2. **refresh-expired-instagram-tokens**
   - Schedule: Every 6 hours (`0 */6 * * *`)
   - Job ID: Likely `5` (or next available)

## Why You Only See One Output

If you only saw "schedule 4", it could mean:
1. ✅ The first job was created (YouTube tokens)
2. ⚠️ The second job might have failed (check for errors)
3. ✅ Or you only saw one line of output

## Verify Both Jobs Are Created

Run this in your Supabase SQL Editor:

```sql
SELECT jobid, jobname, schedule, active
FROM cron.job
WHERE jobname LIKE '%token%'
ORDER BY jobid;
```

You should see:
- `refresh-expired-youtube-tokens` (jobid: 4)
- `refresh-expired-instagram-tokens` (jobid: 5)

## Check Job Status

See if jobs are running:

```sql
SELECT 
  j.jobid,
  j.jobname,
  j.schedule,
  j.active,
  COUNT(rd.runid) as execution_count,
  MAX(rd.start_time) as last_run
FROM cron.job j
LEFT JOIN cron.job_run_details rd ON j.jobid = rd.jobid
WHERE j.jobname LIKE '%token%'
GROUP BY j.jobid, j.jobname, j.schedule, j.active
ORDER BY j.jobid;
```

## If Second Job Is Missing

If you only have one job, you can manually create the second one:

```sql
SELECT cron.schedule(
  'refresh-expired-instagram-tokens',
  '0 */6 * * *', -- Every 6 hours
  $$
  SELECT refresh_expired_instagram_tokens();
  $$
);
```

## Remove/Update Jobs

To remove a job:
```sql
SELECT cron.unschedule('refresh-expired-youtube-tokens');
SELECT cron.unschedule('refresh-expired-instagram-tokens');
```

To update a job schedule:
```sql
-- First unschedule
SELECT cron.unschedule('refresh-expired-youtube-tokens');
-- Then reschedule with new time
SELECT cron.schedule(
  'refresh-expired-youtube-tokens',
  '*/5 * * * *', -- New schedule: every 5 minutes
  $$
  SELECT refresh_expired_youtube_tokens();
  $$
);
```

## Current Setup Summary

✅ **Job 4**: `refresh-expired-youtube-tokens` - Runs every 10 minutes  
❓ **Job 5**: `refresh-expired-instagram-tokens` - Should run every 6 hours (verify it exists)

The jobs will:
- Find expired tokens
- Log how many need refresh
- Return a count (actual refresh happens on-demand when tokens are accessed)

