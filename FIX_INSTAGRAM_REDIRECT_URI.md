# Fix Instagram Redirect URI Error

## ✅ Normal Behavior: Facebook Login for Instagram

**This is correct!** Instagram OAuth uses Facebook login because Instagram is owned by Meta (Facebook). You'll see Facebook login, then it connects to your Instagram account.

## 🔧 Fix the Redirect URI Error

The error means your redirect URI isn't whitelisted in Meta App settings. Follow these steps:

### Step 1: Get Your Exact Redirect URI

Your ngrok URL: `https://untasting-overhugely-kortney.ngrok-free.dev`

**Exact redirect URI to add:**
```
https://untasting-overhugely-kortney.ngrok-free.dev/api/auth/instagram/callback
```

### Step 2: Add Redirect URI in Meta App

1. Go to: https://developers.facebook.com/apps/
2. Select your app (App ID: **1405584781151443**)
3. Go to **Settings → Basic**
4. Scroll down to **Valid OAuth Redirect URIs**
5. Click **Add URI**
6. Paste this **exact** URL:
   ```
   https://untasting-overhugely-kortney.ngrok-free.dev/api/auth/instagram/callback
   ```
7. Click **Save Changes**

### Step 3: Enable OAuth Settings

In the same app settings, make sure:

1. **Settings → Basic**
   - **App Domains**: Add `untasting-overhugely-kortney.ngrok-free.dev` (without `https://`)
   - **Website**: Add `https://untasting-overhugely-kortney.ngrok-free.dev`

2. **Settings → Advanced**
   - **Valid OAuth Redirect URIs**: Already added above ✓

3. **Products → Facebook Login → Settings**
   - **Client OAuth Login**: **Enabled** ✅
   - **Web OAuth Login**: **Enabled** ✅
   - **Valid OAuth Redirect URIs**: Add the same URL here too:
     ```
     https://untasting-overhugely-kortney.ngrok-free.dev/api/auth/instagram/callback
     ```

### Step 4: Wait 1-2 Minutes

Meta can take 1-2 minutes to propagate settings. Wait a bit before testing again.

### Step 5: Test Again

1. Go to: `https://untasting-overhugely-kortney.ngrok-free.dev/settings/connections`
2. Click **Connect Instagram**
3. You should see Facebook login (this is normal!)
4. After logging in, it will connect to your Instagram account

---

## 📋 Complete Checklist

- [ ] Added redirect URI in **Settings → Basic → Valid OAuth Redirect URIs**
- [ ] Added redirect URI in **Facebook Login → Settings → Valid OAuth Redirect URIs**
- [ ] Added app domain in **Settings → Basic → App Domains**
- [ ] Enabled **Client OAuth Login** in **Facebook Login → Settings**
- [ ] Enabled **Web OAuth Login** in **Facebook Login → Settings**
- [ ] Waited 1-2 minutes for settings to propagate
- [ ] `.env.local` has `NEXT_PUBLIC_APP_URL=https://untasting-overhugely-kortney.ngrok-free.dev`

---

## ⚠️ Common Mistakes

1. **Missing `/api/auth/instagram/callback`** - Must include the full path
2. **Using `http://` instead of `https://`** - Must use HTTPS
3. **Extra trailing slash** - Don't add `/` at the end
4. **Wrong URL** - Must match your ngrok URL exactly
5. **Not waiting** - Settings take 1-2 minutes to update

---

## 🔍 Verify Your Settings

To double-check your redirect URI is correct:

1. Go to **Facebook Login → Settings** in your Meta App
2. Look at **Valid OAuth Redirect URIs**
3. You should see: `https://untasting-overhugely-kortney.ngrok-free.dev/api/auth/instagram/callback`

If it's there, you're good to go! Just wait a minute and try again.


