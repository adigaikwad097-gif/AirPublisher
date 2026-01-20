# Fix Instagram OAuth - New App Setup

## 🔴 Problem

You're seeing:
- **Error**: "This redirect failed because the redirect URI is not whitelisted"
- **Old App ID**: `771396602627794` (should be `836687999185692`)

## ✅ Solution

### Step 1: Update `.env.local` with New App ID

Make sure your `.env.local` has the **NEW** credentials:

```bash
META_APP_ID=836687999185692
META_APP_SECRET=4691b6a3b97ab0dcaec41b218e4321c1
```

**Important**: Remove any old `META_APP_ID` or `INSTAGRAM_APP_ID` values!

### Step 2: Restart Dev Server

After updating `.env.local`:
```bash
# Stop server (Ctrl+C)
npm run dev
```

### Step 3: Add Redirect URI to Meta App

Go to [Meta for Developers](https://developers.facebook.com/apps/836687999185692/settings/basic/) and:

1. **Select your app** (App ID: `836687999185692`)

2. **Go to Settings → Basic**:
   - Scroll to "App Domains"
   - Add: `localhost`

3. **Go to Products → Facebook Login → Settings**:
   - Enable **Client OAuth Login**: ✅ ON
   - Enable **Web OAuth Login**: ✅ ON
   - Under **Valid OAuth Redirect URIs**, add:
     ```
     http://localhost:3000/api/auth/instagram/callback
     ```

4. **If using ngrok** (for production/testing), also add:
   ```
   https://untasting-overhugely-kortney.ngrok-free.dev/api/auth/instagram/callback
   ```

5. **Save Changes**

### Step 4: Verify App ID in Code

The code should be using `process.env.META_APP_ID`. Check that:
- `.env.local` has `META_APP_ID=836687999185692`
- No other `META_APP_ID` or `INSTAGRAM_APP_ID` in `.env.local`
- Dev server was restarted after updating `.env.local`

## 🔍 Debug: Check Which App ID is Being Used

Add this to see what's being used:
```bash
# In terminal, check env vars
echo $META_APP_ID
```

Or check `.env.local`:
```bash
cat .env.local | grep META_APP_ID
```

## ✅ After Fixing

1. **Update `.env.local`** with new app ID
2. **Restart dev server**
3. **Add redirect URI** in Meta App settings
4. **Try connecting Instagram again**

The URL should now show `client_id=836687999185692` (not `771396602627794`).

---

## 📝 Quick Checklist

- [ ] `.env.local` has `META_APP_ID=836687999185692`
- [ ] `.env.local` has `META_APP_SECRET=4691b6a3b97ab0dcaec41b218e4321c1`
- [ ] Removed old app ID from `.env.local`
- [ ] Restarted dev server
- [ ] Added redirect URI in Meta App settings
- [ ] Enabled Client OAuth Login
- [ ] Enabled Web OAuth Login

---

**Note**: The redirect URI must match **exactly** - including `http://` vs `https://` and the full path!


