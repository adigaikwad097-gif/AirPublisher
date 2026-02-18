# Debugging Edge Function Calls from Database

## Issue: Token Refresh Not Working

The token refresh function is being called, but tokens aren't being updated. This suggests the Edge Function call might be failing.

## Check Service Role Key

The functions need access to the service role key. Check if it's available:

```sql
SELECT current_setting('app.settings.service_role_key', true);
```

**If this returns NULL or empty:**
- The service role key isn't set in the database settings
- Edge Function calls will fail with 401 Unauthorized

## Alternative: Use Supabase's Built-in Auth

Supabase Edge Functions can be called without explicit auth if:
1. The function is called from within the same Supabase project
2. The function uses `SUPABASE_SERVICE_ROLE_KEY` environment variable (auto-set)

**Option 1: Remove Authorization Header**

If the Edge Function is in the same project, we might not need the Authorization header. However, this depends on your Edge Function configuration.

**Option 2: Use Different Auth Method**

Instead of `current_setting()`, we could:
- Store service role key in a secure table (not recommended)
- Use Supabase's built-in auth context
- Call Edge Function without auth (if allowed)

## Check pg_net Extension

Verify pg_net is working:

```sql
-- Check if extension exists
SELECT * FROM pg_extension WHERE extname = 'pg_net';

-- Test a simple HTTP call
SELECT * FROM net.http_get('https://httpbin.org/get');
```

## Check Edge Function Logs

1. Go to Supabase Dashboard → Edge Functions → Logs
2. Look for requests to `/functions/v1/refresh-token`
3. Check:
   - Are requests being received?
   - What's the response status?
   - Any error messages?

## Test Edge Function Directly

Test the Edge Function with curl:

```bash
curl -X POST https://pezvnqhexxttlhcnbtta.supabase.co/functions/v1/refresh-token \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "platform": "youtube",
    "creator_unique_identifier": "creator_735175e5_1768726539_f7262d3a"
  }'
```

**If this works but database calls don't:**
- The issue is with how we're calling from the database
- Check service role key access
- Check pg_net configuration

## Check Function Logs

After running the refresh function, check for warnings:

```sql
-- Run the function
SELECT refresh_expired_youtube_tokens();

-- Check for warnings in logs (if accessible)
-- Or check the return value and NOTICE messages
```

## Common Issues

### Issue: Service Role Key Not Available

**Symptom:** Function runs but tokens don't refresh

**Solution:** 
- Check if `current_setting('app.settings.service_role_key')` returns a value
- May need to configure this in Supabase settings
- Or use alternative auth method

### Issue: pg_net Not Responding

**Symptom:** No response from Edge Function

**Solution:**
- Check if pg_net extension is enabled
- Verify network connectivity
- Check if Edge Function is deployed
- Increase wait time in function

### Issue: Edge Function Returns 401

**Symptom:** Authorization failed

**Solution:**
- Verify service role key is correct
- Check Authorization header format
- Ensure Edge Function accepts service role key

### Issue: Edge Function Returns 500

**Symptom:** Internal server error

**Solution:**
- Check Edge Function logs
- Verify OAuth credentials are set
- Check if tokens exist in database
- Verify Edge Function code is correct

## Next Steps

1. **Run migration 024** - This fixes the pg_net call handling
2. **Check service role key** - Verify it's accessible
3. **Test Edge Function directly** - Use curl to verify it works
4. **Check Edge Function logs** - See what errors are occurring
5. **Run manual refresh** - Test the updated function

## Alternative Solution

If pg_net continues to have issues, consider:
- Using n8n workflow to call Edge Function (Option 2 from earlier)
- Using Supabase's built-in scheduled functions
- Calling Edge Function from app endpoints instead

