# Automatic Token Refresh for n8n - Direct Supabase Access

This guide explains how n8n can automatically get refreshed tokens directly from Supabase without needing to call HTTP endpoints.

## Overview

Instead of calling `/api/n8n/video-details` or `/api/n8n/refresh-token` endpoints, n8n can now query Supabase directly using database functions and views that automatically handle token refresh.

## How It Works

1. **Database Functions**: Created functions that check if tokens are expired and return valid tokens
2. **Database View**: A view (`valid_platform_tokens`) that n8n can query to get valid tokens
3. **Edge Function**: A Supabase Edge Function that handles the actual token refresh via HTTP calls to OAuth providers
4. **Background Refresh**: A cron job (optional) that periodically refreshes expired tokens in the background

## Setup

### 1. Deploy the Edge Function

Deploy the Edge Function to Supabase:

```bash
supabase functions deploy refresh-token
```

Make sure to set these environment variables in Supabase Dashboard:
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `INSTAGRAM_APP_ID` (or `META_APP_ID`)
- `INSTAGRAM_APP_SECRET` (or `META_APP_SECRET`)

### 2. Run the Migrations

Run these migrations in order:
1. `017_create_auto_refresh_token_functions.sql` - Creates database functions and view
2. `018_add_pg_net_for_auto_refresh.sql` - Enables pg_net extension (optional)
3. `019_add_background_token_refresh.sql` - Sets up background refresh (optional)
4. `020_simplify_token_refresh_functions.sql` - Simplifies functions for reliability

**Note**: The background refresh (migration 019) is optional but recommended. It ensures tokens are refreshed proactively.

### 3. Configure n8n

In your n8n workflows, instead of calling HTTP endpoints, use Supabase nodes to query the database directly.

## Usage in n8n

### Option 1: Query the View (Simplest)

Use a Supabase node to query the `valid_platform_tokens` view:

**Query:**
```sql
SELECT * FROM valid_platform_tokens 
WHERE creator_unique_identifier = '{{ $json.creator_unique_identifier }}' 
  AND platform = 'youtube'
```

This will automatically return a valid access token, refreshing it if needed.

### Option 2: Call the Function Directly

Use a Supabase node to call the function via RPC:

**Function:** `get_valid_youtube_token`
**Parameters:**
```json
{
  "p_creator_unique_identifier": "{{ $json.creator_unique_identifier }}"
}
```

**Response:**
```json
{
  "access_token": "ya29.a0AfH6...",
  "expires_at": "2024-01-01T12:00:00Z",
  "refresh_token_expired": false
}
```

### Option 3: Get Token for Video

When you have a video_id, first get the creator_unique_identifier, then get the token:

**Step 1: Get Video**
```sql
SELECT creator_unique_identifier, platform_target 
FROM air_publisher_videos 
WHERE id = '{{ $json.video_id }}'
```

**Step 2: Get Valid Token**
```sql
SELECT * FROM valid_platform_tokens 
WHERE creator_unique_identifier = '{{ $('Get Video').item.json.creator_unique_identifier }}' 
  AND platform = '{{ $('Get Video').item.json.platform_target }}'
```

## Example n8n Workflow

### Scheduled Post Workflow (Using Direct Supabase Access)

1. **Cron Trigger** - Runs every 15 minutes

2. **Supabase: Get Scheduled Posts**
   ```sql
   SELECT * FROM air_publisher_scheduled_posts
   WHERE status = 'pending'
     AND scheduled_at <= NOW()
   ORDER BY scheduled_at ASC
   LIMIT 50
   ```

3. **Loop Over Posts**

4. **Supabase: Get Video Details**
   ```sql
   SELECT * FROM air_publisher_videos
   WHERE id = '{{ $json.video_id }}'
   ```

5. **Supabase: Get Valid Token**
   ```sql
   SELECT * FROM valid_platform_tokens
   WHERE creator_unique_identifier = '{{ $('Get Video').item.json.creator_unique_identifier }}'
     AND platform = '{{ $('Get Video').item.json.platform_target }}'
   ```

6. **Platform API Node** - Use `{{ $('Get Valid Token').item.json.access_token }}` as the access token

7. **Supabase: Update Post Status**
   ```sql
   UPDATE air_publisher_scheduled_posts
   SET status = 'posted', posted_at = NOW()
   WHERE id = '{{ $json.id }}'
   ```

## Benefits

1. **No HTTP Endpoints Required**: n8n queries Supabase directly
2. **Automatic Refresh**: Tokens are automatically refreshed when expired
3. **Simpler Workflows**: No need to call multiple HTTP endpoints
4. **Better Performance**: Direct database queries are faster than HTTP calls
5. **No API Key Needed**: Uses Supabase service role key (configured in n8n)

## Token Refresh Logic

- **YouTube**: Checks if token expires within 5 minutes. If expired, returns existing token (background job refreshes it)
- **Instagram**: Checks if token expires within 7 days. If expired, returns existing token (background job refreshes it)
- **TikTok**: Tokens typically don't expire, returns existing token

**Important**: The database functions return tokens even if expired. The actual refresh happens:
1. **Automatically** via background cron job (if migration 019 is run)
2. **On-demand** when the app's token refresh logic runs (via `/api/n8n/video-details` or similar)
3. **Manually** by calling the Edge Function directly

For n8n, you can query the functions/view and get tokens. If a token is expired, it will be refreshed by the background job or on the next access.

## Error Handling

If `refresh_token_expired` is `true`, the token cannot be refreshed and the user needs to reconnect their account. Check this field in your n8n workflow and handle accordingly.

## Migration from HTTP Endpoints

If you're currently using HTTP endpoints, you can gradually migrate:

1. Keep existing HTTP endpoints for backward compatibility
2. Update new workflows to use direct Supabase access
3. Migrate existing workflows one by one

## Troubleshooting

### Tokens Not Refreshing

1. Check that the Edge Function is deployed
2. Verify environment variables are set in Supabase Dashboard
3. Check Supabase logs for Edge Function errors

### Function Returns NULL

1. Verify tokens exist in the `airpublisher_*_tokens` tables
2. Check that `creator_unique_identifier` matches
3. Verify RLS policies allow access

### Refresh Token Expired

If `refresh_token_expired` is `true`, the user needs to reconnect their account. You can:
1. Notify the user via email
2. Mark the connection as needing reconnection in the UI
3. Skip posting for that creator until they reconnect


