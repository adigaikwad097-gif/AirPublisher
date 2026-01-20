# Nango Integration Setup Guide

## What is Nango?

Nango is an OAuth broker that handles:
- OAuth flows for 100+ providers (Google/YouTube, Facebook/Instagram, TikTok)
- Token storage and automatic refresh
- Embedded OAuth UI (no popups!)
- Webhooks for token updates

## Setup Steps

### 1. Create Nango Account

1. Go to https://www.nango.dev
2. Sign up for free account (50 connections free)
3. Create a new project
4. Get your API keys:
   - `NANGO_SECRET_KEY` (server-side)
   - `NANGO_PUBLIC_KEY` (client-side)

### 2. Configure OAuth Integrations

In Nango dashboard, configure:

#### YouTube (Google)
- Provider: `google`
- Scopes: `https://www.googleapis.com/auth/youtube.upload https://www.googleapis.com/auth/youtube`
- Client ID: Your Google OAuth Client ID
- Client Secret: Your Google OAuth Client Secret

#### Instagram (Facebook)
- Provider: `facebook`
- Scopes: `instagram_basic,instagram_content_publish,pages_show_list,pages_read_engagement`
- Client ID: Your Meta App ID
- Client Secret: Your Meta App Secret

#### TikTok
- Provider: `tiktok`
- Scopes: `user.info.basic,video.upload`
- Client ID: Your TikTok Client Key
- Client Secret: Your TikTok Client Secret

### 3. Environment Variables

Add to `.env.local`:
```bash
# Nango
NANGO_SECRET_KEY=your_secret_key
NANGO_PUBLIC_KEY=your_public_key
NANGO_BASE_URL=https://api.nango.dev  # or your self-hosted URL

# Platform OAuth (still needed for Nango config)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
META_APP_ID=your_meta_app_id
META_APP_SECRET=your_meta_app_secret
TIKTOK_CLIENT_KEY=your_tiktok_key
TIKTOK_CLIENT_SECRET=your_tiktok_secret
```

### 4. Webhook Setup

Configure Nango webhook to sync tokens to Supabase:
- Webhook URL: `https://your-app.com/api/webhooks/nango/sync`
- Events: `connection.created`, `connection.updated`, `connection.deleted`

---

## Architecture

```
User clicks "Connect YouTube" in your app
    ↓
Nango embedded OAuth (in your app, no popup!)
    ↓
User authorizes
    ↓
Nango stores tokens + webhook fires
    ↓
Webhook syncs tokens to Supabase
    ↓
n8n uses tokens from Supabase to post
```

---

## Next Steps

1. Install Nango SDK
2. Create Nango client
3. Update OAuth flows
4. Create native API posting functions
5. Update settings page
6. Set up webhook handler

Let's start implementing!


