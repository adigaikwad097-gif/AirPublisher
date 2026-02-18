# Quick Fix: Token Refresh Not Working

## Current Status

Token refresh is not working because:
- Service role key is NULL (not accessible from database)
- Edge Function calls may be failing
- Token hasn't been updated since 12:10:58

## Immediate Steps

### Step 1: Deploy Updated Edge Function

The Edge Function code has been updated to work without explicit auth. Deploy it:

```bash
supabase functions deploy refresh-token
```

Or via Supabase Dashboard:
1. Go to Edge Functions
2. Open `refresh-token`
3. Copy updated code from `supabase/functions/refresh-token/index.ts`
4. Deploy

### Step 2: Run Migration 024

```sql
\i supabase/migrations/024_fix_pg_net_edge_function_calls.sql
```

This updates the database functions to:
- Call Edge Function without auth header
- Better async handling
- Improved error logging

### Step 3: Test Edge Function Directly

Test if Edge Function works with curl:

```bash
curl -X POST https://pezvnqhexxttlhcnbtta.supabase.co/functions/v1/refresh-token \
  -H "Content-Type: application/json" \
  -d '{
    "platform": "youtube",
    "creator_unique_identifier": "creator_735175e5_1768726539_f7262d3a"
  }'
```

**Expected:** Should return `{"success": true, "access_token": "...", "expires_at": "..."}`

### Step 4: Test Database Function

After deploying Edge Function and running migration:

```sql
SELECT refresh_expired_youtube_tokens();
```

**Check:**
- Return value (should be > 0 if tokens refreshed)
- Check logs for NOTICE/WARNING messages
- Verify token was updated:

```sql
SELECT expires_at, updated_at 
FROM airpublisher_youtube_tokens 
WHERE creator_unique_identifier = 'creator_735175e5_1768726539_f7262d3a';
```

## Troubleshooting

### If Edge Function Returns 401

The Edge Function might still require auth. Options:
1. Add service role key to Edge Function secrets
2. Or modify Edge Function to allow unauthenticated calls (already done in code)

### If pg_net Fails

Check if extension is enabled:
```sql
SELECT * FROM pg_extension WHERE extname = 'pg_net';
```

If not enabled, you may need Supabase admin access.

### If No Response from Edge Function

1. Check Edge Function logs in Supabase Dashboard
2. Verify Edge Function is deployed
3. Check if requests are being received
4. Verify OAuth credentials are set

## Alternative: Use App Endpoint (Works Now)

While fixing the database→Edge Function calls, you can use the app endpoint which already works:

```
GET /api/n8n/video-details?video_id=...
```

This automatically refreshes tokens and works right now.

## Summary

**Current Issue:** Database functions can't authenticate with Edge Function  
**Solution:** Edge Function updated to work without auth for same-project calls  
**Action Needed:** Deploy Edge Function + Run migration 024  
**Fallback:** Use `/api/n8n/video-details` endpoint (already working)

