# Background Token Refresh Setup

## What "schedule 1" Means

When you see `schedule 1` after running the migration, it means:
- ✅ The cron job was successfully created
- ✅ Job ID is `1` (you can use this to manage the job)
- ✅ The job will run every 10 minutes as scheduled

## Current Implementation

The background refresh function (`refresh_expired_youtube_tokens()`) currently:
- Identifies tokens that need refresh
- Returns a count of tokens needing refresh
- Does NOT automatically refresh tokens (this requires additional setup)

## Why Not Auto-Refresh from Database?

Calling the Edge Function from PostgreSQL requires:
1. `pg_net` extension (enabled in migration 018)
2. Supabase project URL (not stored in database by default)
3. Service role key (should not be stored in database)

## Options for Automatic Refresh

### Option 1: External Cron Job (Recommended)

Set up an external cron job (e.g., using n8n, GitHub Actions, or a simple server) that:

1. Calls the Edge Function periodically:
```bash
curl -X POST https://YOUR_PROJECT.supabase.co/functions/v1/refresh-token \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{"platform": "youtube", "creator_unique_identifier": "creator-id"}'
```

2. Or use n8n to create a workflow that:
   - Runs every 10 minutes
   - Queries expired tokens from Supabase
   - Calls the Edge Function for each expired token

### Option 2: Use n8n Workflow

Create an n8n workflow:

1. **Cron Trigger** - Every 10 minutes
2. **Supabase: Query Expired Tokens**
   ```sql
   SELECT creator_unique_identifier 
   FROM airpublisher_youtube_tokens
   WHERE expires_at <= (NOW() + INTERVAL '5 minutes')
     AND (google_refresh_token IS NOT NULL OR refresh_token IS NOT NULL)
   ```
3. **Loop Over Tokens**
4. **HTTP Request: Call Edge Function**
   - Method: POST
   - URL: `https://YOUR_PROJECT.supabase.co/functions/v1/refresh-token`
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

### Option 3: On-Demand Refresh (Current Behavior)

The current setup works fine without background refresh:
- When n8n queries `get_valid_youtube_token()`, it gets the token
- If expired, the existing app endpoints (`/api/n8n/video-details`) will refresh it
- Tokens refresh automatically when accessed via the app

## Verify Cron Job is Running

Check if the cron job is scheduled:

```sql
SELECT * FROM cron.job WHERE jobname = 'refresh-expired-tokens';
```

Check job execution history:

```sql
SELECT * FROM cron.job_run_details 
WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'refresh-expired-tokens')
ORDER BY start_time DESC 
LIMIT 10;
```

## Remove Cron Job (if needed)

If you want to remove the cron job:

```sql
SELECT cron.unschedule('refresh-expired-tokens');
```

## Recommendation

For now, **Option 3 (On-Demand Refresh)** is sufficient:
- Tokens refresh when n8n accesses them via `/api/n8n/video-details`
- The database functions return tokens (even if expired)
- The app handles refresh automatically

If you want proactive refresh, use **Option 2 (n8n Workflow)** as it's the most flexible and doesn't require additional infrastructure.

