# Debug Edge Function Redirect Issue

## Problem
- YouTube shows: "YouTube OAuth not configured. Please set YOUTUBE_CLIENT_ID in environment variables."
- Instagram shows: "Invalid Request: Request parameters are invalid: Invalid redirect_uri"
- Edge Functions are not being called

## Expected Flow
1. User clicks "Connect YouTube" → `/api/auth/youtube`
2. API route redirects to: `https://pezvnqhexxttlhcnbtta.supabase.co/functions/v1/alyan_youtubeauth?action=init&origin=...`
3. Edge Function handles OAuth flow

## Debugging Steps

### 1. Check if API routes are being hit
Check server logs when clicking "Connect YouTube":
```bash
docker compose logs app --tail=100 | grep -i youtube
```

### 2. Verify Edge Function URLs
The Edge Functions should be at:
- YouTube: `https://pezvnqhexxttlhcnbtta.supabase.co/functions/v1/alyan_youtubeauth`
- Instagram: `https://pezvnqhexxttlhcnbtta.supabase.co/functions/v1/alyan_instagramauth`

### 3. Test Edge Functions directly
```bash
# Test YouTube Edge Function
curl "https://pezvnqhexxttlhcnbtta.supabase.co/functions/v1/alyan_youtubeauth?action=init&origin=http://aircreator.cloud:3003"

# Test Instagram Edge Function
curl "https://pezvnqhexxttlhcnbtta.supabase.co/functions/v1/alyan_instagramauth?action=init&origin=http://aircreator.cloud:3003"
```

### 4. Check OAuth Redirect URIs
Make sure these are registered in OAuth provider settings:
- **Google Cloud Console**: `https://pezvnqhexxttlhcnbtta.supabase.co/functions/v1/alyan_youtubeauth`
- **Instagram App Settings**: `https://pezvnqhexxttlhcnbtta.supabase.co/functions/v1/alyan_instagramauth`

### 5. Verify Environment Variables
Check that `NEXT_PUBLIC_SUPABASE_URL` is set on the server:
```bash
ssh air_publisher_user@93.127.216.83 "cd /opt/apps/air-publisher && grep NEXT_PUBLIC_SUPABASE_URL .env.local"
```

### 6. Check Browser Network Tab
When clicking "Connect YouTube", check:
- What URL is being requested?
- Is there a redirect happening?
- What's the response?

## Possible Issues

1. **API route not redirecting**: The redirect might be failing silently
2. **Edge Function not deployed**: Functions might not be live
3. **CORS issues**: Edge Function might be blocking the request
4. **Wrong redirect URI**: OAuth providers might not have the Edge Function URL registered

## Solution

The API routes should redirect to Edge Functions. If they're not, check:
1. Is `NEXT_PUBLIC_SUPABASE_URL` set correctly?
2. Are the Edge Functions deployed?
3. Are the redirect URIs registered in OAuth providers?

