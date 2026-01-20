# Add Ngrok Redirect URI to Meta Dashboard

## Progress! ✅

You're now getting **"Invalid redirect_uri"** instead of "Invalid platform app", which means:
- ✅ Instagram App ID is working (the hardcoded `836687999185692` is being recognized)
- ❌ Redirect URI isn't whitelisted in Meta Dashboard

## Fix: Add Ngrok Redirect URI

### Step 1: Go to Meta Dashboard

1. Go to https://developers.facebook.com/apps/
2. Select your app
3. Navigate to: **Products** → **Instagram** → **API setup with Instagram login**
4. Click: **"3. Set up Instagram business login"**
5. Click: **"Business login settings"**

### Step 2: Add Redirect URI

1. Scroll to **"Valid OAuth Redirect URIs"**
2. Click **"Add URI"**
3. Paste this **exact** URL:
   ```
   https://untasting-overhugely-kortney.ngrok-free.dev/api/auth/instagram/callback
   ```
4. Click **"Save Changes"**
5. Wait 2-5 minutes for Meta to update

### Step 3: Verify Both URIs Are Added

You should have **both** of these in the list:

- `http://localhost:3000/api/auth/instagram/callback` (for localhost)
- `https://untasting-overhugely-kortney.ngrok-free.dev/api/auth/instagram/callback` (for ngrok) ← **Add this one**

### Step 4: Important - Exact Match Required

The redirect URI must match **exactly**:
- ✅ `https://untasting-overhugely-kortney.ngrok-free.dev/api/auth/instagram/callback`
- ❌ `https://untasting-overhugely-kortney.ngrok-free.dev/api/auth/instagram/callback/` (trailing slash)
- ❌ `http://untasting-overhugely-kortney.ngrok-free.dev/api/auth/instagram/callback` (http instead of https)
- ❌ `https://untasting-overhugely-kortney.ngrok-free.dev/api/auth/instagram/callback ` (trailing space)

### Step 5: Try Again

After adding the redirect URI and waiting 2-5 minutes:
1. Try connecting Instagram again on your ngrok URL
2. It should work now! ✅

## If Ngrok URL Changes

If you restart ngrok and get a new URL:
1. Update `.env.local`:
   ```bash
   NEXT_PUBLIC_APP_URL=https://new-ngrok-url.ngrok-free.dev
   ```
2. Add the new redirect URI to Meta Dashboard
3. Restart dev server

## What Changed

- **Before**: "Invalid platform app" (App ID not recognized)
- **Now**: "Invalid redirect_uri" (App ID works, but redirect URI not whitelisted)
- **After adding redirect URI**: Should work! 🎉


