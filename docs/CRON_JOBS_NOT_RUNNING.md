# Cron Jobs Not Running - Troubleshooting

## Current Status

Your cron jobs are scheduled but haven't executed yet. This is normal if:
- Jobs were just created (they run on schedule, not immediately)
- It hasn't been 10 minutes since the YouTube job was created
- It hasn't been 6 hours since the Instagram job was created

## Quick Test

### Option 1: Manually Trigger a Job

Run this to test if the function works:

```sql
SELECT refresh_expired_youtube_tokens();
```

You should see output like:
```
NOTICE: Found X YouTube tokens that need refresh
```

### Option 2: Check Next Run Time

YouTube job runs every 10 minutes. If you created it at 2:05 PM, it will run at:
- 2:10 PM
- 2:20 PM
- 2:30 PM
- etc.

Instagram job runs every 6 hours at the top of the hour (00:00, 06:00, 12:00, 18:00).

## Common Issues

### Issue 1: pg_cron Extension Not Enabled

**Check:**
```sql
SELECT * FROM pg_extension WHERE extname = 'pg_cron';
```

**Fix:**
```sql
CREATE EXTENSION IF NOT EXISTS pg_cron;
```

**Note:** This requires superuser/admin access. In Supabase, this might be restricted.

### Issue 2: Jobs Not Active

**Check:**
```sql
SELECT jobid, jobname, active FROM cron.job WHERE jobid IN (3, 4);
```

**Fix:** If `active = false`, activate them:
```sql
UPDATE cron.job SET active = true WHERE jobid IN (3, 4);
```

### Issue 3: Supabase Restrictions

Supabase might have restrictions on `pg_cron`. Check:
1. Go to Supabase Dashboard → Database → Extensions
2. Look for `pg_cron` - it should be enabled
3. If not, you may need to contact Supabase support

### Issue 4: Jobs Run But Don't Show Results

The jobs might be running but not logging. Check:
```sql
SELECT * FROM cron.job_run_details
WHERE jobid IN (3, 4)
ORDER BY start_time DESC;
```

## Alternative: Use n8n for Background Refresh

If `pg_cron` doesn't work in your Supabase setup, use n8n instead:

### n8n Workflow for Token Refresh

1. **Cron Trigger** - Every 10 minutes
2. **Supabase Query** - Get expired tokens:
   ```sql
   SELECT creator_unique_identifier
   FROM airpublisher_youtube_tokens
   WHERE expires_at <= (NOW() + INTERVAL '5 minutes')
     AND (google_refresh_token IS NOT NULL OR refresh_token IS NOT NULL)
   ```
3. **Loop Over Tokens**
4. **HTTP Request** - Call Edge Function:
   - URL: `https://pezvnqhexxttlhcnbtta.supabase.co/functions/v1/refresh-token`
   - Method: POST
   - Headers:
     - `Authorization: Bearer YOUR_SERVICE_ROLE_KEY`
     - `Content-Type: application/json`
   - Body:
     ```json
     {
       "platform": "youtube",
       "creator_unique_identifier": "{{ $json.creator_unique_identifier }}"
     }
     ```

## Verify Jobs Will Run

### Check Schedule Syntax

```sql
SELECT 
  jobid,
  jobname,
  schedule,
  -- Verify cron syntax
  CASE 
    WHEN schedule = '*/10 * * * *' THEN 'Every 10 minutes ✓'
    WHEN schedule = '0 */6 * * *' THEN 'Every 6 hours at :00 ✓'
    ELSE 'Unknown schedule'
  END as schedule_check
FROM cron.job
WHERE jobid IN (3, 4);
```

### Wait and Check Again

1. Wait 10-15 minutes after creating the YouTube job
2. Run the check query again:
   ```sql
   SELECT 
     j.jobname,
     MAX(rd.start_time) as last_run,
     rd.status,
     rd.return_message
   FROM cron.job j
   LEFT JOIN cron.job_run_details rd ON j.jobid = rd.jobid
   WHERE j.jobname LIKE '%token%'
   GROUP BY j.jobname, rd.status, rd.return_message
   ORDER BY last_run DESC;
   ```

## Current Status

✅ Jobs are scheduled correctly  
✅ Jobs are active  
⏳ Waiting for scheduled execution  
❓ Need to verify pg_cron is working

## Next Steps

1. **Test manually** - Run `SELECT refresh_expired_youtube_tokens();`
2. **Wait 10 minutes** - Check if YouTube job runs
3. **Check pg_cron extension** - Verify it's enabled
4. **Alternative** - Set up n8n workflow if pg_cron doesn't work

## Important Note

Even if cron jobs don't run automatically, **your token refresh still works**:
- When n8n queries `get_valid_*_token()` functions
- When the app calls `/api/n8n/video-details`
- When tokens are accessed via the view

The cron jobs are just for **proactive monitoring** - they're not required for token refresh to work!

