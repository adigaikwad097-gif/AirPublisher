# Edge Function Environment Variables Setup

## Quick Fix for Current Errors

### YouTube Error: "YouTube OAuth not configured"
**Solution**: Set environment variables in Supabase Edge Function secrets

### Instagram Error: "Invalid redirect_uri"
**Solution**: Register the correct redirect URI in Instagram OAuth settings

## Steps to Fix

### 1. Set Environment Variables in Supabase

Go to Supabase Dashboard > Edge Functions > Secrets and add:

**For YouTube (`alyan_youtubeauth`):**
- `GOOGLE_CLIENT_ID_ALYAN` (or `GOOGLE_OAUTH_CLIENT_ID` or `GOOGLE_CLIENT_ID`)
- `GOOGLE_CLIENT_SECRET_ALYAN` (or `GOOGLE_OAUTH_CLIENT_SECRET` or `GOOGLE_CLIENT_SECRET`)

**For Instagram (`alyan_instagramauth`):**
- `INSTAGRAM_APP_ID_ALYAN` (or `INSTAGRAM_CLIENT_ID` or `INSTAGRAM_APP_ID`)
- `INSTAGRAM_APP_SECRET_ALYAN` (or `INSTAGRAM_CLIENT_SECRET` or `INSTAGRAM_APP_SECRET`)

**Required for both:**
- `SUPABASE_URL` (auto-available, but verify)
- `SUPABASE_SERVICE_ROLE_KEY` (auto-available, but verify)
- `FRONTEND_URL` (optional, defaults to `http://aircreator.cloud:3003`)

### 2. Register Redirect URIs in OAuth Providers

**Google Cloud Console:**
- Go to APIs & Services > Credentials
- Edit your OAuth 2.0 Client ID
- Add to "Authorized redirect URIs":
  ```
  https://pezvnqhexxttlhcnbtta.supabase.co/functions/v1/alyan_youtubeauth
  ```

**Instagram App Settings:**
- Go to Meta for Developers > Your App > Instagram > Basic Display (or Instagram Login)
- Add to "Valid OAuth Redirect URIs":
  ```
  https://pezvnqhexxttlhcnbtta.supabase.co/functions/v1/alyan_instagramauth
  ```
- **IMPORTANT**: The redirect URI must match EXACTLY, including:
  - Protocol (https)
  - Domain (pezvnqhexxttlhcnbtta.supabase.co)
  - Path (/functions/v1/alyan_instagramauth)
  - No trailing slash

### 3. Redeploy Edge Functions

After setting environment variables, redeploy:
```bash
supabase functions deploy alyan_youtubeauth
supabase functions deploy alyan_instagramauth
```

Or use Supabase Dashboard > Edge Functions > Deploy

## Verify Setup

Test the Edge Functions:
```bash
# Test YouTube
curl "https://pezvnqhexxttlhcnbtta.supabase.co/functions/v1/alyan_youtubeauth?action=init&origin=http://aircreator.cloud:3003"

# Test Instagram
curl "https://pezvnqhexxttlhcnbtta.supabase.co/functions/v1/alyan_instagramauth?action=init&origin=http://aircreator.cloud:3003"
```

Both should redirect to their respective OAuth providers, not return errors.

