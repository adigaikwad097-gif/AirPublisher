# Nango Implementation Guide

## Quick Start

### 1. Install Dependencies

```bash
npm install @nangohq/frontend @nangohq/node
```

### 2. Set Up Nango Account

1. Go to https://www.nango.dev
2. Sign up (free tier: 50 connections)
3. Create a project
4. Get your keys:
   - `NANGO_SECRET_KEY` (server-side)
   - `NANGO_PUBLIC_KEY` (client-side)

### 3. Configure OAuth Integrations in Nango Dashboard

#### YouTube (Google)
- Provider: `google`
- Scopes: `https://www.googleapis.com/auth/youtube.upload https://www.googleapis.com/auth/youtube`
- Add your Google OAuth Client ID and Secret

#### Instagram (Facebook)
- Provider: `facebook`
- Scopes: `instagram_basic,instagram_content_publish,pages_show_list,pages_read_engagement`
- Add your Meta App ID and Secret

#### TikTok
- Provider: `tiktok`
- Scopes: `user.info.basic,video.upload`
- Add your TikTok Client Key and Secret

### 4. Environment Variables

Add to `.env.local`:

```bash
# Nango
NANGO_SECRET_KEY=your_secret_key_here
NANGO_PUBLIC_KEY=your_public_key_here
NEXT_PUBLIC_NANGO_PUBLIC_KEY=your_public_key_here  # For client-side
NANGO_BASE_URL=https://api.nango.dev  # or your self-hosted URL

# Platform OAuth (still needed for Nango config)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
META_APP_ID=your_meta_app_id
META_APP_SECRET=your_meta_app_secret
TIKTOK_CLIENT_KEY=your_tiktok_key
TIKTOK_CLIENT_SECRET=your_tiktok_secret
```

### 5. Set Up Webhook

In Nango Dashboard → Webhooks:
- URL: `https://your-app.com/api/webhooks/nango/sync`
- Events: `connection.created`, `connection.updated`, `connection.deleted`

---

## What I've Built

### ✅ Core Files Created:

1. **`lib/nango/client.ts`** - Nango client initialization
2. **`lib/nango/tokens.ts`** - Token sync from Nango to Supabase
3. **`lib/platforms/youtube.ts`** - YouTube native API (placeholder)
4. **`lib/platforms/instagram.ts`** - Instagram native API
5. **`lib/platforms/tiktok.ts`** - TikTok native API (placeholder)
6. **`app/api/nango/connect/route.ts`** - Generate OAuth URLs
7. **`app/api/webhooks/nango/sync/route.ts`** - Sync tokens from Nango
8. **`components/settings/nango-connect-button.tsx`** - Connect button component

### ⏳ Next Steps:

1. **Update Settings Page** - Replace Ayrshare UI with Nango
2. **Update Posting Logic** - Use native APIs instead of Ayrshare
3. **Update n8n Workflows** - Fetch tokens from Supabase and use native APIs
4. **Test OAuth Flows** - Test each platform connection

---

## How It Works

### User Connects Account:

1. User clicks "Connect YouTube" in settings
2. Nango opens embedded OAuth modal (no popup!)
3. User authorizes
4. Nango stores tokens
5. Webhook fires → syncs to Supabase
6. Connection status updates

### n8n Posts Video:

1. n8n fetches scheduled video
2. Gets tokens from Supabase (synced from Nango)
3. Calls native platform API:
   - YouTube: `videos.insert()` with title, description, thumbnail
   - Instagram: Graph API with caption, media
   - TikTok: Video Upload API with description
4. Updates video status

---

## Benefits Over Ayrshare

✅ **Embedded OAuth** - No popups, happens in your app
✅ **Full Control** - Use native APIs with all features
✅ **Title/Thumbnail Support** - Full YouTube support
✅ **No Vendor Lock-in** - Own your tokens
✅ **Free Tier** - 50 connections free

---

## Testing

1. Install dependencies: `npm install @nangohq/frontend @nangohq/node`
2. Set environment variables
3. Configure Nango dashboard
4. Test connection flow
5. Verify tokens sync to Supabase
6. Test posting via n8n

Ready to continue? Let me know when you've set up Nango and I'll help test!






