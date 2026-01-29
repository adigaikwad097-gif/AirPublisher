# Facebook Login Setup for Instagram OAuth

## ⚠️ Important

**Instagram OAuth requires Facebook Login to be configured first!**

Instagram Business Login uses Facebook Login OAuth as the underlying authentication mechanism. If Facebook Login is not properly configured, Instagram OAuth will:
- ❌ Never complete
- ❌ Give no error
- ❌ Return no token
- ❌ Just silently fail

---

## 🚀 Step-by-Step: Configure Facebook Login in Meta

### Step 1: Go to Meta Developers

1. Go to: https://developers.facebook.com/apps
2. **Select your app**: ID `771396602627794`
3. You should already be on the app dashboard

---

### Step 2: Add Facebook Login Product

1. In the left sidebar, look for **"Products"**
2. Find **"Facebook Login"** (if not added yet)
3. Click **"Set Up"** or **"Add Product"**
4. It will be added to your app

---

### Step 3: Configure Facebook Login Settings

Once Facebook Login is added:

1. Click **"Facebook Login"** in the left sidebar (under Products)
2. Click **"Settings"** (or go to: **Products → Facebook Login → Settings**)

---

### Step 4: Add Valid OAuth Redirect URIs

In the Facebook Login settings, find **"Valid OAuth Redirect URIs"**

Add these URIs:

```
http://localhost:3000/api/auth/instagram/callback
https://airpublisher.onrender.com/api/auth/instagram/callback
```

**How to add:**
1. Click **"Add URI"** button (or the `+` icon)
2. Paste each URI one by one
3. Click **"Save Changes"** after each addition

---

### Step 5: Configure Client OAuth Settings

Make sure these are set:

1. **"Client OAuth Login"**: **Enabled** ✅
2. **"Web OAuth Login"**: **Enabled** ✅
3. **"Use Strict Mode for Redirect URIs"**: 
   - For development: **Disabled** (allows localhost)
   - For production: **Enabled** (more secure)

---

### Step 6: Add Instagram Product (if needed)

Even though you're using Facebook Login, you also need Instagram permissions:

1. In the left sidebar, look for **"Products"**
2. Find **"Instagram"** 
3. If not added, click **"Set Up"** or **"Add Product"**
4. Go to **Products → Instagram → Basic Display** (or **Instagram Graph API**)

---

### Step 7: Configure App Domains

1. Go to **Settings → Basic**
2. Scroll to **"App Domains"**
3. Add:
   ```
   localhost
   airpublisher.onrender.com
   ```
   (if not already added)

---

### Step 8: Save and Test

1. **Save all changes**
2. **Wait a few minutes** for Meta to propagate changes
3. **Test the connection** in your app:
   - Go to: `http://localhost:3000/settings/connections`
   - Click: "Connect Instagram"
   - Should redirect to Facebook OAuth (not Instagram directly)

---

## 🔍 What You Should See in Meta Console

### Facebook Login Product Should Show:

- ✅ Status: **Active**
- ✅ Valid OAuth Redirect URIs: 
  - `http://localhost:3000/api/auth/instagram/callback`
  - `https://airpublisher.onrender.com/api/auth/instagram/callback`
- ✅ Client OAuth Login: **Enabled**
- ✅ Web OAuth Login: **Enabled**

---

## 📋 Quick Checklist

- [ ] Facebook Login product is added to your app
- [ ] Valid OAuth Redirect URIs are configured
- [ ] Client OAuth Login is enabled
- [ ] Web OAuth Login is enabled
- [ ] App Domains include `localhost` and your production domain
- [ ] Instagram product is also added (for permissions)
- [ ] All changes are saved
- [ ] Waited a few minutes for changes to propagate

---

## 🐛 Common Issues

### "Invalid Redirect URI"

- Make sure the redirect URI in Meta matches **exactly** what your code uses
- Check for typos: `localhost` vs `127.0.0.1`
- Check for trailing slashes: `/callback` vs `/callback/`
- Make sure you added both `http://localhost:3000/...` and `https://...` versions

### "App Not Ready for Production"

- For development/testing, you can use `localhost` without app review
- For production, you may need to submit your app for review
- Add test users in **Settings → Roles → Test Users**

### "OAuth Redirect URI Mismatch"

- The URI in Meta must match the one in your `.env.local`:
  ```
  NEXT_PUBLIC_APP_URL=http://localhost:3000
  ```
- Check your callback route uses: `${NEXT_PUBLIC_APP_URL}/api/auth/instagram/callback`

---

## ✅ After Configuration

Once Facebook Login is configured:

1. **Instagram OAuth will work** because it uses Facebook Login under the hood
2. **Users will see Facebook OAuth screen** (this is normal for Instagram Business Login)
3. **Tokens will be stored** in your `instagram_tokens` table
4. **You can then use Instagram Graph API** to post content

---

## 🎯 What Happens During OAuth Flow

1. User clicks "Connect Instagram"
2. Redirects to **Facebook OAuth** (not Instagram directly)
3. User authorizes Facebook/Instagram permissions
4. Meta returns authorization code
5. Your callback exchanges code for Facebook access token
6. Your callback uses Facebook token to get Instagram Business Account ID
7. Tokens stored in Supabase `instagram_tokens` table

---

## 📝 Your Current App ID and Secret

- **App ID**: `771396602627794`
- **App Secret**: `67b086a74833746df6a0a7ed0b50f867`

These are already in your `.env.local` as `META_APP_ID` and `META_APP_SECRET`.

---

## 🆘 Still Having Issues?

After configuring Facebook Login:

1. **Wait 5-10 minutes** for Meta to propagate changes
2. **Clear browser cache** (Ctrl+Shift+R)
3. **Try OAuth flow again** from your app
4. **Check browser console** for errors
5. **Check terminal logs** for OAuth callback errors

---

**Next Step**: Once Facebook Login is configured, come back and test the Instagram connection in your app! 🚀



