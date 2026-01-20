# Verify Instagram Business Login Setup

You're getting "Invalid platform app" error. This means Instagram doesn't recognize your App ID (`836687999185692`) as a valid Instagram Business Login app.

## Critical: Check Terminal Logs First

When you click "Connect Instagram", **immediately check your terminal** (where `npm run dev` is running).

You should see logs like:
```
[Instagram OAuth] App ID being used: 836687...
[Instagram OAuth] App ID source: INSTAGRAM_APP_ID
```

**If you see `App ID source: META_APP_ID` or `App ID being used: 771396...`**, your `.env.local` isn't being read. You need to:
1. Stop dev server (`Ctrl+C`)
2. Start again: `npm run dev`
3. Try connecting again

## Most Likely Issue: Instagram Business Login Not Properly Configured

The error "Invalid platform app" means your App ID (`836687999185692`) exists, but Instagram Business Login isn't fully set up for it.

### Step-by-Step Verification in Meta Dashboard

#### Step 1: Verify Instagram Product is Added

1. Go to https://developers.facebook.com/apps/
2. Select your app
3. Click **"Products"** in the left sidebar
4. Check if **"Instagram"** is listed
   - ✅ **If YES**: Continue to Step 2
   - ❌ **If NO**: 
     - Click **"Add Product"**
     - Find **"Instagram"** in the list
     - Click **"Set Up"** next to Instagram

#### Step 2: Complete Instagram Business Login Setup

1. Click **"Products"** → **"Instagram"**
2. You should see: **"API setup with Instagram login"**
3. Click on **"3. Set up Instagram business login"**
4. Click **"Business login settings"**

#### Step 3: Verify App ID Matches

In **Business login settings**, check:

1. **Instagram App ID** should be: `836687999185692`
   - If it's different, use the one shown in the dashboard
   - Update your `.env.local` to match

2. **Instagram App Secret** should match what you have in `.env.local`

3. **Valid OAuth Redirect URIs** should include:
   ```
   http://localhost:3000/api/auth/instagram/callback
   ```
   - Click **"Add URI"** if it's missing
   - Make sure it's **exactly** `http://localhost:3000/api/auth/instagram/callback` (no trailing slash)

#### Step 4: Check App Status

1. Go to **Settings** → **Basic**
2. Check **App Mode**:
   - Should be **Development** or **Live**
   - If it says "Disabled", you need to enable it
3. Check **App Status**:
   - Should show as active

#### Step 5: Verify Instagram API is Enabled

1. Go to **Products** → **Instagram** → **API setup with Instagram login**
2. Check the status:
   - Should show as **"Active"** or **"In Review"**
   - If it says **"Not Set Up"**, you need to complete the setup

## Alternative: Use Meta App ID Instead

If Instagram Business Login isn't working with the Instagram App ID, you might need to use the **Meta App ID** instead (but this will redirect to Facebook login, not Instagram).

To test this:
1. In `.env.local`, temporarily comment out `INSTAGRAM_APP_ID`:
   ```bash
   # INSTAGRAM_APP_ID=836687999185692
   ```
2. Keep `META_APP_ID=771396602627794` active
3. Restart dev server
4. Try connecting again

**Note**: This will redirect to Facebook login (not Instagram), but it will tell us if the issue is with the Instagram App ID specifically.

## What to Check Next

1. **Did you restart the dev server after updating `.env.local`?**
   - If NO → Stop server (`Ctrl+C`) and restart (`npm run dev`)
   
2. **What does the terminal log show when you click "Connect Instagram"?**
   - Check the `[Instagram OAuth] App ID being used:` and `App ID source:` logs
   - Share these if you still see errors

3. **In Meta Dashboard → Instagram → Business login settings:**
   - Does the Instagram App ID match `836687999185692`?
   - Is the redirect URI `http://localhost:3000/api/auth/instagram/callback` added?
   - Is Instagram API with Instagram Login showing as "Active"?

## Still Not Working?

If you've verified all of the above and it still doesn't work, the issue might be:

1. **Instagram App ID doesn't have Instagram Business Login enabled**
   - You may need to create a new app specifically for Instagram Business Login
   - Or complete the setup process in Meta Dashboard

2. **App is in Development Mode with restricted access**
   - Check if your Facebook account is added as a Developer or Tester
   - Settings → Roles → Check if your account is listed

Share the terminal logs when you click "Connect Instagram" so I can see exactly what App ID is being used.


