# Manual Testing of Token Refresh Functions

## Test YouTube Refresh

```sql
SELECT refresh_expired_youtube_tokens();
```

**Expected output:**
- Returns a number (count of tokens refreshed)
- Check logs for NOTICE messages showing which creators were refreshed

## Test Instagram Refresh

```sql
SELECT refresh_expired_instagram_tokens();
```

**Expected output:**
- Returns count of refreshed tokens
- Logs will show which creators were processed

## Test TikTok Refresh

```sql
SELECT refresh_expired_tiktok_tokens();
```

**Expected output:**
- Returns count of refreshed tokens
- Logs will show processing results

## Check Function Logs

After running a function, check for NOTICE and WARNING messages:

```sql
-- This shows recent function activity
SELECT * FROM pg_stat_statements 
WHERE query LIKE '%refresh%token%'
ORDER BY calls DESC;
```

## Verify Edge Function Was Called

1. Check Supabase Dashboard → Edge Functions → Logs
2. Look for requests to `/functions/v1/refresh-token`
3. Check response status codes (200 = success)

## Expected Behavior

When a function runs successfully:
- ✅ Returns count of refreshed tokens
- ✅ Logs NOTICE messages for successful refreshes
- ✅ Updates `updated_at` timestamp in token tables
- ✅ Updates `expires_at` with new expiration time
- ✅ Updates access token in database

## Troubleshooting

### Function Returns 0

- No expired tokens found (this is normal if all tokens are valid)
- Check if tokens actually exist and are expired

### Function Returns Error

- Check if `pg_net` extension is enabled
- Verify service role key is accessible
- Check Edge Function is deployed
- Verify Edge Function secrets are set

### Edge Function Returns 401

- Service role key is incorrect
- Check authorization header in function

### Edge Function Returns 500

- Check Edge Function logs
- Verify OAuth credentials are correct
- Check that tokens exist in database

