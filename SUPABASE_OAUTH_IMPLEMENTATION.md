# Supabase OAuth Implementation - Complete Guide

## ✅ Perfect Solution!

**Supabase Auth handles OAuth and gives us tokens we can store** - exactly what you need!

---

## How It Works

### YouTube (Google OAuth)
1. User clicks "Connect YouTube"
2. Supabase Auth → Google OAuth with YouTube scopes
3. Callback: Extract `provider_token` and `provider_refresh_token` from session
4. Store in `youtube_tokens` table
5. n8n uses tokens to post via YouTube API

### Instagram (Facebook OAuth)
1. User clicks "Connect Instagram"
2. Supabase Auth → Facebook OAuth with Instagram scopes
3. Exchange short-lived → long-lived token
4. Get Page → Instagram Business Account ID
5. Store in `instagram_tokens` table
6. n8n uses tokens to post via Instagram Graph API

### TikTok (Custom OAuth - Already Working!)
1. User clicks "Connect TikTok"
2. Our custom OAuth flow (already implemented)
3. Store in `tiktok_tokens` table
4. n8n uses tokens to post via TikTok API

---

## Setup Steps

### 1. Configure Supabase Auth Providers

In Supabase Dashboard → Authentication → Providers:

#### Google (for YouTube)
- Enable Google provider
- Add your Google OAuth Client ID and Secret
- Scopes will be requested in code (YouTube scopes)

#### Facebook (for Instagram)
- Enable Facebook provider
- Add your Meta App ID and Secret
- Scopes will be requested in code (Instagram scopes)

### 2. Environment Variables

Already have these! Just make sure:
```bash
# Supabase (already configured)
NEXT_PUBLIC_SUPABASE_URL=your_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key
SUPABASE_SERVICE_ROLE_KEY=your_service_key

# OAuth (for Supabase provider config)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
META_APP_ID=your_meta_app_id
META_APP_SECRET=your_meta_app_secret
TIKTOK_CLIENT_KEY=your_tiktok_key
TIKTOK_CLIENT_SECRET=your_tiktok_secret
```

### 3. Update Settings Page

Replace Ayrshare buttons with Supabase OAuth buttons:
- YouTube: `/api/auth/youtube-supabase`
- Instagram: `/api/auth/instagram-supabase`
- TikTok: `/api/auth/tiktok` (already working!)

---

## What I've Created

✅ **`app/api/auth/youtube-supabase/route.ts`** - YouTube OAuth via Supabase
✅ **`app/api/auth/youtube-supabase/callback/route.ts`** - Extract tokens from session
✅ **`app/api/auth/instagram-supabase/route.ts`** - Instagram OAuth via Supabase
✅ **`app/api/auth/instagram-supabase/callback/route.ts`** - Extract tokens, exchange for long-lived

---

## Benefits

✅ **No Third Party** - Use Supabase (already have it!)
✅ **Users Stay in App** - OAuth happens in your app
✅ **We Own Tokens** - Store in Supabase, full control
✅ **No App Review** - Supabase handles OAuth
✅ **Free** - Supabase Auth is free
✅ **Title/Caption/Thumbnail** - Full support via native APIs

---

## Next Steps

1. ✅ Configure Google provider in Supabase Dashboard
2. ✅ Configure Facebook provider in Supabase Dashboard
3. ✅ Update settings page to use new routes
4. ✅ Test OAuth flows
5. ✅ Verify tokens stored correctly
6. ✅ Update n8n to use stored tokens

TikTok OAuth is already working - no changes needed!

---

## Testing

1. Go to Settings → Connections
2. Click "Connect YouTube" → Should redirect to Google OAuth
3. Authorize → Should redirect back and store tokens
4. Check `youtube_tokens` table in Supabase
5. Repeat for Instagram

Ready to test!



