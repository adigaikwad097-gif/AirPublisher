# Debugging Edge Function Logs

## Issue: No Logs in Edge Function

If you're not seeing logs in the `refresh-token` Edge Function, here's how to diagnose:

## Step 1: Verify Edge Function is Deployed

1. Go to Supabase Dashboard → Edge Functions
2. Check if `refresh-token` function exists
3. Verify it has the latest code (with logging)

**If not deployed:**
```bash
supabase functions deploy refresh-token
```

## Step 2: Test Edge Function Directly

Test the Edge Function with curl to see if it logs:

```bash
curl -X POST https://pezvnqhexxttlhcnbtta.supabase.co/functions/v1/refresh-token \
  -H "Content-Type: application/json" \
  -d '{
    "platform": "youtube",
    "creator_unique_identifier": "creator_735175e5_1768726539_f7262d3a"
  }'
```

**Check logs:**
- Go to Supabase Dashboard → Edge Functions → Logs
- Look for `[refresh-token]` log entries
- You should see: "Edge Function called", "Request body", etc.

## Step 3: Test Database Function

Run the database function to see if it calls the Edge Function:

```sql
SELECT refresh_expired_youtube_tokens();
```

**Check:**
- Function should return a count (number of tokens processed)
- Check database logs for NOTICE messages
- Check Edge Function logs for incoming requests

## Step 4: Check pg_net is Working

Test if `pg_net` can make HTTP requests:

```sql
-- Test pg_net with a simple request
SELECT net.http_post(
  url := 'https://httpbin.org/post',
  headers := jsonb_build_object('Content-Type', 'application/json'),
  body := jsonb_build_object('test', 'value')
) as request_id;
```

**If this fails:**
- `pg_net` extension might not be enabled
- Check: `SELECT * FROM pg_extension WHERE extname = 'pg_net';`

## Step 5: Verify Edge Function URL

Make sure the URL in the database function is correct:

```sql
-- Check what URL is being used
SELECT 'https://pezvnqhexxttlhcnbtta.supabase.co/functions/v1/refresh-token' as edge_function_url;
```

**Should match:**
- Your Supabase project URL
- Edge Function name: `refresh-token`

## Step 6: Check Edge Function Logs Location

1. **Supabase Dashboard:**
   - Go to Edge Functions
   - Click on `refresh-token`
   - Click "Logs" tab
   - Filter by time range

2. **Real-time logs:**
   - Use Supabase CLI: `supabase functions logs refresh-token`

## Common Issues

### Issue: No logs at all

**Possible causes:**
- Edge Function not deployed
- Wrong Edge Function name
- Requests not reaching Edge Function
- Logs are delayed (wait a few seconds)

**Solution:**
- Deploy Edge Function: `supabase functions deploy refresh-token`
- Test directly with curl first
- Check Edge Function exists in dashboard

### Issue: Logs show errors

**Check:**
- OAuth credentials are set (with `_ALYAN` suffix)
- Tokens exist in database
- Service role key is accessible

### Issue: Database function runs but no Edge Function logs

**Possible causes:**
- `pg_net` requests are failing silently
- Edge Function URL is wrong
- Network issues

**Solution:**
- Test `pg_net` with httpbin first
- Verify Edge Function URL
- Check database function logs for errors

## Expected Log Flow

When working correctly, you should see:

1. **Database function logs:**
   ```
   NOTICE: Triggered token refresh for creator: ... (request_id: 6)
   ```

2. **Edge Function logs:**
   ```
   [refresh-token] Edge Function called
   [refresh-token] Request body: { platform: 'youtube', ... }
   [refresh-token] Processing token refresh: { platform: 'youtube', ... }
   [refresh-token] Found tokens, starting refresh for: youtube
   [refresh-token] Successfully refreshed YouTube token for: ...
   ```

## Testing Checklist

- [ ] Edge Function is deployed
- [ ] Edge Function has logging code
- [ ] Can call Edge Function directly with curl
- [ ] See logs when calling with curl
- [ ] Database function runs without errors
- [ ] `pg_net` extension is enabled
- [ ] Edge Function URL is correct
- [ ] Tokens exist in database
- [ ] OAuth credentials are set

## Next Steps

1. **Deploy Edge Function** with logging:
   ```bash
   supabase functions deploy refresh-token
   ```

2. **Test directly** with curl (see Step 2)

3. **Run database function** and check both:
   - Database logs (NOTICE messages)
   - Edge Function logs (console.log messages)

4. **If still no logs:**
   - Check Edge Function is actually deployed
   - Verify you're looking at the right project
   - Try calling Edge Function directly first

