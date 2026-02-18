# pg_net Usage Explanation

## How pg_net Works

`pg_net` is a **fire-and-forget** async HTTP client for PostgreSQL. It does NOT support:
- ❌ Querying response status codes
- ❌ Getting response bodies
- ❌ Polling for responses
- ❌ Waiting for HTTP requests to complete

## What pg_net DOES Support

✅ Making async HTTP POST/GET requests  
✅ Getting a request ID (bigint)  
✅ Requests execute after transaction commits  
✅ Requests are handled asynchronously by Supabase

## Correct Usage Pattern

```sql
-- Make the request (returns request_id)
SELECT net.http_post(
  url := 'https://example.com/api',
  headers := jsonb_build_object('Content-Type', 'application/json'),
  body := jsonb_build_object('key', 'value')
) INTO v_request_id;

-- That's it! The request is sent asynchronously
-- You cannot check the response from the database
```

## Our Token Refresh Solution

Since we can't check responses, we use a **fire-and-forget** approach:

1. **Database function** calls Edge Function via `pg_net`
2. **Edge Function** receives the request asynchronously
3. **Edge Function** refreshes the token via OAuth API
4. **Edge Function** updates the database directly
5. **No response checking needed** - Edge Function handles everything

## Why This Works

- Edge Function has access to `SUPABASE_SERVICE_ROLE_KEY`
- Edge Function can update the database directly
- We don't need to wait for or check the response
- The cron job just triggers the refresh, Edge Function does the work

## Migration 024

The migration now:
- ✅ Calls Edge Function via `pg_net`
- ✅ Gets request ID (for logging)
- ✅ Logs that refresh was triggered
- ✅ Does NOT try to check response (impossible with pg_net)
- ✅ Relies on Edge Function to update database

## Testing

After running migration 024:

1. **Run the function:**
   ```sql
   SELECT refresh_expired_youtube_tokens();
   ```

2. **Check logs** for NOTICE messages showing requests were triggered

3. **Wait a few seconds** for Edge Function to process

4. **Check if token was updated:**
   ```sql
   SELECT expires_at, updated_at 
   FROM airpublisher_youtube_tokens 
   WHERE creator_unique_identifier = 'your-creator-id';
   ```

5. **Check Edge Function logs** in Supabase Dashboard to see if requests were received

## Summary

- `pg_net` = fire-and-forget HTTP requests
- No response checking possible
- Edge Function handles the actual work
- Database function just triggers the refresh
- This is the correct pattern for Supabase

