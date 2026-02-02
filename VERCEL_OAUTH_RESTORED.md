# Vercel OAuth Routes Restored ✅

## What Was Fixed

### Restored OAuth Routes to Working State (Commit 953e6e2)
- ✅ `/api/auth/youtube` - Restored to original implementation (no Edge Functions)
- ✅ `/api/auth/youtube/callback` - Restored to original implementation
- ✅ `/api/auth/instagram` - Restored to original implementation (no Edge Functions)
- ✅ `/api/auth/instagram/callback` - Restored to original implementation
- ✅ `lib/utils/app-url.ts` - Recreated the `getAppUrl()` utility function

## Changes Made

1. **Removed Edge Function Dependencies**: All OAuth routes now work directly without Supabase Edge Functions
2. **Restored `getAppUrl()` Utility**: Recreated the utility that properly detects Vercel, ngrok, or localhost URLs
3. **Restored Original OAuth Flow**: Both YouTube and Instagram OAuth now use the original implementation that was working in commit 953e6e2

## How It Works Now

### YouTube OAuth
- Uses `YOUTUBE_CLIENT_ID` environment variable
- Redirects to Google OAuth with proper scopes
- Callback handles token exchange and storage

### Instagram OAuth
- Uses `INSTAGRAM_APP_ID` or `META_APP_ID` environment variable
- Redirects to Instagram OAuth endpoint (`https://api.instagram.com/oauth/authorize`)
- Callback handles token exchange and storage

## Environment Variables Required

For **Vercel** deployment, make sure these are set:
- `YOUTUBE_CLIENT_ID` - YouTube OAuth Client ID
- `YOUTUBE_CLIENT_SECRET` - YouTube OAuth Client Secret
- `INSTAGRAM_APP_ID` or `META_APP_ID` - Instagram App ID
- `INSTAGRAM_APP_SECRET` or `META_APP_SECRET` - Instagram App Secret
- `NEXT_PUBLIC_APP_URL` (optional) - Your Vercel app URL (e.g., `https://your-app.vercel.app`)

## Testing

1. **YouTube Connection**:
   - Go to `/settings/connections`
   - Click "Connect YouTube"
   - Should redirect to Google OAuth

2. **Instagram Connection**:
   - Go to `/settings/connections`
   - Click "Connect Instagram"
   - Should redirect to Instagram OAuth

## Notes

- The Edge Functions (`alyan_youtubeauth`, `alyan_instagramauth`) are still available for the server deployment at `aircreator.cloud:3003`
- The Vercel app now uses the original OAuth implementation without Edge Functions
- All routes have been tested and should work as they did in commit 953e6e2

