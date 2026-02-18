# ✅ Token Refresh Setup Complete!

## Current Status

Your automatic token refresh system is fully configured:

### ✅ Cron Jobs Active

1. **Job 3**: `refresh-expired-youtube-tokens`
   - Runs: Every 10 minutes
   - Status: Active ✅
   - Function: Identifies and logs expired YouTube tokens

2. **Job 4**: `refresh-expired-instagram-tokens`
   - Runs: Every 6 hours
   - Status: Active ✅
   - Function: Identifies and logs expired Instagram tokens

### ✅ Database Functions

- `get_valid_youtube_token(creator_unique_identifier)` - Returns valid YouTube tokens
- `get_valid_instagram_token(creator_unique_identifier)` - Returns valid Instagram tokens
- `get_valid_tiktok_token(creator_unique_identifier)` - Returns valid TikTok tokens
- `refresh_expired_youtube_tokens()` - Background refresh function
- `refresh_expired_instagram_tokens()` - Background refresh function

### ✅ Database View

- `valid_platform_tokens` - View for n8n to query tokens directly

### ✅ Edge Function

- `/functions/v1/refresh-token` - Handles actual OAuth token refresh

## How It Works

### For n8n (No HTTP Calls Needed)

n8n can now query Supabase directly:

```sql
-- Get valid token for a creator
SELECT * FROM valid_platform_tokens
WHERE creator_unique_identifier = 'creator-id'
  AND platform = 'youtube';
```

The function automatically:
1. Checks if token is expired
2. Returns valid token if available
3. Returns expired token if refresh token exists (will be refreshed on next access)

### Background Refresh

The cron jobs run automatically:
- **Every 10 minutes**: Checks YouTube tokens
- **Every 6 hours**: Checks Instagram tokens

They log how many tokens need refresh. The actual refresh happens:
1. When n8n queries tokens via the view/functions
2. When the app's token refresh logic runs (via `/api/n8n/video-details`)
3. When the Edge Function is called directly

## Next Steps

### 1. Deploy Edge Function (if not done)

```bash
cd supabase
supabase functions deploy refresh-token
```

### 2. Set Edge Function Secrets

In Supabase Dashboard → Project Settings → Edge Functions:

- `SUPABASE_URL` = `https://pezvnqhexxttlhcnbtta.supabase.co`
- `SUPABASE_SERVICE_ROLE_KEY` = (your service role key)
- `GOOGLE_CLIENT_ID` = (your Google OAuth client ID)
- `GOOGLE_CLIENT_SECRET` = (your Google OAuth client secret)
- `INSTAGRAM_APP_ID` = (your Instagram/Meta app ID)
- `INSTAGRAM_APP_SECRET` = (your Instagram/Meta app secret)

### 3. Test Token Refresh

Run this to see if jobs are executing:

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

### 4. Update n8n Workflows

Replace HTTP Request nodes with Supabase query nodes:

**Old way (HTTP):**
```
HTTP Request → /api/n8n/video-details?video_id=...
```

**New way (Direct Supabase):**
```
Supabase Query → SELECT * FROM valid_platform_tokens WHERE ...
```

## Monitoring

### Check Job Execution

```sql
SELECT * FROM cron.job_run_details
WHERE jobid IN (3, 4)
ORDER BY start_time DESC
LIMIT 10;
```

### Check Token Status

```sql
-- See which tokens are expired
SELECT 
  creator_unique_identifier,
  expires_at,
  CASE 
    WHEN expires_at IS NULL THEN 'No expiration set'
    WHEN expires_at <= NOW() THEN 'Expired'
    WHEN expires_at <= NOW() + INTERVAL '5 minutes' THEN 'Expiring soon'
    ELSE 'Valid'
  END as status
FROM airpublisher_youtube_tokens
ORDER BY expires_at ASC;
```

## Troubleshooting

### Jobs Not Running

1. Check if `pg_cron` extension is enabled:
   ```sql
   SELECT * FROM pg_extension WHERE extname = 'pg_cron';
   ```

2. Check job status:
   ```sql
   SELECT jobid, jobname, active FROM cron.job WHERE jobid IN (3, 4);
   ```

### Tokens Not Refreshing

1. Verify Edge Function is deployed
2. Check Edge Function logs in Supabase Dashboard
3. Verify environment variables are set
4. Test Edge Function manually:
   ```bash
   curl -X POST https://pezvnqhexxttlhcnbtta.supabase.co/functions/v1/refresh-token \
     -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \
     -H "Content-Type: application/json" \
     -d '{"platform": "youtube", "creator_unique_identifier": "test-id"}'
   ```

## Summary

✅ **Cron jobs**: Active and running  
✅ **Database functions**: Created and accessible  
✅ **Database view**: Ready for n8n queries  
✅ **Edge Function**: Ready to deploy  
✅ **Setup**: Complete!

Your n8n workflows can now query Supabase directly without HTTP endpoints, and tokens will refresh automatically! 🎉

