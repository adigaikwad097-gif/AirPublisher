# Instagram "Invalid platform app" - Final Checklist

You're still getting "Invalid platform app" error. This is a **Meta Dashboard configuration issue**, not a code issue.

## Critical Checks in Meta Dashboard

### ✅ Step 1: Verify Instagram Product is Properly Set Up

1. Go to https://developers.facebook.com/apps/
2. Select your app
3. Click **"Products"** (left sidebar)
4. Check if **"Instagram"** appears in the list with a status:
   - ✅ **"Active"** or **"In Review"** = Good
   - ❌ **"Not Set Up"** = Need to set it up
   - ❌ **Missing** = Need to add it

**If Instagram is missing or not set up:**
1. Click **"Add Product"**
2. Find **"Instagram"** in the list
3. Click **"Set Up"**
4. Complete the setup wizard

### ✅ Step 2: Complete Instagram Business Login Setup

1. **Products** → **Instagram**
2. Click **"API setup with Instagram login"**
3. You should see: **"3. Set up Instagram business login"**
4. Click on **"3. Set up Instagram business login"**
5. Click **"Business login settings"**

**Verify in Business login settings:**
- ✅ **Instagram App ID** = `836687999185692` (must match exactly)
- ✅ **Instagram App Secret** = (your secret - should be set)
- ✅ **Valid OAuth Redirect URIs** should include:
  - `http://localhost:3000/api/auth/instagram/callback`
  - `https://untasting-overhugely-kortney.ngrok-free.app/api/auth/instagram/callback`
  - Any other URIs you're using

### ✅ Step 3: Check App ID Match

**Critical**: The App ID `836687999185692` must match what's shown in:
- **Instagram** → **Business login settings** → **Instagram App ID**

**If it doesn't match:**
- Use the App ID from Business login settings (not from Settings → Basic)
- Update your `.env.local` with the correct Instagram App ID

### ✅ Step 4: Verify Your Account Type

Your Instagram account must be:
- ✅ **Business** account, OR
- ✅ **Creator** account

**Personal accounts don't work with Instagram Business Login.**

To check:
- Instagram mobile app → Settings → Account type and tools
- If it's personal, convert to Business or Creator

### ✅ Step 5: Check App Mode

1. Go to **Settings** → **Basic**
2. **App Mode**:
   - Should be **Development** or **Live**
   - If **Disabled**, enable it
3. **Publishing status**:
   - Check if app is in **Testing** or **Live** mode

### ✅ Step 6: Verify Redirect URIs are Added

In **Instagram** → **Business login settings**:

**Valid OAuth Redirect URIs** must include **exactly**:
```
http://localhost:3000/api/auth/instagram/callback
https://untasting-overhugely-kortney.ngrok-free.app/api/auth/instagram/callback
```

**Important**:
- No trailing slashes
- Exact protocol (`http://` vs `https://`)
- Exact path (`/api/auth/instagram/callback`)

### ✅ Step 7: Restart Dev Server

After updating `.env.local`:
1. Stop dev server (`Ctrl+C`)
2. Start again: `npm run dev`
3. Try connecting Instagram again

## Common Issues and Solutions

### Issue 1: App ID Doesn't Match

**Symptom**: `.env.local` has `INSTAGRAM_APP_ID=836687999185692` but Meta Dashboard shows different ID

**Solution**: 
- Use the App ID from **Instagram** → **Business login settings**
- Update `.env.local` to match
- Restart dev server

### Issue 2: Instagram Product Not Fully Set Up

**Symptom**: Instagram is in Products but shows "Not Set Up"

**Solution**:
- Complete the setup wizard
- Go through all steps in "API setup with Instagram login"
- Ensure "3. Set up Instagram business login" is completed

### Issue 3: Instagram Account is Personal

**Symptom**: Personal Instagram account can't connect

**Solution**:
- Convert to Business or Creator account
- Instagram mobile app → Settings → Account type and tools → Switch to Professional

### Issue 4: Redirect URI Not Whitelisted

**Symptom**: Redirect URIs not matching exactly

**Solution**:
- Check **Business login settings** → **Valid OAuth Redirect URIs**
- Ensure exact URIs are added (no trailing slashes, correct protocol)

## Debug: Check Terminal Logs

When you click "Connect Instagram", check terminal logs:

```
[Instagram OAuth] App ID being used: 836687...
[Instagram OAuth] App ID source: INSTAGRAM_APP_ID
[Instagram OAuth] Redirect URI: http://localhost:3000/api/auth/instagram/callback
```

**If you see:**
- `App ID source: META_APP_ID` → `.env.local` doesn't have `INSTAGRAM_APP_ID` set correctly
- `App ID being used: 771396...` → It's using Meta App ID instead of Instagram App ID

## What to Verify Right Now

**Before trying again, verify:**

1. ✅ **Meta Dashboard** → **Products** → **Instagram** exists and is **Active/Set Up**
2. ✅ **Instagram** → **Business login settings** → **Instagram App ID** = `836687999185692`
3. ✅ **Instagram** → **Business login settings** → **Valid OAuth Redirect URIs** includes both localhost and ngrok URIs
4. ✅ **Your `.env.local`** has `INSTAGRAM_APP_ID=836687999185692`
5. ✅ **Dev server restarted** after updating `.env.local`
6. ✅ **Your Instagram account** is Business or Creator (not Personal)

## Still Not Working?

If you've verified all of the above and it still doesn't work, the issue might be:

1. **Meta Dashboard app is in a restricted state**
   - Check for any warnings or errors in Meta Dashboard
   - App might need review or verification

2. **Instagram Business Login requires additional setup**
   - Some apps need business verification for production use
   - Check if any additional steps are required

3. **Try using the Embed URL directly**
   - Meta Dashboard → Instagram → Business login settings
   - Copy the "Embed URL" they provide
   - Compare it with what your code generates
   - Ensure the parameters match exactly

## Share This Info for Further Help

If still not working, please share:

1. **Terminal logs** when clicking "Connect Instagram" (shows App ID used)
2. **Meta Dashboard** → **Instagram** → Status (Active/Set Up/Not Set Up)
3. **Meta Dashboard** → **Instagram** → **Business login settings**:
   - What does "Instagram App ID" show?
   - What URIs are in "Valid OAuth Redirect URIs"?
4. **Your Instagram account type**: Business/Creator/Personal



