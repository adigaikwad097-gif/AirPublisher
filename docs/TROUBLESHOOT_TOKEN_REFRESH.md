# Troubleshooting Token Refresh

## Issue: Token Expired But Not Refreshed

### Why This Happens

The cron job runs on a schedule:
- **YouTube**: Every 10 minutes (at :00, :10, :20, :30, :40, :50)
- If a token expires at 13:10:56, but the job ran at 13:10:00, it won't be caught until 13:20:00

### Solution 1: Wait for Next Run

The next cron job run will catch it:
- Next YouTube job: 13:20:00
- Token will be refreshed then

### Solution 2: Manual Refresh (Immediate)

Run this to refresh immediately:

```sql
SELECT refresh_expired_youtube_tokens();
```

This will:
1. Find expired tokens
2. Call Edge Function for each
3. Update database immediately

### Solution 3: Check Edge Function Logs

1. Go to Supabase Dashboard → Edge Functions → Logs
2. Look for requests to `/functions/v1/refresh-token`
3. Check if requests are successful (200 status)
4. Check for any errors

## Verify Refresh Worked

### Check Token Was Updated

```sql
SELECT 
  creator_unique_identifier,
  expires_at,
  updated_at,
  expires_at - NOW() as time_until_expiry
FROM airpublisher_youtube_tokens
WHERE creator_unique_identifier = 'creator_735175e5_1768726539_f7262d3a';
```

**Expected after refresh:**
- `expires_at` should be in the future (e.g., 1 hour from now)
- `updated_at` should be recent (just now)
- `time_until_expiry` should be positive

### Check Function Return Value

```sql
SELECT refresh_expired_youtube_tokens();
```

**Expected:**
- Returns a number (count of tokens refreshed)
- Should be > 0 if tokens were refreshed
- Check logs for NOTICE messages

## Common Issues

### Issue: Function Returns 0

**Possible causes:**
- No expired tokens found (all tokens are valid)
- Refresh tokens are missing
- Tokens don't meet refresh criteria

**Check:**
```sql
SELECT 
  creator_unique_identifier,
  expires_at,
  google_refresh_token IS NOT NULL as has_refresh_token
FROM airpublisher_youtube_tokens
WHERE expires_at <= NOW() + INTERVAL '5 minutes';
```

### Issue: Edge Function Returns 401

**Possible causes:**
- Service role key is incorrect
- Authorization header is missing

**Fix:**
- Verify `current_setting('app.settings.service_role_key')` returns a value
- Check Edge Function logs for authentication errors

### Issue: Edge Function Returns 500

**Possible causes:**
- OAuth credentials are incorrect
- Token refresh failed at OAuth provider
- Edge Function secrets not set

**Fix:**
- Check Edge Function logs
- Verify all `_ALYAN` secrets are set
- Test OAuth credentials manually

### Issue: pg_net Not Working

**Possible causes:**
- Extension not enabled
- Network requests blocked

**Fix:**
```sql
-- Check if extension is enabled
SELECT * FROM pg_extension WHERE extname = 'pg_net';

-- If not enabled, try:
CREATE EXTENSION IF NOT EXISTS pg_net;
```

## Testing Workflow

1. **Check token status:**
   ```sql
   SELECT * FROM airpublisher_youtube_tokens 
   WHERE creator_unique_identifier = 'your-creator-id';
   ```

2. **Manually trigger refresh:**
   ```sql
   SELECT refresh_expired_youtube_tokens();
   ```

3. **Verify token was updated:**
   ```sql
   SELECT expires_at, updated_at 
   FROM airpublisher_youtube_tokens 
   WHERE creator_unique_identifier = 'your-creator-id';
   ```

4. **Check Edge Function logs:**
   - Go to Supabase Dashboard
   - Check Edge Functions → Logs
   - Look for successful requests

## Expected Behavior

✅ **Token expires at 13:10:56**
- Cron job runs at 13:10:00 → Token not expired yet, skipped
- Cron job runs at 13:20:00 → Token expired, will be refreshed
- Token updated with new expiration (e.g., 14:20:00)

✅ **Manual refresh:**
- Call function → Immediately refreshes expired tokens
- Updates database → New token and expiration set
- Returns count → Number of tokens refreshed

## Summary

- **Automatic refresh:** Happens on schedule (may miss tokens that expire between runs)
- **Manual refresh:** Immediate, use for testing or urgent refresh
- **Edge Function:** Must be deployed and have secrets set
- **Verification:** Check `updated_at` and `expires_at` timestamps

