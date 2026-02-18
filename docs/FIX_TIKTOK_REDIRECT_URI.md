# Fix TikTok "Invalid Redirect URI" Error

If you're getting "Invalid Redirect URI" when adding your ngrok URL to TikTok's developer settings, follow these steps:

## Step 1: Get Your Exact Ngrok URL

1. Make sure ngrok is running and note your exact ngrok URL:
   ```
   https://your-ngrok-id.ngrok-free.dev
   ```
   (Or whatever your ngrok URL is)

2. Your redirect URI should be:
   ```
   https://your-ngrok-id.ngrok-free.dev/api/auth/tiktok/callback
   ```

## Step 2: Add Redirect URI in TikTok Developer Console

1. Go to [TikTok Developers Portal](https://developers.tiktok.com/apps/)
2. Click on your app
3. Go to **"Login Kit"** or **"Products"** → **"Login Kit"**
4. Look for **"Redirect URI"** or **"OAuth Redirect URIs"** section
5. Click **"Add"** or **"Edit"**

## Step 3: Enter the EXACT Redirect URI

**Important Formatting Rules:**
- ✅ Must start with `https://` (NOT `http://`)
- ✅ Must be the FULL path: `https://your-ngrok-id.ngrok-free.dev/api/auth/tiktok/callback`
- ✅ NO trailing slash: Use `/api/auth/tiktok/callback` NOT `/api/auth/tiktok/callback/`
- ✅ NO query parameters or fragments
- ✅ Case sensitive - must match exactly

**Example:**
```
https://untasting-overhugely-kortney.ngrok-free.dev/api/auth/tiktok/callback
```

## Step 4: Common Mistakes to Avoid

❌ **Wrong:**
- `http://your-ngrok-id.ngrok-free.dev/api/auth/tiktok/callback` (using http instead of https)
- `your-ngrok-id.ngrok-free.dev/api/auth/tiktok/callback` (missing https://)
- `https://your-ngrok-id.ngrok-free.dev/api/auth/tiktok/callback/` (trailing slash)
- `https://your-ngrok-id.ngrok-free.dev/` (missing path)

✅ **Correct:**
- `https://your-ngrok-id.ngrok-free.dev/api/auth/tiktok/callback`

## Step 5: Save and Verify

1. Click **"Save"** or **"Submit"**
2. Make sure the redirect URI is added to the list
3. The exact URL should appear in your redirect URI list

## Step 6: Update Your Code (If Needed)

Your code should use the EXACT same redirect URI. Check your terminal logs when you click "Connect TikTok" - you should see:

```
[TikTok OAuth] Full redirect URI: https://your-ngrok-id.ngrok-free.dev/api/auth/tiktok/callback
```

Make sure this matches exactly what you added in TikTok's console.

## Step 7: Alternative: Use Localhost for Development

If ngrok URLs are causing issues, you can use localhost for development:

**In TikTok Console, add:**
```
http://localhost:3000/api/auth/tiktok/callback
```

**Note:** TikTok allows `http://` for localhost, but requires `https://` for all other domains (including ngrok).

## Step 8: Check for Multiple Redirect URI Settings

Some TikTok apps have redirect URIs in multiple places:
1. **Login Kit settings** (most common)
2. **OAuth settings** in Basic Information
3. **API settings**

Make sure you add the redirect URI in ALL relevant places.

## Still Not Working?

1. **Check the exact error message** - TikTok usually tells you what's wrong
2. **Verify your ngrok URL** - Make sure it's the current active ngrok URL
3. **Check for typos** - One character off will fail
4. **Wait a few minutes** - Sometimes TikTok takes a moment to update settings
5. **Clear browser cache** - Sometimes cached settings can cause issues

## Quick Checklist

- [ ] Using `https://` (not `http://`) for ngrok URL
- [ ] Full path included: `/api/auth/tiktok/callback`
- [ ] NO trailing slash
- [ ] NO query parameters
- [ ] Exact match between TikTok console and your code
- [ ] Saved in TikTok console
- [ ] Ngrok is running and URL is active

---

**Pro Tip:** Copy-paste the redirect URI directly from your terminal logs to avoid typos!






