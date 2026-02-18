# 🔴 URGENT: Fix Instagram OAuth

## Problem

You're seeing:
- **Old App ID in URL**: `771396602627794` (should be `836687999185692`)
- **Error**: "Redirect URI is not whitelisted"

## ✅ Fix Steps (Do These Now)

### Step 1: Update `.env.local` File

**CRITICAL**: Make sure your `.env.local` has the NEW app ID and NO old ones:

```bash
# Instagram OAuth (Meta/Facebook) - NEW APP
META_APP_ID=836687999185692
META_APP_SECRET=4691b6a3b97ab0dcaec41b218e4321c1

# REMOVE OR COMMENT OUT ANY OLD APP IDs:
# META_APP_ID=771396602627794  <-- DELETE THIS LINE
# META_APP_ID=1405584781151443  <-- DELETE THIS LINE
```

**Check your `.env.local` file** - make sure there's only ONE `META_APP_ID` line with the new value!

### Step 2: Restart Dev Server

**MUST DO THIS** after updating `.env.local`:

```bash
# Stop server (Ctrl+C in terminal)
npm run dev
```

### Step 3: Add Redirect URI to NEW Meta App

Go to your **NEW Meta App** (App ID: `836687999185692`):

1. **Go to**: https://developers.facebook.com/apps/836687999185692/settings/basic/

2. **Settings → Basic**:
   - **App Domains**: Add `localhost`
   - **Website**: Add `http://localhost:3000`

3. **Products → Facebook Login → Settings**:
   - Enable **Client OAuth Login**: ✅ ON
   - Enable **Web OAuth Login**: ✅ ON
   - **Valid OAuth Redirect URIs**: Add these EXACT URLs:
     ```
     http://localhost:3000/api/auth/instagram/callback
     https://untasting-overhugely-kortney.ngrok-free.dev/api/auth/instagram/callback
     ```

4. **Save Changes**

5. **Wait 1-2 minutes** for settings to propagate

### Step 4: Verify App ID is Correct

After restarting, check the URL when you click "Connect Instagram":
- ✅ **Should show**: `client_id=836687999185692`
- ❌ **Should NOT show**: `client_id=771396602627794`

## 🔍 Debug: Why Old App ID?

If you still see the old app ID:

1. **Check `.env.local`**:
   ```bash
   cat .env.local | grep META_APP_ID
   ```
   Should show ONLY: `META_APP_ID=836687999185692`

2. **Check for multiple definitions**:
   ```bash
   grep -n "META_APP_ID" .env.local
   ```
   Delete any duplicate lines!

3. **Restart dev server** (Ctrl+C, then `npm run dev`)

4. **Clear browser cache** or use incognito mode

## ✅ Quick Checklist

- [ ] `.env.local` has `META_APP_ID=836687999185692` (ONLY this one)
- [ ] Removed all old `META_APP_ID` lines from `.env.local`
- [ ] Restarted dev server after updating `.env.local`
- [ ] Added `http://localhost:3000/api/auth/instagram/callback` to Meta App
- [ ] Added ngrok URL to Meta App redirect URIs
- [ ] Enabled Client OAuth Login
- [ ] Enabled Web OAuth Login
- [ ] Waited 1-2 minutes after saving Meta App settings

## 🎯 Expected Result

After fixing:
1. Click "Connect Instagram"
2. URL should show `client_id=836687999185692` (not the old one)
3. Should redirect to Facebook login (this is normal!)
4. After login, connects to Instagram account
5. Redirects back to your app successfully

---

**Most Common Issue**: Not restarting dev server after updating `.env.local`!






