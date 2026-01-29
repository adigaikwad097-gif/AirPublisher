# 🔴 CRITICAL: Redirect URI Must Be Added to Meta App

## The Problem

You're still getting: **"This redirect failed because the redirect URI is not whitelisted"**

This means the redirect URI `http://localhost:3000/api/auth/instagram/callback` is **NOT** added to the Meta App settings yet.

## ✅ MUST DO THIS NOW

### Step 1: Go to Meta App Settings

**Direct Link**: https://developers.facebook.com/apps/771396602627794/fb-login/settings/

Or navigate:
1. Go to: https://developers.facebook.com/apps/
2. Click on app: **771396602627794**
3. Click: **Products** → **Facebook Login** → **Settings**

### Step 2: Add Redirect URI

1. **Scroll down** to **"Valid OAuth Redirect URIs"**
2. **Click "Add URI"** button
3. **Paste EXACTLY this** (copy-paste, don't type):
   ```
   http://localhost:3000/api/auth/instagram/callback
   ```
4. **Click "Save Changes"** at the bottom

### Step 3: Enable OAuth Login

In the same page, make sure:
- ✅ **Client OAuth Login**: **Enabled** (toggle ON)
- ✅ **Web OAuth Login**: **Enabled** (toggle ON)
- **Save Changes**

### Step 4: Add App Domain

1. Go to: **Settings** → **Basic**
2. **App Domains**: Add `localhost`
3. **Website**: Add `http://localhost:3000`
4. **Save Changes**

### Step 5: Wait 2-3 Minutes

Meta settings can take 2-3 minutes to propagate. **Wait before testing again**.

## 🔍 Verify It's Added

After adding, check:

1. Go back to **Facebook Login → Settings**
2. Look at **"Valid OAuth Redirect URIs"**
3. You should see: `http://localhost:3000/api/auth/instagram/callback`
4. If you see it, you're good! Just wait 2-3 minutes.

## ⚠️ Common Mistakes

- ❌ Adding `https://localhost:3000` (wrong - must be `http://`)
- ❌ Missing `/api/auth/instagram/callback` (must include full path)
- ❌ Extra trailing slash (don't add `/` at the end)
- ❌ Not saving changes
- ❌ Not waiting for settings to propagate

## ✅ Correct Format

```
http://localhost:3000/api/auth/instagram/callback
```

**Exactly like this** - no variations!

---

## 🎯 After Adding

1. ✅ Added redirect URI
2. ✅ Enabled Client OAuth Login
3. ✅ Enabled Web OAuth Login
4. ✅ Added app domain
5. ✅ **Waited 2-3 minutes**
6. ✅ Try connecting Instagram again

**If you still get the error after waiting, the redirect URI wasn't added correctly. Double-check it matches exactly!**



