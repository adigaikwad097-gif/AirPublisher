# How to Refresh Tokens

Tokens are **automatically refreshed** when you call `/api/n8n/video-details`, but if you need to manually refresh them, here's how:

## Automatic Refresh (Recommended)

Tokens are automatically refreshed when you fetch video details:

```
GET /api/n8n/video-details?video_id={{ $json.video_id }}

Headers:
- x-n8n-api-key: {{ $env.N8N_API_KEY }}

Response includes fresh tokens (automatically refreshed if needed)
```

## Manual Refresh via HTTP

If you need to refresh tokens without fetching video details:

### YouTube Token Refresh

**POST** `/api/n8n/refresh-token`

**Body:**
```json
{
  "platform": "youtube",
  "creator_unique_identifier": "creator-id"
}
```

**Response:**
```json
{
  "success": true,
  "access_token": "new_refreshed_token",
  "expires_at": "2024-01-15T14:30:00Z",
  "requires_reconnection": false
}
```

### Instagram Token Refresh

**POST** `/api/n8n/refresh-token`

**Body:**
```json
{
  "platform": "instagram",
  "creator_unique_identifier": "creator-id"
}
```

### TikTok Token Refresh

TikTok tokens typically don't expire, but you can check:

**POST** `/api/n8n/refresh-token`

**Body:**
```json
{
  "platform": "tiktok",
  "creator_unique_identifier": "creator-id"
}
```

## How Token Refresh Works

### YouTube
1. Checks if `expires_at` is in the past or within 5 minutes
2. If expired, uses `google_refresh_token` to get new access token
3. Updates `airpublisher_youtube_tokens` table with:
   - New `google_access_token`
   - New `expires_at` (1 hour from now)
   - Updated `updated_at`

### Instagram
1. Checks if `expires_at` is in the past or within 7 days
2. If expired, uses Facebook Graph API to refresh long-lived token
3. Updates `airpublisher_instagram_tokens` table with:
   - New `facebook_access_token`
   - New `instagram_access_token`
   - New `expires_at` (60 days from now)
   - Updated `updated_at`

### TikTok
- Tokens typically don't expire
- Returns existing token if valid
- If invalid, requires reconnection

## Troubleshooting

### Tokens Not Refreshing

1. **Check if refresh token exists:**
   ```sql
   SELECT google_refresh_token, expires_at 
   FROM airpublisher_youtube_tokens 
   WHERE creator_unique_identifier = 'your-creator-id';
   ```

2. **Check expiration:**
   ```sql
   SELECT expires_at, 
          expires_at < NOW() as is_expired,
          expires_at < NOW() + INTERVAL '5 minutes' as expiring_soon
   FROM airpublisher_youtube_tokens 
   WHERE creator_unique_identifier = 'your-creator-id';
   ```

3. **Check logs:**
   - Look for `[getValidYouTubeAccessToken]` or `[getValidInstagramAccessToken]` in server logs
   - Should see "Access token expired, refreshing..." if refresh is triggered

4. **Manual refresh test:**
   ```bash
   curl -X POST https://airpublisher.vercel.app/api/n8n/refresh-token \
     -H "Content-Type: application/json" \
     -d '{
       "platform": "youtube",
       "creator_unique_identifier": "your-creator-id"
     }'
   ```

### Common Issues

**Issue:** "Failed to refresh token"
- **Cause:** Refresh token is invalid or expired
- **Solution:** User needs to reconnect their account

**Issue:** "Missing refresh token"
- **Cause:** Token wasn't stored properly during OAuth
- **Solution:** User needs to reconnect their account

**Issue:** Tokens not updating in database
- **Cause:** Service role key not configured or RLS blocking
- **Solution:** Check `SUPABASE_SERVICE_ROLE_KEY` environment variable

## n8n Workflow Example

```
[HTTP Request: Refresh Token]
  Method: POST
  URL: https://airpublisher.vercel.app/api/n8n/refresh-token
  Headers:
    Content-Type: application/json
  Body:
    {
      "platform": "{{ $json.platform }}",
      "creator_unique_identifier": "{{ $json.creator_unique_identifier }}"
    }
  ↓
[IF requires_reconnection = true]
  → [Send Alert] → [Stop Workflow]
  ↓
[Continue with fresh token]
```

## Notes

- ✅ **No API key required** for `/api/n8n/refresh-token`
- ✅ Tokens are automatically saved to database after refresh
- ✅ Refresh happens transparently when calling `/api/n8n/video-details`
- ✅ Works for YouTube, Instagram, and TikTok
- ✅ Handles token expiration gracefully


