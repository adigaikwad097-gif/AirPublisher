# Native OAuth Setup Guide

## ✅ What We're Using

We're using **native OAuth flows** directly with each platform:
- **YouTube**: Google OAuth 2.0
- **Instagram**: Facebook OAuth 2.0 (Meta)
- **TikTok**: TikTok OAuth 2.0

**No Supabase Auth providers needed!** We handle OAuth directly and store tokens in Supabase.

---

## 🔧 Environment Variables

Add these to your `.env.local`:

```bash
# YouTube (Google OAuth)
YOUTUBE_CLIENT_ID=367756454563-qr99o53cbgt8ospr56ahodvrc5hh3j9t.apps.googleusercontent.com
YOUTUBE_CLIENT_SECRET=YOUR_YOUTUBE_CLIENT_SECRET

# Instagram (Meta/Facebook OAuth)
META_APP_ID=771396602627794
META_APP_SECRET=67b086a74833746df6a0a7ed0b50f867

# TikTok (if you have credentials)
TIKTOK_CLIENT_KEY=your_tiktok_client_key
TIKTOK_CLIENT_SECRET=your_tiktok_client_secret

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## 📋 OAuth Redirect URIs

### YouTube (Google Cloud Console)

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project
3. **APIs & Services** → **Credentials**
4. Click your OAuth 2.0 Client ID
5. Add to **Authorized redirect URIs**:
   ```
   http://localhost:3000/api/auth/youtube/callback
   https://airpublisher.onrender.com/api/auth/youtube/callback
   ```

### Instagram (Meta App)

1. Go to [Meta Developers](https://developers.facebook.com/apps)
2. Select your app (ID: `771396602627794`)
3. **Settings** → **Basic**
4. Add to **Valid OAuth Redirect URIs**:
   ```
   http://localhost:3000/api/auth/instagram/callback
   https://airpublisher.onrender.com/api/auth/instagram/callback
   ```

### TikTok (TikTok Developer Portal)

1. Go to [TikTok Developer Portal](https://developers.tiktok.com/)
2. Select your app
3. Add to **Redirect URI**:
   ```
   http://localhost:3000/api/auth/tiktok/callback
   https://airpublisher.onrender.com/api/auth/tiktok/callback
   ```

---

## 🚀 How It Works

### 1. User Clicks "Connect"

- User goes to `/settings/connections`
- Clicks "Connect YouTube/Instagram/TikTok"
- Redirects to `/api/auth/{platform}`

### 2. OAuth Initiation

- Route generates OAuth URL with:
  - Client ID
  - Redirect URI
  - Scopes (permissions)
  - State (encrypted user/creator info)
- Redirects user to platform's OAuth page

### 3. User Authorizes

- User logs in and grants permissions
- Platform redirects back to `/api/auth/{platform}/callback` with:
  - Authorization code
  - State (for verification)

### 4. Token Exchange

- Callback route exchanges code for access token
- Gets user info (channel ID, username, etc.)
- Stores tokens in Supabase:
  - `youtube_tokens` table
  - `instagram_tokens` table
  - `tiktok_tokens` table

### 5. Success

- Redirects back to `/settings/connections?success={platform}_connected`
- Shows "Connected" badge

---

## 🔍 Routes

### Initiation Routes
- `/api/auth/youtube` - Start YouTube OAuth
- `/api/auth/instagram` - Start Instagram OAuth
- `/api/auth/tiktok` - Start TikTok OAuth

### Callback Routes
- `/api/auth/youtube/callback` - Handle YouTube callback
- `/api/auth/instagram/callback` - Handle Instagram callback
- `/api/auth/tiktok/callback` - Handle TikTok callback

---

## 🛠️ Development Mode

All OAuth routes have **development mode bypasses**:
- If `NODE_ENV === 'development'`, they won't redirect to login
- Allows testing OAuth flow without full authentication
- Tokens still stored (with `user_id: null` in dev)

---

## ✅ Testing

1. **Start your app**: `npm run dev`
2. **Go to**: `http://localhost:3000/settings/connections`
3. **Click**: "Connect YouTube" or "Connect Instagram"
4. **Authorize** on the platform
5. **Should redirect back** and show "Connected"

---

## 🐛 Troubleshooting

### "OAuth not configured"
- Check `.env.local` has the required variables
- Restart dev server after adding env vars

### "Invalid redirect URI"
- Make sure redirect URI is added to platform's OAuth settings
- Check for typos (http vs https, trailing slashes)

### "No tokens received"
- Check platform OAuth app is approved
- For Instagram: Must be Business/Creator account linked to Facebook Page
- For YouTube: Must have YouTube Data API enabled

### "Token exchange failed"
- Check Client ID/Secret are correct
- Check redirect URI matches exactly
- Check scopes are approved for your app

---

## 📝 Notes

- **Instagram**: Requires Instagram Business/Creator account linked to Facebook Page
- **YouTube**: Requires YouTube Data API v3 enabled in Google Cloud
- **TikTok**: May require app approval/whitelisting
- **Tokens**: Stored securely in Supabase with RLS policies
- **Refresh Tokens**: YouTube and TikTok support refresh tokens for long-term access

---

## 🔐 Security

- State parameter prevents CSRF attacks
- Tokens stored with service role (bypasses RLS for inserts)
- User ownership verified in application layer
- Development mode allows testing without full auth

---

Ready to connect your accounts! 🎉

