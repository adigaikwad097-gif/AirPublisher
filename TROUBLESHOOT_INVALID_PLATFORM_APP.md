# Troubleshoot "Invalid platform app" Error

You're still getting "Invalid platform app" error. This means Instagram doesn't recognize the App ID as a valid Instagram Business Login app.

## Step 1: Verify Dev Server Was Restarted

**Critical**: Environment variables are only loaded when the server starts. If you didn't restart, it's still using old values.

1. **Stop your dev server**: Press `Ctrl+C` in the terminal
2. **Wait 2 seconds**
3. **Start it again**: `npm run dev`
4. **Try connecting Instagram again**

## Step 2: Check Terminal Logs

When you click "Connect Instagram", check your terminal logs. You should see:

```
[Instagram OAuth] App ID being used: 836687...
[Instagram OAuth] App ID source: INSTAGRAM_APP_ID
```

If you see:
- `App ID source: META_APP_ID` → Your `.env.local` doesn't have `INSTAGRAM_APP_ID` set
- `App ID being used: 771396...` → It's using Meta App ID instead of Instagram App ID

## Step 3: Verify `.env.local` Content

Your `.env.local` file should have:

```bash
INSTAGRAM_APP_ID=836687999185692
INSTAGRAM_APP_SECRET=your_instagram_app_secret_here
```

**Important**: 
- No quotes around the values
- No spaces around `=`
- Exact values (no typos)

## Step 4: Verify Instagram Business Login is Configured

The "Invalid platform app" error can also mean Instagram Business Login isn't properly set up in Meta Dashboard.

### Check 1: Instagram Product is Added

1. Go to [Meta Dashboard](https://developers.facebook.com/apps/)
2. Select your app
3. Go to **Products** (left sidebar)
4. Check if **"Instagram"** is in the list
5. If not, click **"Add Product"** → **"Instagram"** → **"Set Up"**

### Check 2: Instagram Business Login is Set Up

1. In Meta Dashboard, go to **Products** → **Instagram**
2. Click **"API setup with Instagram login"**
3. Complete **"3. Set up Instagram business login"**
   - Click **"Business login settings"**
   - Verify **"Instagram App ID"** matches `836687999185692`
   - Verify **"Valid OAuth Redirect URIs"** includes `http://localhost:3000/api/auth/instagram/callback`

### Check 3: App Status

1. Go to **Settings** → **Basic**
2. Check **App Mode**: Should be **Development** or **Live**
3. If in Development mode, ensure your Facebook account is added as a **Developer**

## Step 5: Verify Redirect URI is Whitelisted

In **Instagram** → **Business login settings**:

1. Check **"Valid OAuth Redirect URIs"**
2. Ensure `http://localhost:3000/api/auth/instagram/callback` is listed **exactly**
   - ✅ Correct: `http://localhost:3000/api/auth/instagram/callback`
   - ❌ Wrong: `http://localhost:3000/api/auth/instagram/callback/` (trailing slash)
   - ❌ Wrong: `https://localhost:3000/api/auth/instagram/callback` (https instead of http)

## Common Issues

### Issue 1: Using Meta App ID Instead of Instagram App ID

**Symptom**: Terminal shows `App ID source: META_APP_ID`

**Fix**: 
- Make sure `INSTAGRAM_APP_ID=836687999185692` is in `.env.local`
- Restart dev server

### Issue 2: Instagram Product Not Added

**Symptom**: No "Instagram" option in Products

**Fix**:
1. Go to **Products** → **Add Product**
2. Select **"Instagram"**
3. Click **"Set Up"**
4. Complete the Instagram Business Login setup

### Issue 3: Instagram Business Login Not Completed

**Symptom**: "Instagram" is in Products, but setup is incomplete

**Fix**:
1. Go to **Products** → **Instagram** → **API setup with Instagram login**
2. Complete **"3. Set up Instagram business login"**
3. Add redirect URI: `http://localhost:3000/api/auth/instagram/callback`
4. Save changes

## Next Steps

1. **Restart dev server** (if you haven't already)
2. **Check terminal logs** when clicking "Connect Instagram"
3. **Share the terminal logs** if you still see the error (I'll help debug further)

The debug logs will show exactly which App ID is being used, which will help identify the issue.


