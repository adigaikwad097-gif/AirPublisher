# Fix OAuth Issues - Complete Guide

## Issues to Fix

1. **Instagram**: "Invalid redirect_uri" error
2. **TikTok**: "redirect_uri" error  
3. **YouTube**: Tokens expiring every hour (need to use refresh tokens)

## Solution 1: Set NEXT_PUBLIC_APP_URL in Vercel

The redirect URI detection might not be working properly. Let's manually set it:

1. Go to **Vercel Dashboard** → Your Project → **Settings** → **Environment Variables**
2. Add/Update:
   ```
   NEXT_PUBLIC_APP_URL=https://airpublisher-tjha.vercel.app
   ```
3. Make sure it's set for **Production**, **Preview**, and **Development** environments
4. **Redeploy** your application (or wait for next deployment)

This ensures the redirect URIs are always correct.

## Solution 2: Verify Redirect URIs in OAuth Apps

### Instagram (Meta for Developers)

1. Go to [Meta for Developers](https://developers.facebook.com/apps/)
2. Your app → **Instagram** → **API setup with Instagram login** → **Business login settings**
3. Under **"Valid OAuth Redirect URIs"**, verify it's exactly:
   ```
   https://airpublisher-tjha.vercel.app/api/auth/instagram/callback
   ```
4. **Remove any other redirect URIs** that might be conflicting (like localhost or ngrok URLs)
5. Click **Save**

### TikTok (TikTok Developers)

1. Go to [TikTok Developers Portal](https://developers.tiktok.com/)
2. Your app → **Basic Information** → **Platform information**
3. Under **"Redirect domain"**, verify:
   ```
   airpublisher-tjha.vercel.app
   ```
4. Under **"Redirect URI"**, verify it's exactly:
   ```
   https://airpublisher-tjha.vercel.app/api/auth/tiktok/callback
   ```
5. **Remove any other redirect URIs** that might be conflicting
6. Click **Save**

## Solution 3: YouTube Refresh Token

The code already handles refresh tokens, but let's verify:

### Check if Refresh Token is Saved

1. Go to your **Supabase Dashboard**
2. Navigate to **Table Editor**
3. Check table: `airpublisher_youtube_tokens` (or `youtube_tokens`)
4. Find your token record
5. Verify `google_refresh_token` column has a value (not null)

### If Refresh Token is Missing

This happens when:
- User already authorized the app before (Google doesn't return refresh_token again)
- OAuth request didn't include `prompt=consent`

**Solution:**
1. **Disconnect YouTube** in your app (Settings → Connections)
2. **Revoke access** in [Google Account Settings](https://myaccount.google.com/permissions)
3. **Reconnect YouTube** - this will force a new authorization and get a refresh token

### Verify Refresh Token is Working

The code automatically refreshes tokens when they expire. To verify:

1. Check Vercel function logs when YouTube API is called
2. Look for: `[getValidYouTubeAccessToken] Access token expired, refreshing...`
3. Should see: `[getValidYouTubeAccessToken] ✅ Successfully refreshed and updated token`

## Testing After Fixes

### 1. Test Instagram OAuth

1. Go to your Vercel site: https://airpublisher-tjha.vercel.app/
2. Navigate to **Settings** → **Connections**
3. Click **Connect Instagram**
4. Should redirect to Instagram authorization (not show error)
5. After authorizing, should redirect back successfully

### 2. Test TikTok OAuth

1. Go to **Settings** → **Connections**
2. Click **Connect TikTok**
3. Should redirect to TikTok authorization (not show error)
4. After authorizing, should redirect back successfully

### 3. Test YouTube Token Refresh

1. Wait for YouTube token to expire (or manually expire it in database)
2. Trigger any YouTube API call (e.g., posting a video)
3. Check Vercel logs - should see token refresh happening automatically
4. Should not get "token expired" errors

## Debugging

### Check What Redirect URI is Being Sent

After setting `NEXT_PUBLIC_APP_URL`, check Vercel logs:

1. **Vercel Dashboard** → Your Project → **Functions**
2. Trigger OAuth flow
3. Look for logs:
   - `[Instagram OAuth] Redirect URI: ...`
   - `[TikTok OAuth] Redirect URI: ...`
4. Verify it matches exactly what's configured in OAuth apps

### Check YouTube Token Status

1. **Supabase Dashboard** → Table Editor → `airpublisher_youtube_tokens`
2. Check:
   - `google_access_token` - should have a value
   - `google_refresh_token` - **MUST have a value** (critical!)
   - `expires_at` - should be a future date

### Common Issues

#### Issue: "Invalid redirect_uri" still appears

**Possible causes:**
- `NEXT_PUBLIC_APP_URL` not set in Vercel
- Redirect URI in OAuth app doesn't match exactly
- Changes haven't propagated (wait 5-10 minutes)

**Solution:**
1. Set `NEXT_PUBLIC_APP_URL` in Vercel
2. Verify redirect URI in OAuth app matches exactly
3. Wait 5-10 minutes
4. Clear browser cache
5. Try again

#### Issue: YouTube tokens still expiring

**Possible causes:**
- No refresh token saved (check database)
- Refresh token is invalid/revoked
- Token refresh logic not being called

**Solution:**
1. Check database for `google_refresh_token`
2. If missing, disconnect and reconnect YouTube
3. Check Vercel logs for refresh attempts
4. Verify `YOUTUBE_CLIENT_ID` and `YOUTUBE_CLIENT_SECRET` are set in Vercel

## Quick Checklist

- [ ] Set `NEXT_PUBLIC_APP_URL=https://airpublisher-tjha.vercel.app` in Vercel
- [ ] Verify Instagram redirect URI in Meta dashboard
- [ ] Verify TikTok redirect URI in TikTok dashboard
- [ ] Remove conflicting redirect URIs (localhost, ngrok)
- [ ] Check YouTube refresh token exists in database
- [ ] Wait 5-10 minutes for changes to propagate
- [ ] Test all three OAuth flows
- [ ] Check Vercel logs for any errors

## Next Steps

1. **Set `NEXT_PUBLIC_APP_URL` in Vercel** (most important!)
2. **Wait for deployment** (1-2 minutes)
3. **Test OAuth flows**
4. **Check logs** if still failing
5. **Share logs** if issues persist


