# Fix Instagram Redirect URI Blocked Error

You're seeing: **"URL Blocked: This redirect failed because the redirect URI is not whitelisted in the app's Client OAuth Settings."**

This means the redirect URI `http://localhost:3000/api/auth/instagram/callback` is not whitelisted in your Meta App settings.

## Quick Fix (Do ALL of these steps)

### Step 1: Add Redirect URI to Facebook Login Settings

1. Go to [Meta for Developers Dashboard](https://developers.facebook.com/apps/)
2. Select your app (App ID: `771396602627794`)
3. Go to **Products** → **Facebook Login** → **Settings**
4. Under **Valid OAuth Redirect URIs**, click **Add URI**
5. Add **exactly** this URI:
   ```
   http://localhost:3000/api/auth/instagram/callback
   ```
6. If you're using ngrok for testing, also add:
   ```
   https://your-ngrok-url.ngrok-free.app/api/auth/instagram/callback
   ```
7. Click **Save Changes**

### Step 2: Enable Client and Web OAuth Login

In the same **Facebook Login** → **Settings** page:

1. ✅ Ensure **Client OAuth Login** is **ON** (toggle should be blue)
2. ✅ Ensure **Web OAuth Login** is **ON** (toggle should be blue)
3. Click **Save Changes**

### Step 3: Add App Domain

1. Go to **Settings** → **Basic** in your Meta App dashboard
2. Scroll to **App Domains**
3. Add:
   - `localhost` (for development)
   - `your-ngrok-url.ngrok-free.app` (if using ngrok for testing)
4. Click **Save Changes**

### Step 4: Add Site URL

Still in **Settings** → **Basic**:

1. Scroll to **Site URL**
2. Set it to:
   ```
   http://localhost:3000
   ```
3. Click **Save Changes**

### Step 5: Verify Redirect URIs in Instagram Settings (Optional)

Even though Instagram uses Facebook OAuth, it's good to also check Instagram settings:

1. Go to **Products** → **Instagram** → **API setup with Instagram login**
2. Go to **3. Set up Instagram business login** → **Business login settings**
3. Check if there's a redirect URI section and add:
   ```
   http://localhost:3000/api/auth/instagram/callback
   ```

## After Making Changes

1. **Wait 2-5 minutes** for Meta's systems to update
2. **Clear your browser cache** or try in incognito mode
3. **Restart your dev server** (if needed)
4. **Try connecting Instagram again**

## Still Not Working?

### Check These Common Issues:

1. **Exact URI Match**: The redirect URI must match **exactly** (including `http://` vs `https://` and trailing slashes)
   - ✅ Correct: `http://localhost:3000/api/auth/instagram/callback`
   - ❌ Wrong: `http://localhost:3000/api/auth/instagram/callback/` (trailing slash)
   - ❌ Wrong: `https://localhost:3000/api/auth/instagram/callback` (https instead of http)

2. **App in Development Mode**: If your app is in Development Mode, only you and test users can use it
   - Go to **Settings** → **Basic** → **App Mode**
   - Ensure your Facebook account is added as a **Developer** or **Tester**

3. **Multiple Redirect URIs**: If you have multiple environments, add all of them:
   - `http://localhost:3000/api/auth/instagram/callback` (development)
   - `https://your-production-domain.com/api/auth/instagram/callback` (production)
   - `https://your-ngrok-url.ngrok-free.app/api/auth/instagram/callback` (testing)

## Debug: Verify Your Current Settings

After making changes, verify:

1. **Facebook Login** → **Settings**:
   - ✅ Client OAuth Login: **ON**
   - ✅ Web OAuth Login: **ON**
   - ✅ `http://localhost:3000/api/auth/instagram/callback` is in the list

2. **Settings** → **Basic**:
   - ✅ App Domain: `localhost` is in the list
   - ✅ Site URL: `http://localhost:3000`

## Reference

- [Facebook Login Settings Documentation](https://developers.facebook.com/docs/facebook-login/web)
- [OAuth Redirect URIs Guide](https://developers.facebook.com/docs/facebook-login/web#redirecturi)






