# Debug Instagram "Invalid redirect_uri" Error

## Step 1: Check What Redirect URI is Being Sent

The code logs the redirect URI. Check Vercel function logs:

1. **Go to Vercel Dashboard** → Your Project → **Functions** tab
2. **Trigger Instagram OAuth** (click "Connect Instagram" in your app)
3. **Look for logs** with `[Instagram OAuth] Redirect URI:`
4. **Copy the exact redirect URI** from the logs

Example log output:
```
[Instagram OAuth] Redirect URI: https://airpublisher-tjha.vercel.app/api/auth/instagram/callback
```

## Step 2: Verify in Meta for Developers Dashboard

1. Go to [Meta for Developers](https://developers.facebook.com/apps/)
2. Select your app (App ID: `836687999185692`)
3. Go to **Instagram** → **API setup with Instagram login** → **Business login settings**
4. Under **"Valid OAuth Redirect URIs"**, check what's configured

## Step 3: Compare and Fix

The redirect URI in your Instagram app **MUST EXACTLY MATCH** what's being sent, including:
- ✅ Same protocol (`https://` not `http://`)
- ✅ Same domain (`airpublisher-tjha.vercel.app`)
- ✅ Same path (`/api/auth/instagram/callback`)
- ✅ No trailing slash
- ✅ No extra spaces or characters
- ✅ Same case (all lowercase is fine)

### Common Issues:

#### Issue 1: Missing `NEXT_PUBLIC_APP_URL`
**Symptom:** Logs show `VERCEL_URL: airpublisher-tjha.vercel.app` but redirect URI might be wrong

**Fix:**
1. Add `NEXT_PUBLIC_APP_URL=https://airpublisher-tjha.vercel.app` in Vercel
2. Redeploy

#### Issue 2: Redirect URI in Instagram App Doesn't Match
**Symptom:** Logs show correct redirect URI, but Instagram still rejects it

**Fix:**
1. Copy the **exact** redirect URI from Vercel logs
2. Go to Meta Dashboard → Instagram → Business login settings
3. **Remove all existing redirect URIs**
4. **Add only this one:** `https://airpublisher-tjha.vercel.app/api/auth/instagram/callback`
5. Click **Save**
6. Wait 2-3 minutes for changes to propagate
7. Try OAuth again

#### Issue 3: Using Wrong App ID
**Symptom:** Using `META_APP_ID` instead of `INSTAGRAM_APP_ID`

**Fix:**
- The code uses `INSTAGRAM_APP_ID` first, then falls back to `META_APP_ID`
- Make sure you're using the **Instagram App ID** (not Meta App ID)
- Get it from: Instagram → API setup with Instagram login → Business login settings

#### Issue 4: Trailing Slash or Extra Characters
**Symptom:** Redirect URI has trailing slash or extra characters

**Fix:**
- The code removes trailing slashes, but double-check:
- Should be: `https://airpublisher-tjha.vercel.app/api/auth/instagram/callback`
- NOT: `https://airpublisher-tjha.vercel.app/api/auth/instagram/callback/`
- NOT: `https://airpublisher-tjha.vercel.app/api/auth/instagram/callback ` (trailing space)

## Step 4: Check Vercel Function Logs

After triggering Instagram OAuth, check logs for:

```
[Instagram OAuth] Environment check:
  VERCEL_URL: airpublisher-tjha.vercel.app (or NOT SET)
  NEXT_PUBLIC_APP_URL: https://airpublisher-tjha.vercel.app (or NOT SET)
  
[Instagram OAuth] Base URL: https://airpublisher-tjha.vercel.app
[Instagram OAuth] Redirect URI: https://airpublisher-tjha.vercel.app/api/auth/instagram/callback
```

**If `NEXT_PUBLIC_APP_URL` shows "NOT SET":**
- Add it in Vercel environment variables
- Redeploy

**If redirect URI looks wrong:**
- Compare with what's in Instagram OAuth app settings
- They must match exactly

## Step 5: Verify Instagram App Configuration

1. **App ID:** Should be `836687999185692` (from your env vars)
2. **App Type:** Should be "Business" or "Creator" (not Personal)
3. **Valid OAuth Redirect URIs:** Should contain exactly:
   ```
   https://airpublisher-tjha.vercel.app/api/auth/instagram/callback
   ```
4. **No other redirect URIs** (remove localhost, ngrok, etc. if present)

## Quick Checklist

- [ ] Added `NEXT_PUBLIC_APP_URL=https://airpublisher-tjha.vercel.app` in Vercel
- [ ] Redeployed application
- [ ] Checked Vercel function logs for exact redirect URI
- [ ] Verified redirect URI in Instagram OAuth app matches exactly
- [ ] Removed conflicting redirect URIs (localhost, ngrok, etc.)
- [ ] Waited 2-3 minutes after saving changes
- [ ] Tried OAuth flow again

## Still Not Working?

If it's still not working after following all steps:

1. **Share the exact redirect URI from Vercel logs**
2. **Share what's configured in Instagram OAuth app**
3. **Check if there are any other errors in Vercel logs**

The redirect URI must be **character-for-character identical** between what's sent and what's configured.


