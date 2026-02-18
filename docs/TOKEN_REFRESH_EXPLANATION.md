# How Token Refresh Actually Works

## Current Implementation

### What the Functions Do

The database functions (`get_valid_youtube_token`, etc.) **check** if tokens are expired but **do NOT refresh them automatically**. They:

1. ✅ Check if token is expired or expiring soon
2. ✅ Return the existing token (even if expired)
3. ❌ Do NOT call OAuth APIs to refresh

### What Actually Refreshes Tokens

Tokens are refreshed by:

1. **App Endpoints** (`/api/n8n/video-details`)
   - Uses `getValidYouTubeAccessToken()` from `lib/youtube/tokens.ts`
   - This function DOES refresh tokens via OAuth APIs
   - Updates the database with new tokens

2. **Edge Function** (`/functions/v1/refresh-token`)
   - Can be called directly to refresh tokens
   - Updates the database with new tokens

3. **Background Cron Jobs** (currently)
   - Only identify tokens needing refresh
   - Do NOT actually refresh them yet

## How It Works in Practice

### Scenario 1: n8n Queries the View

```sql
SELECT * FROM valid_platform_tokens WHERE platform = 'youtube';
```

**What happens:**
1. View calls `get_valid_youtube_token()`
2. Function checks if token is expired
3. Function returns existing token (even if expired)
4. **Token is NOT refreshed automatically**

**To actually refresh:**
- n8n would need to call `/api/n8n/video-details` endpoint
- OR call the Edge Function directly
- OR the app's refresh logic needs to run

### Scenario 2: App Calls `/api/n8n/video-details`

**What happens:**
1. Endpoint calls `getValidYouTubeAccessToken()` from `lib/youtube/tokens.ts`
2. This function **DOES refresh** tokens if expired
3. Updates database with new token
4. Returns fresh token

**This is where actual refresh happens!**

## Making Functions Auto-Refresh

To make the database functions actually refresh tokens, we would need:

1. **Use pg_net extension** to call the Edge Function from PostgreSQL
2. **Or** call OAuth APIs directly from PostgreSQL (not recommended)
3. **Or** use a different approach

### Option 1: Call Edge Function from Function (Complex)

```sql
-- This would require pg_net and proper configuration
SELECT net.http_post(
  url := 'https://pezvnqhexxttlhcnbtta.supabase.co/functions/v1/refresh-token',
  headers := jsonb_build_object('Authorization', 'Bearer ...'),
  body := jsonb_build_object('platform', 'youtube', 'creator_unique_identifier', ...)
);
```

**Challenges:**
- Requires pg_net extension
- Needs service role key (security concern)
- Complex error handling
- Async nature of HTTP calls

### Option 2: Use App Endpoints (Current - Recommended)

The current approach is actually better:
- Security: OAuth secrets stay in the app, not database
- Simplicity: Functions just return tokens
- Flexibility: App handles refresh logic

## Recommended Workflow

### For n8n

**Option A: Query View + Call Endpoint if Expired**
1. Query `valid_platform_tokens` view
2. Check `refresh_token_expired` flag
3. If `true` or token looks expired, call `/api/n8n/video-details` to refresh
4. Use the refreshed token

**Option B: Always Use App Endpoint**
1. Call `/api/n8n/video-details?video_id=...`
2. This endpoint automatically refreshes tokens
3. Returns fresh token

**Option C: Use View for Valid Tokens**
1. Query `valid_platform_tokens` view
2. If `refresh_token_expired = false`, use the token
3. If expired, call endpoint to refresh

## Summary

**Current State:**
- ✅ Functions check expiration
- ✅ Functions return tokens
- ❌ Functions do NOT refresh automatically
- ✅ App endpoints DO refresh automatically

**To Get Automatic Refresh:**
- Use `/api/n8n/video-details` endpoint (recommended)
- OR implement pg_net calls in functions (complex)
- OR set up n8n workflow to call Edge Function when tokens expire

The functions are working as designed - they're "getters" that return tokens. The actual refresh happens in the app layer, which is more secure and flexible.

