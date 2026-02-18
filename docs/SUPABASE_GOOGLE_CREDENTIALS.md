# Supabase Google OAuth Credentials

## ✅ Your Credentials

**Client ID:**
```
YOUR_GOOGLE_CLIENT_ID
```

**Client Secret:**
```
YOUR_GOOGLE_CLIENT_SECRET
```

**Callback URL:**
```
https://pezvnqhexxttlhcnbtta.supabase.co/auth/v1/callback
```

---

## 📋 Quick Setup Checklist

### ✅ Step 1: Add Redirect URI in Google Cloud Console

1. Go to: https://console.cloud.google.com/apis/credentials
2. Find your OAuth 2.0 Client ID
3. Click **Edit**
4. Under **Authorized redirect URIs**, add:
   ```
   https://pezvnqhexxttlhcnbtta.supabase.co/auth/v1/callback
   ```
5. Click **Save**

### ✅ Step 2: Configure in Supabase

1. Go to: https://supabase.com/dashboard/project/pezvnqhexxttlhcnbtta/auth/providers
2. Find **Google** in the providers list
3. Click **Enable** (toggle switch)
4. Click **Configure**
5. Enter:
   - **Client ID (for OAuth)**: `YOUR_GOOGLE_CLIENT_ID`
   - **Client Secret (for OAuth)**: `YOUR_GOOGLE_CLIENT_SECRET`
6. Click **Save**

### ✅ Step 3: Test

1. Go to your app: `/login` or `/signup`
2. Click **"Continue with Google"**
3. Sign in with Google
4. You should be redirected to `/dashboard`

---

## 🔒 Security Note

These credentials are sensitive. Make sure:
- ✅ They're only in Supabase Dashboard (not in code)
- ✅ Google Cloud Console has the correct redirect URI
- ✅ Don't commit these to git

---

## 🐛 Troubleshooting

### "Redirect URI mismatch" error

**Fix:**
- Make sure the redirect URI in Google Cloud Console is exactly:
  ```
  https://pezvnqhexxttlhcnbtta.supabase.co/auth/v1/callback
  ```
- No trailing slash
- Must be HTTPS

### "Invalid client" error

**Fix:**
- Double-check Client ID and Secret in Supabase
- Make sure there are no extra spaces
- Copy-paste directly (don't type manually)

### Google sign-in button doesn't work

**Fix:**
- Check Google provider is **Enabled** (not just configured)
- Check browser console for errors
- Verify callback route exists: `/app/auth/callback/route.ts`

