# Automatic Token Refresh via Cron Jobs + Edge Function

## Overview

The cron jobs now automatically call the Edge Function to refresh expired tokens. This makes token refresh truly automatic without needing external triggers.

## How It Works

1. **Cron Jobs Run Periodically:**
   - YouTube: Every 10 minutes
   - Instagram: Every 6 hours
   - TikTok: Every 12 hours

2. **Functions Find Expired Tokens:**
   - Query database for tokens that are expired or expiring soon
   - Limit to 10 tokens per run to avoid overwhelming the API

3. **Functions Call Edge Function:**
   - Use `pg_net` extension to make HTTP POST requests
   - Call `/functions/v1/refresh-token` endpoint
   - Pass platform and creator_unique_identifier

4. **Edge Function Refreshes Tokens:**
   - Calls OAuth provider APIs
   - Updates database with new tokens
   - Returns success/failure

5. **Functions Log Results:**
   - Log successful refreshes
   - Log errors for troubleshooting

## Prerequisites

### 1. Enable pg_net Extension

The migration automatically enables `pg_net`, but verify it's enabled:

```sql
SELECT * FROM pg_extension WHERE extname = 'pg_net';
```

If not enabled, you may need Supabase admin access.

### 2. Set Service Role Key

The functions need access to the service role key. In Supabase, this is typically available via:

```sql
-- This should be auto-set by Supabase
SELECT current_setting('app.settings.service_role_key', true);
```

If this returns NULL, you may need to configure it in Supabase settings.

### 3. Deploy Edge Function

Make sure the Edge Function is deployed:

```bash
supabase functions deploy refresh-token
```

### 4. Set Edge Function Secrets

Set all OAuth credentials with `_ALYAN` suffix:
- `GOOGLE_CLIENT_ID_ALYAN`
- `GOOGLE_CLIENT_SECRET_ALYAN`
- `INSTAGRAM_APP_ID_ALYAN`
- `INSTAGRAM_APP_SECRET_ALYAN`
- `TIKTOK_CLIENT_KEY_ALYAN`
- `TIKTOK_CLIENT_SECRET_ALYAN`

## Running the Migration

Run migration `023_add_automatic_edge_function_calls.sql`:

```sql
\i supabase/migrations/023_add_automatic_edge_function_calls.sql
```

This will:
- Enable pg_net extension
- Update YouTube and Instagram refresh functions
- Add TikTok refresh function
- Schedule TikTok refresh cron job

## Verify It's Working

### Check Cron Jobs

```sql
SELECT jobid, jobname, schedule, active
FROM cron.job
WHERE jobname LIKE '%token%'
ORDER BY jobid;
```

You should see:
- Job 6: `refresh-expired-youtube-tokens` (every 10 minutes)
- Job 7: `refresh-expired-instagram-tokens` (every 6 hours)
- New job: `refresh-expired-tiktok-tokens` (every 12 hours)

### Check Job Execution

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

### Check Logs

The functions log their activity. Check Supabase logs or run:

```sql
-- This will show recent notices/warnings
SELECT * FROM pg_stat_statements 
WHERE query LIKE '%refresh%token%';
```

## Troubleshooting

### pg_net Not Available

If `pg_net` extension can't be enabled:
- Contact Supabase support
- Or use n8n workflow as alternative (Option 2)

### Service Role Key Not Found

If `current_setting('app.settings.service_role_key')` returns NULL:
- Check Supabase project settings
- May need to set it manually (check Supabase docs)

### Edge Function Returns 401

- Verify Edge Function is deployed
- Check that service role key is correct
- Verify Edge Function secrets are set

### Edge Function Returns 500

- Check Edge Function logs in Supabase Dashboard
- Verify OAuth credentials are correct
- Check that tokens exist in database

### No Tokens Being Refreshed

- Verify tokens exist in `airpublisher_*_tokens` tables
- Check that tokens are actually expired
- Verify refresh tokens exist (for YouTube/TikTok)

## Performance Considerations

- **Rate Limiting:** Functions limit to 10 tokens per run
- **Async Nature:** pg_net is async, so we wait 1 second for responses
- **Error Handling:** Errors are logged but don't stop the process
- **Database Load:** Functions run on schedule, not continuously

## Manual Testing

Test a function manually:

```sql
SELECT refresh_expired_youtube_tokens();
```

This will:
1. Find expired YouTube tokens
2. Call Edge Function for each
3. Return count of refreshed tokens
4. Log results

## Summary

✅ **Automatic Refresh:** Cron jobs call Edge Function automatically  
✅ **All Platforms:** YouTube, Instagram, and TikTok  
✅ **Error Handling:** Graceful error handling with logging  
✅ **Rate Limited:** Max 10 tokens per run  
✅ **No External Dependencies:** Works entirely within Supabase  

Tokens will now refresh automatically in the background! 🎉

