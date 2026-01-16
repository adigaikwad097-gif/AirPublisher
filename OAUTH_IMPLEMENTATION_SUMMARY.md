# OAuth Implementation Summary

## ✅ What's Been Created

### 1. OAuth Routes

**YouTube:**
- `/api/auth/youtube` - Initiates OAuth flow
- `/api/auth/youtube/callback` - Handles callback and stores tokens

**Instagram:**
- `/api/auth/instagram` - Initiates OAuth flow (uses Facebook OAuth)
- `/api/auth/instagram/callback` - Handles callback and stores tokens

**TikTok:**
- `/api/auth/tiktok` - Initiates OAuth flow
- `/api/auth/tiktok/callback` - Handles callback and stores tokens

### 2. Settings Page

- `/settings/connections` - UI for users to connect/disconnect platforms
- Shows connection status for each platform
- Displays account info (channel name, username, etc.)
- Handles expired tokens

### 3. Token Storage

Tokens are stored in:
- `youtube_tokens` table
- `instagram_tokens` table
- `tiktok_tokens` table

Each record includes:
- `user_id` - Links to Supabase Auth user
- `creator_unique_identifier` - Links to creator profile (for easier lookup)
- `access_token` - Platform access token
- `refresh_token` - Token for refreshing (if available)
- `expires_at` - Token expiration timestamp
- Platform-specific fields (channel_id, username, etc.)

---

## 🔧 Setup Required

### 1. Environment Variables

Add to `.env.local`:

```bash
# YouTube OAuth
YOUTUBE_CLIENT_ID=your-client-id
YOUTUBE_CLIENT_SECRET=your-client-secret

# Instagram OAuth (Facebook)
INSTAGRAM_APP_ID=your-app-id
INSTAGRAM_APP_SECRET=your-app-secret

# TikTok OAuth
TIKTOK_CLIENT_KEY=your-client-key
TIKTOK_CLIENT_SECRET=your-client-secret

# App URL (for redirects)
NEXT_PUBLIC_APP_URL=http://localhost:3000  # or your production URL
```

### 2. OAuth App Setup

See `PLATFORM_OAUTH_SETUP.md` for detailed instructions on:
- Creating OAuth apps for each platform
- Setting redirect URIs
- Getting API credentials

### 3. Database Schema

Ensure your token tables have these columns (or add them):

**youtube_tokens:**
- `user_id` (UUID, references auth.users)
- `creator_unique_identifier` (TEXT) - **Add this if missing**
- `google_access_token` (TEXT)
- `google_refresh_token` (TEXT)
- `channel_id` (TEXT)
- `handle` (TEXT)
- `expires_at` (TIMESTAMPTZ)

**instagram_tokens:**
- `user_id` (UUID)
- `creator_unique_identifier` (TEXT) - **Add this if missing**
- `access_token` (TEXT)
- `instagram_id` (TEXT)
- `username` (TEXT)
- `expires_at` (TIMESTAMPTZ)

**tiktok_tokens:**
- `user_id` (UUID)
- `creator_unique_identifier` (TEXT) - **Add this if missing**
- `access_token` (TEXT)
- `refresh_token` (TEXT)
- `tiktok_open_id` (TEXT
- `display_name` (TEXT)
- `expires_at` (TIMESTAMPTZ)

---

## 🚀 How It Works

### User Flow

1. User goes to `/settings/connections`
2. Clicks "Connect YouTube" (or Instagram/TikTok)
3. Redirected to platform OAuth page
4. User authorizes the app
5. Platform redirects back to `/api/auth/[platform]/callback`
6. Callback route:
   - Exchanges authorization code for tokens
   - Gets user info from platform API
   - Stores tokens in database
   - Redirects back to `/settings/connections?success=connected`

### n8n Workflow Flow

1. n8n workflow fetches scheduled videos via `/api/n8n/scheduled-posts`
2. For each video, gets details via `/api/n8n/video-details?video_id=...`
3. Response includes `platform_tokens` with `access_token`
4. n8n uses token to post to platform API
5. Reports status back via `/api/webhooks/n8n/post-status`

---

## 🔄 Token Refresh

Tokens expire and need to be refreshed:

- **YouTube**: Refresh tokens are long-lived, but access tokens expire. Use `google_refresh_token` to get new access token.
- **Instagram**: Long-lived tokens last 60 days. Need to refresh before expiration.
- **TikTok**: Tokens expire. Use `refresh_token` to get new tokens.

**TODO:** Implement token refresh workflows in n8n or as a cron job.

---

## 🧪 Testing

1. Start your Next.js app: `npm run dev`
2. Sign in to your account
3. Go to `/settings/connections`
4. Click "Connect YouTube" (or other platform)
5. Complete OAuth flow
6. Verify token is stored in database
7. Check that connection status shows "Connected"

---

## 📝 Next Steps

1. **Add token refresh logic** - Automatically refresh expired tokens
2. **Add disconnect functionality** - Allow users to revoke access
3. **Token validation** - Check if tokens are still valid before posting
4. **Error handling** - Better error messages for OAuth failures
5. **Multi-account support** - Allow users to connect multiple accounts per platform

---

## 🐛 Troubleshooting

**"OAuth not configured"**
- Add OAuth credentials to `.env.local`
- Restart your Next.js server

**"Token exchange failed"**
- Check OAuth app credentials
- Verify redirect URI matches exactly
- Check platform API status

**"No tokens found"**
- Ensure `creator_unique_identifier` column exists in token tables
- Verify tokens were saved during OAuth callback
- Check database permissions/RLS policies

---

## 📚 Related Files

- `PLATFORM_OAUTH_SETUP.md` - Detailed OAuth app setup guide
- `N8N_INTEGRATION.md` - n8n workflow documentation
- `app/api/auth/[platform]/route.ts` - OAuth initiation routes
- `app/api/auth/[platform]/callback/route.ts` - OAuth callback handlers
- `app/(dashboard)/settings/connections/page.tsx` - Settings UI

