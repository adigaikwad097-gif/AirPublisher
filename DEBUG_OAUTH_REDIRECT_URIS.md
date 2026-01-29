# Debug OAuth Redirect URI Issues

## The Problem

You're getting errors:
- **Instagram**: "Invalid redirect_uri"
- **TikTok**: "redirect_uri" error

Even though you've added the redirect URIs to both platforms.

## How to Debug

### Step 1: Check Vercel Function Logs

After the latest deployment, the code now logs exactly what redirect URIs are being sent.

1. Go to **Vercel Dashboard** → Your Project → **Functions**
2. Trigger the OAuth flow (try connecting Instagram or TikTok)
3. Look for logs with these prefixes:
   - `[Instagram OAuth] Redirect URI:`
   - `[TikTok OAuth] Redirect URI:`
   - `[getAppUrl] Using VERCEL_URL:`

### Step 2: Compare with Configured URIs

**Expected redirect URIs:**
- Instagram: `https://airpublisher-tjha.vercel.app/api/auth/instagram/callback`
- TikTok: `https://airpublisher-tjha.vercel.app/api/auth/tiktok/callback`

**What to check in logs:**
- Does the logged redirect URI match exactly?
- Are there any extra characters, spaces, or encoding issues?
- Is it using HTTPS (not HTTP)?
- Is there a trailing slash?

### Step 3: Verify Environment Variables

Check your Vercel environment variables:

1. Go to **Vercel Dashboard** → Your Project → **Settings** → **Environment Variables**
2. Verify:
   - `VERCEL_URL` - Should be automatically set by Vercel (format: `airpublisher-tjha.vercel.app`)
   - `NEXT_PUBLIC_APP_URL` - Optional, but if set, should be: `https://airpublisher-tjha.vercel.app`

### Step 4: Check OAuth App Settings

#### Instagram (Meta for Developers)
1. Go to [Meta for Developers](https://developers.facebook.com/apps/)
2. Your app → **Instagram** → **API setup with Instagram login** → **Business login settings**
3. Under **"Valid OAuth Redirect URIs"**, verify:
   ```
   https://airpublisher-tjha.vercel.app/api/auth/instagram/callback
   ```
   - Must match **exactly** (case-sensitive)
   - No trailing slash
   - Must be HTTPS

#### TikTok (TikTok Developers)
1. Go to [TikTok Developers Portal](https://developers.tiktok.com/)
2. Your app → **Basic Information** → **Platform information**
3. Under **"Redirect domain"**, verify:
   ```
   airpublisher-tjha.vercel.app
   ```
   (Just the domain, no protocol)
4. Under **"Redirect URI"**, verify:
   ```
   https://airpublisher-tjha.vercel.app/api/auth/tiktok/callback
   ```
   - Must match **exactly** (case-sensitive)
   - No trailing slash
   - Must be HTTPS

## Common Issues

### Issue 1: VERCEL_URL Not Set
**Symptom:** Logs show `VERCEL_URL: NOT SET`

**Solution:** 
- Vercel should set this automatically
- If missing, manually set `NEXT_PUBLIC_APP_URL` in Vercel environment variables:
  ```
  NEXT_PUBLIC_APP_URL=https://airpublisher-tjha.vercel.app
  ```

### Issue 2: Trailing Slash Mismatch
**Symptom:** Redirect URI has trailing slash but configured one doesn't (or vice versa)

**Solution:**
- The code now removes trailing slashes automatically
- Make sure configured URIs in OAuth apps have NO trailing slash

### Issue 3: Protocol Mismatch
**Symptom:** Using HTTP instead of HTTPS

**Solution:**
- The code automatically uses HTTPS for Vercel
- Make sure configured URIs in OAuth apps use HTTPS

### Issue 4: Case Sensitivity
**Symptom:** URI matches but still fails

**Solution:**
- Some OAuth providers are case-sensitive
- Make sure the configured URI matches exactly (including case)

### Issue 5: Encoding Issues
**Symptom:** Special characters or spaces in URI

**Solution:**
- The code now trims whitespace
- Make sure there are no spaces or special characters in configured URIs

## What the Logs Will Show

After triggering OAuth, you should see logs like:

```
[getAppUrl] Using VERCEL_URL: { VERCEL_URL: 'airpublisher-tjha.vercel.app', finalUrl: 'https://airpublisher-tjha.vercel.app' }
[Instagram OAuth] Environment check: { VERCEL_URL: 'airpublisher-tjha.vercel.app', NEXT_PUBLIC_APP_URL: 'NOT SET', NODE_ENV: 'production' }
[Instagram OAuth] Base URL: https://airpublisher-tjha.vercel.app
[Instagram OAuth] Clean Base URL: https://airpublisher-tjha.vercel.app
[Instagram OAuth] Redirect URI: https://airpublisher-tjha.vercel.app/api/auth/instagram/callback
[Instagram OAuth] Redirect URI length: 67
```

**Compare the logged redirect URI with what's configured in your OAuth apps.**

## Next Steps

1. **Wait for Vercel to deploy** (1-2 minutes after push)
2. **Check the logs** when you trigger OAuth
3. **Compare** the logged redirect URI with what's configured
4. **Fix any mismatches** in OAuth app settings
5. **Try again**

## Still Not Working?

If the logged redirect URI matches exactly what's configured but still fails:

1. **Remove and re-add** the redirect URI in OAuth app settings
2. **Wait 5-10 minutes** for changes to fully propagate
3. **Clear browser cache** and try in incognito window
4. **Check app status** - make sure your OAuth apps are not in restricted mode
5. **Verify app IDs** match between code and OAuth apps


