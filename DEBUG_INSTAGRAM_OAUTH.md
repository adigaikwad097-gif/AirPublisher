# Debug Instagram OAuth "Invalid platform app" Error

## Immediate Steps to Diagnose

### Step 1: Check Terminal Logs

When you click "Connect Instagram", **immediately check your terminal** (where `npm run dev` is running).

You should see logs like:
```
[Instagram OAuth] App ID being used: 836687...
[Instagram OAuth] App ID source: INSTAGRAM_APP_ID
[Instagram OAuth] Redirect URI: http://localhost:3000/api/auth/instagram/callback
```

**Share what you see in the terminal logs.**

### Step 2: Verify Environment Variables

Make sure your `.env.local` file has:

```bash
INSTAGRAM_APP_ID=836687999185692
INSTAGRAM_APP_SECRET=your_instagram_app_secret_here
```

**Important**: 
- No quotes around the values
- No spaces around `=`
- Exact value (no typos)

### Step 3: Verify Meta Dashboard Configuration

The "Invalid platform app" error means Instagram doesn't recognize your App ID as a valid Instagram Business Login app.

**Check in Meta Dashboard:**

1. **Go to**: https://developers.facebook.com/apps/
2. **Select your app**
3. **Products** → **Instagram**
4. **Check status**:
   - ✅ **"Active"** or **"In Review"** = Good
   - ❌ **"Not Set Up"** or **Missing** = Problem

5. **If Instagram is missing or not set up**:
   - Click **"Add Product"**
   - Find **"Instagram"**
   - Click **"Set Up"**
   - Complete the setup wizard

6. **Go to**: **Products** → **Instagram** → **"API setup with Instagram login"**
7. **Click**: **"3. Set up Instagram business login"**
8. **Click**: **"Business login settings"**
9. **Check**:
   - **Instagram App ID**: Should be `836687999185692`
   - **Instagram App Secret**: Should be set
   - **Valid OAuth Redirect URIs**: Should include:
     - `http://localhost:3000/api/auth/instagram/callback`
     - `https://untasting-overhugely-kortney.ngrok-free.dev/api/auth/instagram/callback`

### Step 4: Restart Dev Server

**Critical**: After updating `.env.local`, you **must** restart the dev server:

1. Stop dev server: `Ctrl+C`
2. Start again: `npm run dev`
3. Try connecting Instagram again

## Common Issues

### Issue 1: Using Meta App ID Instead of Instagram App ID

**Symptom**: Terminal shows `App ID source: META_APP_ID`

**Solution**: 
- Set `INSTAGRAM_APP_ID=836687999185692` in `.env.local`
- Restart dev server

### Issue 2: Instagram Product Not Set Up

**Symptom**: Instagram is missing from Products or shows "Not Set Up"

**Solution**:
- Add Instagram product
- Complete setup wizard
- Complete "3. Set up Instagram business login"

### Issue 3: App ID Doesn't Match

**Symptom**: `.env.local` has `836687999185692` but Meta Dashboard shows different ID

**Solution**:
- Use the App ID from **Instagram** → **Business login settings**
- Update `.env.local` to match
- Restart dev server

## What to Share for Help

If still not working, please share:

1. **Terminal logs** when clicking "Connect Instagram" (shows App ID used)
2. **Meta Dashboard** → **Products** → **Instagram** → Status (Active/Not Set Up/Missing)
3. **Meta Dashboard** → **Instagram** → **Business login settings**:
   - What does "Instagram App ID" show?
   - What URIs are in "Valid OAuth Redirect URIs"?

This will help identify the exact issue.



