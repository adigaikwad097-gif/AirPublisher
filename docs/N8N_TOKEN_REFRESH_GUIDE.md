# n8n Token Refresh - No HTTP Request Needed! ✅

**Good news:** You **don't need to make HTTP requests** to refresh tokens in n8n! Token refresh happens **automatically** when you fetch video details.

## How It Works (Automatic - No Extra Steps)

The `/api/n8n/video-details` endpoint **automatically refreshes tokens** when you fetch video details. You don't need to do anything extra - just call the endpoint and it will:

1. Check if the token is expired (or expiring within 5 minutes)
2. Automatically refresh it using the refresh token
3. Update the database with the new token
4. Return the fresh access token

**Example:**
```
GET /api/n8n/video-details?video_id={{ $json.video_id }}

Headers:
- x-n8n-api-key: {{ $env.N8N_API_KEY }}

Response:
{
  "success": true,
  "video": { ... },
  "platform_tokens": {
    "access_token": "fresh_token_here",  // ✅ Already refreshed automatically!
    "refresh_token": "...",
    ...
  }
}
```

**Why this is better:**
- ✅ **No separate HTTP request needed** - refresh happens automatically
- ✅ **No extra n8n nodes** - just use the video-details endpoint
- ✅ **Transparent** - you always get fresh tokens
- ✅ **Works seamlessly** with existing workflows

## Your Workflow (Simplified)

```
[Get Scheduled Posts]
  ↓
[Get Video Details & Tokens]  ← Tokens auto-refreshed here (no extra step!)
  ↓
[Post to Platform]  ← Uses fresh token
```

**That's it!** No token refresh HTTP request needed.

---

## Optional: Manual Token Refresh (Only if needed)

If you ever need to refresh a token **without** fetching video details (rare), you can use:

**POST** `/api/n8n/refresh-token`

**Headers:**
- `x-n8n-api-key: {{ $env.N8N_API_KEY }}`
- `Content-Type: application/json`

**Body:**
```json
{
  "platform": "youtube",
  "creator_unique_identifier": "creator-id"
}
```

**Response (Success):**
```json
{
  "success": true,
  "access_token": "new_refreshed_token",
  "expires_at": "2024-01-15T14:30:00Z",
  "requires_reconnection": false,
  "platform": "youtube"
}
```

**Response (Needs Reconnection):**
```json
{
  "error": "YouTube token expired and could not be refreshed. Please reconnect your YouTube account.",
  "requires_reconnection": true
}
```

## How Token Refresh Works

### YouTube
- Uses Google OAuth 2.0 refresh token flow
- Makes HTTP POST request to `https://oauth2.googleapis.com/token`
- Automatically updates the database with new token and expiration

### Instagram
- Uses Facebook Graph API token refresh
- Automatically handles long-lived token refresh
- Updates database with new token

### TikTok
- Tokens typically don't expire (unless revoked)
- Returns existing token if valid
- If invalid, requires reconnection

## When Do You Need Token Refresh?

**Answer: You don't!** Token refresh happens automatically when you call `/api/n8n/video-details`. 

**You only need the dedicated refresh endpoint if:**
- You're building a custom workflow that doesn't fetch video details
- You're doing token health checks (rare)
- You're testing token refresh functionality

**For 99% of use cases:** Just use `/api/n8n/video-details` and tokens will be automatically refreshed.

## Example n8n Workflow Usage

### Standard Workflow (Recommended - No Token Refresh Step Needed):

```
[Get Scheduled Posts]
  ↓
[Get Video Details & Tokens]  ← Tokens auto-refreshed here automatically!
  ↓
[Post to Platform]  ← Uses fresh token (already refreshed)
```

**No token refresh HTTP request needed!** The `/api/n8n/video-details` endpoint handles it automatically.

### Manual Token Refresh (Only if you need tokens without video details):

```
[HTTP Request: Refresh Token]  ← Only use this if you don't need video details
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

**Note:** 
- ✅ **No API key required** - just send the request body
- This is rarely needed. Just use `/api/n8n/video-details` instead!

## Error Handling

Both endpoints return `requires_reconnection: true` if:
- Refresh token is invalid/expired
- User revoked access
- OAuth app credentials changed

**In n8n, handle this:**
```javascript
// In Code node after refresh
if ($json.requires_reconnection) {
  // Mark scheduled post as failed
  // Send notification to user
  // Stop workflow
}
```

## Key Points

- ✅ **No HTTP request needed for token refresh** - it happens automatically!
- ✅ **No extra n8n nodes needed** - just use `/api/n8n/video-details`
- ✅ Tokens are automatically saved to database after refresh
- ✅ Refresh happens transparently - you just get fresh tokens
- ✅ Works for YouTube, Instagram, and TikTok
- ✅ Handles token expiration gracefully

## Summary

**For n8n workflows:**
1. Call `/api/n8n/video-details` to get video details and tokens
2. Tokens are automatically refreshed if needed (no extra step!)
3. Use the tokens to post to platforms
4. **That's it!** No token refresh HTTP request needed.

## Testing

Test token refresh (no API key needed):
```bash
curl -X POST https://airpublisher.vercel.app/api/n8n/refresh-token \
  -H "Content-Type: application/json" \
  -d '{
    "platform": "youtube",
    "creator_unique_identifier": "creator-id"
  }'
```

