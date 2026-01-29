# Debug Instagram Redirect URI Still Failing (TikTok Works)

Since **TikTok OAuth worked** but Instagram is still failing, this means:
- ✅ `NEXT_PUBLIC_APP_URL` is set correctly
- ✅ URL detection is working
- ✅ The code is constructing redirect URIs correctly
- ❌ Instagram OAuth app settings don't match what's being sent

## Step 1: Check Vercel Function Logs

1. **Go to Vercel Dashboard** → Your Project → **Functions** tab
2. **Trigger Instagram OAuth** (click "Connect Instagram" in your app)
3. **Look for logs** with `[Instagram OAuth] Redirect URI:`
4. **Copy the EXACT redirect URI** from the logs

Example log output:
```
[Instagram OAuth] Redirect URI: https://airpublisher.vercel.app/api/auth/instagram/callback
```

## Step 2: Compare with Instagram OAuth App Settings

1. Go to [Meta for Developers](https://developers.facebook.com/apps/)
2. Select your app (App ID: `836687999185692` or `771396602627794`)
3. Go to **Instagram** → **API setup with Instagram login** → **Business login settings**
4. Under **"OAuth redirect URIs"**, check what's configured

## Step 3: Common Issues

### Issue 1: Multiple Redirect URIs (One is Wrong)

**Problem:** You have multiple redirect URIs configured, and one doesn't match.

**Solution:**
1. **Remove ALL redirect URIs** from Instagram OAuth settings
2. **Add ONLY this one:** `https://airpublisher.vercel.app/api/auth/instagram/callback`
3. **Remove these if present:**
   - `https://airpublisher-tjha.vercel.app/api/auth/instagram/callback` (old deployment URL)
   - `https://pezvnqhexxttlhcnbtta.supabase.co/functions/v1/instagram-auth` (Supabase function)
   - `http://localhost:3000/api/auth/instagram/callback` (local development)
   - Any other variations

### Issue 2: Wrong App ID Being Used

**Problem:** The code might be using a different App ID than what's configured in the OAuth app.

**Check:**
1. Look at Vercel logs for: `[Instagram OAuth] App ID being used:`
2. Compare with the App ID in Meta Dashboard
3. Make sure they match exactly

**Solution:**
- If using `INSTAGRAM_APP_ID=836687999185692`, make sure that's the App ID in Meta Dashboard
- If using `META_APP_ID=771396602627794`, make sure that's the App ID in Meta Dashboard
- The redirect URI must be configured in the **same app** that matches the App ID being used

### Issue 3: Redirect URI Has Extra Characters

**Problem:** The redirect URI might have:
- Trailing slash: `https://airpublisher.vercel.app/api/auth/instagram/callback/`
- Trailing space: `https://airpublisher.vercel.app/api/auth/instagram/callback `
- Wrong protocol: `http://` instead of `https://`
- Extra characters or encoding issues

**Solution:**
- Copy the **exact** redirect URI from Vercel logs
- Paste it **exactly** into Instagram OAuth settings
- No trailing slash, no spaces, must be `https://`

### Issue 4: Using Wrong Instagram App

**Problem:** You might have multiple Instagram apps, and the redirect URI is configured in a different app.

**Solution:**
1. Check which App ID is being used in Vercel logs
2. Make sure you're editing the **correct app** in Meta Dashboard
3. The App ID in Vercel must match the App ID in Meta Dashboard

## Step 4: Verify Exact Match

The redirect URI must be **character-for-character identical**:

✅ **Correct:**
```
https://airpublisher.vercel.app/api/auth/instagram/callback
```

❌ **Wrong (trailing slash):**
```
https://airpublisher.vercel.app/api/auth/instagram/callback/
```

❌ **Wrong (http instead of https):**
```
http://airpublisher.vercel.app/api/auth/instagram/callback
```

❌ **Wrong (old deployment URL):**
```
https://airpublisher-tjha.vercel.app/api/auth/instagram/callback
```

❌ **Wrong (Supabase function):**
```
https://pezvnqhexxttlhcnbtta.supabase.co/functions/v1/instagram-auth
```

## Step 5: Quick Fix Checklist

1. **Check Vercel logs** for exact redirect URI being sent
2. **Go to Meta Dashboard** → Instagram → Business login settings
3. **Remove ALL existing redirect URIs**
4. **Add ONLY the one from Vercel logs** (exact copy-paste)
5. **Click Save**
6. **Wait 2-3 minutes** for changes to propagate
7. **Clear browser cache**
8. **Try OAuth again**

## Step 6: Still Not Working?

If it's still failing after following all steps:

1. **Share the exact redirect URI from Vercel logs**
2. **Share what's configured in Instagram OAuth app** (screenshot if possible)
3. **Share the App ID being used** (from Vercel logs)
4. **Check if there are multiple Instagram apps** in your Meta Dashboard

## Why TikTok Works But Instagram Doesn't

Since TikTok works, we know:
- ✅ Environment variables are correct
- ✅ URL detection is working
- ✅ Code is correct

The issue is **specifically with Instagram OAuth app configuration**:
- Redirect URI doesn't match exactly
- Wrong App ID being used
- Multiple redirect URIs causing confusion
- Changes haven't propagated yet

## Most Likely Fix

Based on your earlier screenshot showing multiple redirect URIs in Instagram settings:

1. **Remove these redirect URIs:**
   - `https://pezvnqhexxttlhcnbtta.supabase.co/functions/v1/instagram-auth`
   - `https://airpublisher-tjha.vercel.app/api/auth/instagram/callback`

2. **Keep/Add only:**
   - `https://airpublisher.vercel.app/api/auth/instagram/callback`

3. **Save and wait 2-3 minutes**

This should fix it!


