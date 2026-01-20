# Fix YouTube OAuth "Invalid Request" Error

The error "You can't sign in because this app sent an invalid request" means the **redirect URI** in your code doesn't match what's configured in Google Cloud Console.

## Quick Fix

1. **Check what redirect URI your app is using:**
   - Look at server terminal logs when you click "Connect YouTube"
   - You should see: `[YouTube OAuth] Full redirect URI: ...`
   - Copy this exact URL

2. **Add it to Google Cloud Console:**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Select your project
   - Go to **APIs & Services** → **Credentials**
   - Click on your **OAuth 2.0 Client ID** (the one with YouTube API enabled)
   - Under **Authorized redirect URIs**, click **+ ADD URI**
   - Paste the exact redirect URI from step 1
   - Click **Save**

## Common Redirect URIs

### Local Development:
```
http://localhost:3000/api/auth/youtube/callback
```

### With ngrok:
```
https://your-ngrok-url.ngrok-free.dev/api/auth/youtube/callback
```

### Production:
```
https://your-production-url.com/api/auth/youtube/callback
```

## Step-by-Step: Google Cloud Console Setup

1. **Go to Google Cloud Console:**
   - https://console.cloud.google.com/

2. **Select your project** (or create one)

3. **Enable YouTube Data API v3:**
   - Go to **APIs & Services** → **Library**
   - Search for "YouTube Data API v3"
   - Click **Enable**

4. **Create OAuth 2.0 Credentials:**
   - Go to **APIs & Services** → **Credentials**
   - Click **+ CREATE CREDENTIALS** → **OAuth client ID**
   - Application type: **Web application**
   - Name: "AIR Publisher YouTube OAuth"
   - **Authorized redirect URIs**: Add all of these:
     ```
     http://localhost:3000/api/auth/youtube/callback
     https://your-ngrok-url.ngrok-free.dev/api/auth/youtube/callback
     https://your-production-url.com/api/auth/youtube/callback
     ```
   - Click **Create**

5. **Copy Credentials:**
   - Copy the **Client ID** and **Client Secret**
   - Add to your `.env.local`:
     ```env
     YOUTUBE_CLIENT_ID=your_client_id_here
     YOUTUBE_CLIENT_SECRET=your_client_secret_here
     ```

6. **Restart your dev server:**
   ```bash
   npm run dev
   ```

## Verify Redirect URI

After adding the redirect URI, check server logs when clicking "Connect YouTube":

```
[YouTube OAuth] Full redirect URI: http://localhost:3000/api/auth/youtube/callback
```

Make sure this **exact** URI is in Google Cloud Console.

## Testing

1. Click "Connect YouTube" in your app
2. You should be redirected to Google sign-in
3. After authorizing, you should be redirected back to your app
4. Check server logs for any errors

## Common Issues

### Issue: "redirect_uri_mismatch"
- **Cause:** Redirect URI not whitelisted in Google Cloud Console
- **Fix:** Add the exact redirect URI to Google Cloud Console

### Issue: "invalid_client"
- **Cause:** Client ID or Secret is incorrect
- **Fix:** Check `.env.local` has correct `YOUTUBE_CLIENT_ID` and `YOUTUBE_CLIENT_SECRET`

### Issue: "access_denied"
- **Cause:** User denied permission
- **Fix:** User needs to click "Allow" on the consent screen

## Debugging

Check server terminal logs for:
- `[YouTube OAuth] OAuth configuration:` - Shows client ID and redirect URI
- `[YouTube Callback] OAuth configuration:` - Shows what was used in callback

The redirect URI must match **exactly** (including `http` vs `https`, trailing slashes, etc.)


