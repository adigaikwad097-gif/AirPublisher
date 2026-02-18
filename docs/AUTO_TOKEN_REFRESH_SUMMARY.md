# Automatic Token Refresh - Complete Solution

## Overview

This solution allows n8n to query Supabase directly for tokens without needing to call HTTP endpoints. Tokens are automatically refreshed in the background.

## Architecture

```
┌─────────────┐
│     n8n     │
└──────┬──────┘
       │
       │ Query Supabase
       │ (via Supabase node)
       ▼
┌─────────────────────────────────┐
│   Supabase Database              │
│                                  │
│  ┌──────────────────────────┐   │
│  │ valid_platform_tokens    │   │
│  │ (View)                   │   │
│  └───────────┬──────────────┘   │
│              │                   │
│              ▼                   │
│  ┌──────────────────────────┐   │
│  │ get_valid_*_token()      │   │
│  │ (Functions)              │   │
│  └───────────┬──────────────┘   │
│              │                   │
│              ▼                   │
│  ┌──────────────────────────┐   │
│  │ airpublisher_*_tokens   │   │
│  │ (Tables)                │   │
│  └──────────────────────────┘   │
└─────────────────────────────────┘
       │
       │ Background refresh
       ▼
┌─────────────────────────────────┐
│   Supabase Edge Function         │
│   /functions/v1/refresh-token    │
└───────────┬─────────────────────┘
            │
            │ OAuth API calls
            ▼
┌─────────────────────────────────┐
│   OAuth Providers                │
│   (Google, Instagram, TikTok)     │
└─────────────────────────────────┘
```

## Components

### 1. Database Functions
- `get_valid_youtube_token(creator_unique_identifier)` - Returns valid YouTube token
- `get_valid_instagram_token(creator_unique_identifier)` - Returns valid Instagram token
- `get_valid_tiktok_token(creator_unique_identifier)` - Returns valid TikTok token

These functions:
- Check if tokens are expired
- Return valid tokens if available
- Return expired tokens if refresh token exists (background job will refresh)

### 2. Database View
- `valid_platform_tokens` - A view that n8n can query to get tokens for any platform

### 3. Edge Function
- `/functions/v1/refresh-token` - Handles actual token refresh via OAuth APIs

### 4. Background Job (Optional)
- Cron job that periodically refreshes expired tokens
- Runs every 10 minutes
- Ensures tokens are fresh before n8n queries

## Setup Steps

### Step 1: Deploy Edge Function

```bash
cd supabase
supabase functions deploy refresh-token
```

Set environment variables in Supabase Dashboard:
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `INSTAGRAM_APP_ID` (or `META_APP_ID`)
- `INSTAGRAM_APP_SECRET` (or `META_APP_SECRET`)

### Step 2: Run Migrations

Run these migrations in order:

```sql
-- 017: Create functions and view
\i supabase/migrations/017_create_auto_refresh_token_functions.sql

-- 018: Enable pg_net (optional, for future enhancements)
\i supabase/migrations/018_add_pg_net_for_auto_refresh.sql

-- 019: Set up background refresh (optional but recommended)
\i supabase/migrations/019_add_background_token_refresh.sql

-- 020: Simplify functions
\i supabase/migrations/020_simplify_token_refresh_functions.sql
```

### Step 3: Configure n8n

In your n8n workflows, use Supabase nodes instead of HTTP Request nodes.

## Usage in n8n

### Example: Get Token for Scheduled Post

**Node 1: Get Scheduled Post**
```sql
SELECT * FROM air_publisher_scheduled_posts
WHERE status = 'pending'
  AND scheduled_at <= NOW()
LIMIT 1
```

**Node 2: Get Video**
```sql
SELECT creator_unique_identifier, platform_target
FROM air_publisher_videos
WHERE id = '{{ $json.video_id }}'
```

**Node 3: Get Valid Token**
```sql
SELECT * FROM valid_platform_tokens
WHERE creator_unique_identifier = '{{ $('Get Video').item.json.creator_unique_identifier }}'
  AND platform = '{{ $('Get Video').item.json.platform_target }}'
```

**Node 4: Use Token**
- Access token: `{{ $('Get Valid Token').item.json.access_token }}`
- Check if refresh needed: `{{ $('Get Valid Token').item.json.refresh_token_expired }}`

## How Token Refresh Works

### Automatic Refresh Flow

1. **n8n queries** `valid_platform_tokens` view
2. **View calls** `get_valid_*_token()` function
3. **Function checks** if token is expired
4. **If expired:**
   - Returns existing token (might be expired)
   - Background cron job refreshes it (if migration 019 is run)
   - Next query gets fresh token
5. **If valid:**
   - Returns token immediately

### Background Refresh (Optional)

The cron job (migration 019) runs every 10 minutes and:
- Finds expired tokens
- Calls Edge Function to refresh them
- Updates database with new tokens

This ensures tokens are fresh before n8n queries them.

## Benefits

✅ **No HTTP endpoints needed** - n8n queries Supabase directly  
✅ **Automatic refresh** - Tokens refresh in background  
✅ **Simple queries** - Just query the view  
✅ **Reliable** - Works even if Edge Function is temporarily unavailable  
✅ **Fast** - Direct database queries are faster than HTTP calls  

## Fallback Behavior

If the background refresh isn't set up or fails:
- Functions still return tokens (might be expired)
- The existing app endpoints (`/api/n8n/video-details`) can still refresh tokens
- n8n can check `refresh_token_expired` flag and handle accordingly

## Troubleshooting

### Tokens Always Expired

1. Check that Edge Function is deployed
2. Verify environment variables are set
3. Check Supabase logs for Edge Function errors
4. Verify background cron job is running (if migration 019 is used)

### Function Returns NULL

1. Verify tokens exist in `airpublisher_*_tokens` tables
2. Check `creator_unique_identifier` matches
3. Verify RLS policies allow access

### Background Job Not Running

1. Check if `pg_cron` extension is enabled
2. Verify cron job is scheduled: `SELECT * FROM cron.job;`
3. Check cron logs: `SELECT * FROM cron.job_run_details;`

## Migration from HTTP Endpoints

If you're currently using HTTP endpoints:

1. **Keep existing endpoints** for backward compatibility
2. **Update new workflows** to use Supabase queries
3. **Gradually migrate** existing workflows
4. **Test thoroughly** before removing HTTP endpoints

## Next Steps

1. Deploy Edge Function
2. Run migrations
3. Test with a simple n8n workflow
4. Set up background refresh (optional)
5. Update existing workflows to use Supabase queries

