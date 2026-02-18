# Google Sign-In Setup Guide

## ✅ What's Been Added

Google Sign-In buttons have been added to both the **Login** and **Signup** pages. Users can now sign in/up using their Google account.

## 🔧 Supabase Configuration Required

For Google Sign-In to work, you need to configure Google OAuth in your Supabase project:

### Step 1: Enable Google Provider in Supabase

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project
3. Go to **Authentication → Providers**
4. Find **Google** in the list
5. Click **Enable**
6. Click **Configure**

### Step 2: Add Redirect URI to Google Cloud Console

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project
3. Go to **APIs & Services → Credentials**
4. Find your OAuth 2.0 Client ID (or create a new one)
5. Click **Edit**
6. Under **Authorized redirect URIs**, add:
   ```
   https://pezvnqhexxttlhcnbtta.supabase.co/auth/v1/callback
   ```
7. Click **Save**

### Step 3: Add Credentials to Supabase

Back in Supabase Dashboard:

1. Go to **Authentication → Providers → Google**
2. In the Google provider configuration:
   - **Client ID (for OAuth)**: `YOUR_GOOGLE_CLIENT_ID`
   - **Client Secret (for OAuth)**: `YOUR_GOOGLE_CLIENT_SECRET`
3. Click **Save**

### Step 4: Test Google Sign-In

1. Go to `/login` or `/signup` in your app
2. Click **"Continue with Google"**
3. You should be redirected to Google login
4. After signing in, you'll be redirected back to `/dashboard`

---

## 📝 Notes

- **Same Google App**: You can use the same Google OAuth app you created for YouTube connections
- **Multiple Redirect URIs**: Google allows multiple redirect URIs, so you can add both:
  - Supabase callback: `https://your-project.supabase.co/auth/v1/callback`
  - Your app callback: `https://your-app.com/auth/callback` (if needed)

---

## 🔍 Troubleshooting

### "OAuth callback failed" error

**Check:**
1. Google provider is enabled in Supabase
2. Client ID and Secret are correct in Supabase
3. Redirect URI is added in Google Cloud Console
4. Redirect URI matches exactly (no trailing slashes)

### User not redirected after Google login

**Check:**
1. `/app/auth/callback/route.ts` exists (it should - we just created it)
2. Supabase Auth is properly configured
3. Check browser console for errors

### Google sign-in button not showing

**Check:**
1. Page is refreshed (hard refresh: Cmd+Shift+R or Ctrl+Shift+R)
2. No JavaScript errors in console
3. Google provider is enabled in Supabase (not just configured, but enabled)

---

## 🎯 How It Works

1. User clicks "Continue with Google"
2. App calls `supabase.auth.signInWithOAuth({ provider: 'google' })`
3. Supabase redirects to Google OAuth
4. User signs in with Google
5. Google redirects back to Supabase callback
6. Supabase exchanges code for session
7. User is redirected to `/auth/callback` in your app
8. App exchanges code for session
9. User is redirected to `/dashboard`

The callback route (`/app/auth/callback/route.ts`) handles step 8 - exchanging the OAuth code for a session.

---

## ✅ Ready to Test

Once you've:
1. ✅ Enabled Google provider in Supabase
2. ✅ Added Google OAuth credentials
3. ✅ Added redirect URI in Google Cloud Console

You can test Google Sign-In! Try it on the login or signup page.

