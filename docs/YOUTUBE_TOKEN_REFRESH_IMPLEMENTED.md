# YouTube Token Refresh - Implemented ✅

Automatic token refresh for YouTube access tokens has been implemented.

## What Was Added

### 1. Token Refresh Utility (`lib/youtube/tokens.ts`)

Created a utility module with two main functions:

- **`refreshYouTubeToken()`**: Refreshes an expired access token using the refresh token
- **`getValidYouTubeAccessToken()`**: Gets a valid access token, automatically refreshing if expired (or about to expire in 5 minutes)
- **`getYouTubeAccessTokenForCreator()`**: Helper to get tokens for a creator and return a valid access token

### 2. Updated Endpoints

Both n8n endpoints now automatically refresh YouTube tokens before returning them:

- **`/api/n8n/video-details`**: Refreshes tokens when fetching video details for n8n
- **`/api/webhooks/n8n/post-video`**: Refreshes tokens when n8n requests to post a video

## How It Works

### Before (Problem):
```
Access Token expires (1 hour)
    ↓
n8n tries to use expired token
    ↓
API call fails ❌
```

### After (Fixed):
```
Access Token expires (1 hour)
    ↓
Before API call, check if expired
    ↓
If expired → Use refresh token → Get new access token → Update database
    ↓
Use new access token for API call ✅
```

## Token Refresh Logic

The `getValidYouTubeAccessToken()` function:

1. **Checks expiration**: If `expires_at` is in the past or within 5 minutes
2. **Refreshes if needed**: Uses `google_refresh_token` to get a new access token
3. **Updates database**: Stores the new access token and expiration time
4. **Returns token**: Returns the valid access token

## Benefits

✅ **Automatic**: No manual intervention needed
✅ **Transparent**: Works automatically when tokens are fetched
✅ **Reliable**: Tokens are always fresh before API calls
✅ **Efficient**: Only refreshes when needed (expired or about to expire)

## When Tokens Refresh

Tokens are automatically refreshed when:
- They're expired (`expires_at` is in the past)
- They're about to expire (within 5 minutes)
- Before YouTube API calls are made

## Refresh Token Lifespan

- **Testing mode**: Refresh tokens expire in 7 days
- **Production mode**: Refresh tokens never expire (until revoked)

To check your app mode:
- Google Cloud Console → APIs & Services → OAuth consent screen
- Check "Publishing status"

## Database Updates

When a token is refreshed, the database is updated with:
- New `google_access_token`
- New `expires_at` (1 hour from refresh time)
- Updated `updated_at` timestamp

## What This Means

**Before**: Access tokens expired after 1 hour and needed manual reconnection

**After**: 
- Access tokens still expire after 1 hour (this is normal)
- But they're automatically refreshed using the refresh token
- No manual intervention needed
- Tokens continue working for as long as the refresh token is valid (7 days in testing, or forever in production)

## Testing

To verify it's working:

1. **Wait for access token to expire** (1 hour after connection)
2. **Make a YouTube API call** (e.g., via n8n posting a video)
3. **Check terminal logs** - You should see:
   ```
   [getValidYouTubeAccessToken] Access token expired, refreshing...
   [getValidYouTubeAccessToken] ✅ Successfully refreshed and updated token
   ```
4. **Verify in database**: Check `expires_at` is updated to ~1 hour from now

## Notes

- The refresh token (`google_refresh_token`) is never changed during refresh
- Only the access token (`google_access_token`) is updated
- The refresh happens automatically - no code changes needed in n8n workflows
- Works with both `airpublisher_youtube_tokens` and `youtube_tokens` tables (backward compatible)






