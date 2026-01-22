# Fix Instagram OAuth "Invalid redirect_uri" Error

## The Problem

Instagram is rejecting the OAuth request because the redirect URI isn't registered in your Instagram app settings.

**Your redirect URI should be:**
```
https://airpublisher-tjha.vercel.app/api/auth/instagram/callback
```

## Solution: Add Redirect URI to Instagram App

### Step 1: Go to Meta for Developers

1. Go to [Meta for Developers](https://developers.facebook.com/apps/)
2. Log in with your Meta/Facebook account
3. Find your Instagram app (App ID: `836687999185692`)

### Step 2: Navigate to Instagram Settings

1. Click on your app
2. In the left sidebar, go to **Instagram** → **API setup with Instagram login**
3. Click on **Business login settings** (or **Basic Display** if that's what you see)

### Step 3: Add Valid OAuth Redirect URI

1. Find the section **"Valid OAuth Redirect URIs"** or **"Redirect URIs"**
2. Click **"Add URI"** or **"+"** button
3. Enter **exactly** (copy-paste to avoid typos):
   ```
   https://airpublisher-tjha.vercel.app/api/auth/instagram/callback
   ```
4. Click **Save** or **Add**

### Step 4: Verify the URI

Make sure:
- ✅ Starts with `https://` (not `http://`)
- ✅ No trailing slash at the end
- ✅ Matches exactly: `https://airpublisher-tjha.vercel.app/api/auth/instagram/callback`
- ✅ No extra spaces or characters

### Step 5: Wait for Changes to Propagate

- Changes can take **1-5 minutes** to propagate
- Try the OAuth flow again after waiting

## Alternative: Check Instagram App Type

If you don't see "Business login settings", you might be using a different app type:

### For Instagram Basic Display:
1. Go to **Instagram** → **Basic Display**
2. Find **"Valid OAuth Redirect URIs"**
3. Add the redirect URI there

### For Instagram Graph API:
1. Go to **Instagram** → **Instagram Graph API**
2. Find **"Valid OAuth Redirect URIs"**
3. Add the redirect URI there

## Verify Your App ID

Your code is using App ID: `836687999185692`

Make sure this matches the App ID in your Meta dashboard:
1. Go to your app's **Settings** → **Basic**
2. Check the **App ID** field
3. It should be: `836687999185692`

If it's different, update your `INSTAGRAM_APP_ID` environment variable in Vercel.

## Testing

After adding the redirect URI:

1. Wait 1-5 minutes for changes to propagate
2. Go to your Vercel site: https://airpublisher-tjha.vercel.app/
3. Navigate to **Settings** → **Connections**
4. Click **Connect Instagram**
5. It should redirect to Instagram authorization page (not show the error)

## Troubleshooting

### Still getting "Invalid redirect_uri" error?

1. **Double-check the URI format:**
   - Must be exactly: `https://airpublisher-tjha.vercel.app/api/auth/instagram/callback`
   - No trailing slash
   - No spaces
   - Must be HTTPS

2. **Check if you're using the right app:**
   - Verify App ID matches: `836687999185692`
   - Make sure you're editing the correct Instagram app

3. **Check app status:**
   - Make sure your app is not in "Development Mode" restrictions
   - If in Development Mode, only test users can use it

4. **Clear browser cache:**
   - Sometimes cached OAuth URLs cause issues
   - Try in incognito/private window

5. **Check Vercel environment variables:**
   - Make sure `INSTAGRAM_APP_ID` is set in Vercel
   - Value should be: `836687999185692` (no spaces, no newlines)

### Check What Redirect URI is Being Sent

To debug, check your Vercel function logs:
1. Go to Vercel Dashboard → Your Project → Functions
2. Look for logs from `/api/auth/instagram` route
3. Check the log line: `[Instagram OAuth] Redirect URI: ...`
4. Verify it matches what you added in Instagram settings

## Quick Checklist

- [ ] Added redirect URI to Instagram app settings
- [ ] URI is exactly: `https://airpublisher-tjha.vercel.app/api/auth/instagram/callback`
- [ ] No trailing slash
- [ ] Using HTTPS (not HTTP)
- [ ] App ID matches: `836687999185692`
- [ ] Waited 1-5 minutes for changes to propagate
- [ ] Tried OAuth flow again

## Still Not Working?

If you've done all of the above and it's still not working:

1. **Check Vercel logs** to see what redirect URI is actually being sent
2. **Verify environment variables** in Vercel dashboard
3. **Try removing and re-adding** the redirect URI in Instagram settings
4. **Check if your Instagram app type supports the scopes** you're requesting:
   - `instagram_business_basic`
   - `instagram_business_content_publish`

These scopes require an **Instagram Business Account** connected to a **Facebook Page**.
