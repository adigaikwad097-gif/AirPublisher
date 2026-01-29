# Supabase Auth Providers Setup

## Why You're Being Redirected

The Instagram/YouTube OAuth routes use **Supabase Auth** which requires you to configure the providers in Supabase Dashboard first.

## Setup Steps

### 1. Configure Google Provider (for YouTube)

1. **Go to**: [Supabase Dashboard](https://supabase.com/dashboard)
2. **Select your project**: `pezvnqhexxttlhcnbtta`
3. **Click**: "Authentication" → "Providers" in left sidebar
4. **Find**: "Google" provider
5. **Click**: Toggle to enable it
6. **Add credentials**:
   - **Client ID (for OAuth)**: Your Google OAuth Client ID
   - **Client Secret (for OAuth)**: Your Google OAuth Client Secret
7. **Click**: "Save"

**Note**: These are the same credentials you use for YouTube OAuth. You should have them in your `.env.local`:
- `GOOGLE_CLIENT_ID` or `YOUTUBE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET` or `YOUTUBE_CLIENT_SECRET`

### 2. Configure Facebook Provider (for Instagram)

1. **In Supabase Dashboard**: Authentication → Providers
2. **Find**: "Facebook" provider
3. **Click**: Toggle to enable it
4. **Add credentials**:
   - **Client ID (for OAuth)**: Your Meta App ID
   - **Client Secret (for OAuth)**: Your Meta App Secret
5. **Click**: "Save"

**Note**: These are the same credentials you use for Instagram OAuth:
- `META_APP_ID` or `INSTAGRAM_APP_ID`
- `META_APP_SECRET` or `INSTAGRAM_APP_SECRET`

### 3. Update Redirect URLs

After enabling providers, Supabase will show you redirect URLs. You need to add these to your OAuth apps:

#### Google OAuth Console:
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. APIs & Services → Credentials
3. Edit your OAuth 2.0 Client
4. Add to "Authorized redirect URIs":
   - `https://pezvnqhexxttlhcnbtta.supabase.co/auth/v1/callback`
   - `http://localhost:3000/api/auth/youtube-supabase/callback` (for local dev)

#### Meta App Settings:
1. Go to [Meta Developers](https://developers.facebook.com)
2. Your App → Settings → Basic
3. Add to "Valid OAuth Redirect URIs":
   - `https://pezvnqhexxttlhcnbtta.supabase.co/auth/v1/callback`
   - `http://localhost:3000/api/auth/instagram-supabase/callback` (for local dev)

### 4. Test

1. Go to `/settings/connections`
2. Click "Connect Instagram"
3. Should redirect to Facebook OAuth (via Supabase)
4. Authorize
5. Should redirect back and store tokens

---

## If Still Redirecting

Check terminal logs for:
- `[Instagram OAuth] Auth check:` - Shows if user is found
- Any error messages

The OAuth routes now:
- ✅ Allow access in development mode
- ✅ Don't require creator profile
- ✅ Better error logging

---

## Quick Test

1. **Check if providers are enabled**:
   - Supabase Dashboard → Authentication → Providers
   - Google should be enabled
   - Facebook should be enabled

2. **Try connecting**:
   - Go to `/settings/connections`
   - Click "Connect Instagram"
   - Check terminal for logs

Let me know what you see in the terminal logs!



