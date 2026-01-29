# Fix Redirect URI Mismatch for TikTok and Instagram OAuth

## The Problem

**Both TikTok and Instagram require the redirect URI to match EXACTLY between:**
1. The initial OAuth authorization request
2. The token exchange request

If they don't match, you get:
- TikTok: `"Redirect_uri is not matched with the uri when requesting code."`
- Instagram: `"Invalid Request: Request parameters are invalid: Invalid redirect_uri"`

## Root Cause

The redirect URI is being constructed using `getAppUrl()`, which:
- Uses `VERCEL_URL` if available (auto-set by Vercel)
- Falls back to `NEXT_PUBLIC_APP_URL` if set
- Falls back to `localhost:3000` if neither is set

**If `NEXT_PUBLIC_APP_URL` is missing**, the URL might be constructed differently between:
- The initial OAuth request (route.ts)
- The callback/token exchange (callback/route.ts)

This causes a mismatch and OAuth fails.

## Solution

### Step 1: Add `NEXT_PUBLIC_APP_URL` to Vercel

1. Go to **Vercel Dashboard** → Your Project → **Settings** → **Environment Variables**
2. Click **Add New**
3. Set:
   - **Name**: `NEXT_PUBLIC_APP_URL`
   - **Value**: `https://airpublisher-tjha.vercel.app`
   - **Environment**: All Environments (Production, Preview, Development)
4. Click **Save**

### Step 2: Verify Redirect URIs in OAuth Apps

#### TikTok Developer Portal

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
5. **Remove any other redirect URIs** (localhost, ngrok, etc.)
6. Click **Save**

#### Instagram (Meta for Developers)

1. Go to [Meta for Developers](https://developers.facebook.com/apps/)
2. Your app (App ID: `836687999185692`) → **Instagram** → **API setup with Instagram login** → **Business login settings**
3. Under **"Valid OAuth Redirect URIs"**, verify it's exactly:
   ```
   https://airpublisher-tjha.vercel.app/api/auth/instagram/callback
   ```
4. **Remove any other redirect URIs** (localhost, ngrok, etc.)
5. Click **Save**

### Step 3: Redeploy and Test

1. **Redeploy** your Vercel application
2. **Wait 2-3 minutes** for changes to propagate
3. **Test OAuth flows:**
   - Try Instagram OAuth
   - Try TikTok OAuth
4. **Check Vercel function logs** to verify the redirect URI being sent

## How the Code Works

The code already handles this correctly by:

1. **Storing redirect_uri in state** (route.ts):
   ```typescript
   const redirectUri = `${cleanBaseUrl}/api/auth/tiktok/callback`
   const state = Buffer.from(JSON.stringify({
     redirect_uri: redirectUri, // Stored in state
     // ...
   })).toString('base64url')
   ```

2. **Using the same redirect_uri from state** (callback/route.ts):
   ```typescript
   const stateData = JSON.parse(Buffer.from(state, 'base64url').toString())
   const redirectUri = stateData.redirect_uri || fallback
   // Use exact same redirectUri for token exchange
   ```

**However**, if `getAppUrl()` returns different values between the two requests, the stored `redirect_uri` in state will be wrong.

## Verification

After adding `NEXT_PUBLIC_APP_URL` and redeploying:

1. **Check Vercel logs** when triggering OAuth:
   ```
   [TikTok OAuth] Redirect URI: https://airpublisher-tjha.vercel.app/api/auth/tiktok/callback
   [tiktok-callback] Redirect URI from state: https://airpublisher-tjha.vercel.app/api/auth/tiktok/callback
   [tiktok-callback] Final redirect URI being used: https://airpublisher-tjha.vercel.app/api/auth/tiktok/callback
   ```

2. **Verify they all match exactly**

3. **Compare with what's configured in OAuth apps** - must be identical

## Common Mistakes

❌ **Wrong:** `http://airpublisher-tjha.vercel.app/api/auth/tiktok/callback` (http instead of https)
❌ **Wrong:** `https://airpublisher-tjha.vercel.app/api/auth/tiktok/callback/` (trailing slash)
❌ **Wrong:** `https://airpublisher-tjha.vercel.app/api/auth/tiktok/callback ` (trailing space)
❌ **Wrong:** Different redirect URIs in OAuth app vs. what's being sent

✅ **Correct:** `https://airpublisher-tjha.vercel.app/api/auth/tiktok/callback` (exact match)

## Still Not Working?

If it's still failing after following all steps:

1. **Check Vercel function logs** for the exact redirect URI being sent
2. **Compare with OAuth app settings** - must match character-for-character
3. **Verify `NEXT_PUBLIC_APP_URL` is set** in Vercel environment variables
4. **Wait 2-3 minutes** after saving changes in OAuth apps (they need time to propagate)
5. **Clear browser cache** and try again

The redirect URI must be **identical** in:
- Vercel environment variable (`NEXT_PUBLIC_APP_URL`)
- OAuth app settings (TikTok/Instagram dashboards)
- What's being sent in the OAuth request
- What's being sent in the token exchange


