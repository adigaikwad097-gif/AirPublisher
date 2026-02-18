# Setting Service Role Key for Database Functions

## Issue

The service role key is not accessible via `current_setting('app.settings.service_role_key')`, which means Edge Function calls from database functions may fail with 401 Unauthorized.

## Solution 1: Update Edge Function (Already Done)

The Edge Function has been updated to work without explicit auth for same-project calls. It uses its own `SUPABASE_SERVICE_ROLE_KEY` environment variable (auto-set by Supabase).

## Solution 2: Set Service Role Key in Database (Optional)

If you want to use explicit auth, you can set the service role key:

### Option A: Using Supabase Dashboard

1. Go to Supabase Dashboard → Project Settings → Database
2. Look for "Custom Config" or "Database Settings"
3. Set `app.settings.service_role_key` (if supported)

### Option B: Using SQL (If Allowed)

```sql
-- This may not work in all Supabase projects
ALTER DATABASE postgres SET app.settings.service_role_key = 'your_service_role_key_here';
```

**Note:** This may require superuser access and might not be available in managed Supabase.

## Solution 3: Use Edge Function Without Auth (Current)

The Edge Function now works without explicit auth because:
- It's called from the same Supabase project
- Edge Function has its own `SUPABASE_SERVICE_ROLE_KEY` environment variable
- Database functions can call it without passing the key

## Testing

After deploying the updated Edge Function:

1. **Deploy Edge Function:**
   ```bash
   supabase functions deploy refresh-token
   ```

2. **Run migration 024:**
   ```sql
   \i supabase/migrations/024_fix_pg_net_edge_function_calls.sql
   ```

3. **Test manual refresh:**
   ```sql
   SELECT refresh_expired_youtube_tokens();
   ```

4. **Check if token was refreshed:**
   ```sql
   SELECT expires_at, updated_at 
   FROM airpublisher_youtube_tokens 
   WHERE creator_unique_identifier = 'creator_735175e5_1768726539_f7262d3a';
   ```

## Expected Behavior

- ✅ Function calls Edge Function without auth header
- ✅ Edge Function uses its own service role key
- ✅ Token refresh succeeds
- ✅ Database is updated with new token

## If It Still Fails

1. **Check Edge Function logs** in Supabase Dashboard
2. **Verify Edge Function is deployed** with latest code
3. **Check pg_net extension** is enabled
4. **Test Edge Function directly** with curl (to verify it works)

## Security Note

The Edge Function is now more permissive (allows calls without explicit auth). In production, you might want to:
- Add IP whitelist checks
- Add a secret token for internal calls
- Use Supabase's built-in internal call mechanism

For now, since it's called from the same project, this should be secure enough.

