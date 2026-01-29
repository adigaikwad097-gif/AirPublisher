# Add Redirect URI to Meta App (771396602627794)

## 🔴 Current Error

**Error**: "This redirect failed because the redirect URI is not whitelisted"

**Redirect URI needed**: `http://localhost:3000/api/auth/instagram/callback`

## ✅ Step-by-Step: Add Redirect URI

### Step 1: Go to Meta App Settings

1. **Open**: https://developers.facebook.com/apps/771396602627794/settings/basic/
2. **Login** to Meta for Developers (if needed)

### Step 2: Add Redirect URI in TWO Places

#### Location 1: Facebook Login Settings

1. **Click**: "Products" in left sidebar
2. **Click**: "Facebook Login" 
3. **Click**: "Settings" (under Facebook Login)
4. **Scroll down** to "Valid OAuth Redirect URIs"
5. **Click**: "Add URI"
6. **Paste this EXACT URL**:
   ```
   http://localhost:3000/api/auth/instagram/callback
   ```
7. **Click**: "Save Changes"

#### Location 2: Basic Settings

1. **Go back to**: Settings → Basic
2. **Scroll down** to "Valid OAuth Redirect URIs" (if it exists here)
3. **Add the same URL**:
   ```
   http://localhost:3000/api/auth/instagram/callback
   ```

### Step 3: Enable OAuth Settings

In **Products → Facebook Login → Settings**:

1. **Client OAuth Login**: Toggle **ON** ✅
2. **Web OAuth Login**: Toggle **ON** ✅
3. **Save Changes**

### Step 4: Add App Domain

In **Settings → Basic**:

1. **App Domains**: Add `localhost` (without `http://`)
2. **Website**: Add `http://localhost:3000`
3. **Save Changes**

### Step 5: If Using Ngrok (Production)

Also add your ngrok URL:

```
https://untasting-overhugely-kortney.ngrok-free.dev/api/auth/instagram/callback
```

## ⚠️ Important Notes

1. **Exact Match Required**: The redirect URI must match EXACTLY:
   - ✅ `http://localhost:3000/api/auth/instagram/callback`
   - ❌ `http://localhost:3000/api/auth/instagram/callback/` (extra slash)
   - ❌ `https://localhost:3000/api/auth/instagram/callback` (wrong protocol)

2. **Wait 1-2 Minutes**: Meta settings can take 1-2 minutes to propagate

3. **Check Both Locations**: Make sure it's added in:
   - Products → Facebook Login → Settings
   - Settings → Basic (if available)

## ✅ Verification Checklist

- [ ] Added `http://localhost:3000/api/auth/instagram/callback` to Facebook Login → Settings
- [ ] Added `http://localhost:3000/api/auth/instagram/callback` to Settings → Basic (if available)
- [ ] Enabled "Client OAuth Login"
- [ ] Enabled "Web OAuth Login"
- [ ] Added `localhost` to App Domains
- [ ] Added `http://localhost:3000` to Website
- [ ] Saved all changes
- [ ] Waited 1-2 minutes

## 🔄 After Adding

1. **Wait 1-2 minutes** for settings to propagate
2. **Try connecting Instagram again**
3. **Should work now!**

---

## 📝 Quick Reference

**App ID**: `771396602627794`  
**Redirect URI**: `http://localhost:3000/api/auth/instagram/callback`  
**App Settings**: https://developers.facebook.com/apps/771396602627794/settings/basic/



