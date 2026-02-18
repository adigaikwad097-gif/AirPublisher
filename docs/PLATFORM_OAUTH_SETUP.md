# Platform OAuth Setup Guide

This guide explains how users connect their YouTube, Instagram, and TikTok accounts to enable automated posting.

## How It Works

```
User clicks "Connect YouTube" 
  ↓
Redirects to YouTube OAuth
  ↓
User authorizes app
  ↓
YouTube redirects back with code
  ↓
Exchange code for access_token + refresh_token
  ↓
Store tokens in youtube_tokens table
  ↓
User can now schedule posts to YouTube
```

---

## Prerequisites

### 1. Create OAuth Apps

You need to create OAuth applications for each platform:

#### YouTube
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable **YouTube Data API v3**
4. Go to **Credentials** → **Create Credentials** → **OAuth 2.0 Client ID**
5. Application type: **Web application**
6. Authorized redirect URIs: `http://localhost:3000/api/auth/youtube/callback` (dev) and your production URL
7. Save **Client ID** and **Client Secret**

#### Instagram
1. Go to [Meta for Developers](https://developers.facebook.com/)
2. Click **"Create App"** or **"My Apps"** → **"Create App"**
3. **Select App Type**: Choose **"Business"** or **"Consumer"**
   - **Recommended: "Business"** (required for Instagram Graph API)
   - If you see "Use Cases", select:
     - ✅ **"Manage Business Account"** or
     - ✅ **"Build Connected Experiences"** or
     - ✅ **"Other"** (then select "Business" as the app type)
4. Fill in App Details:
   - **App Name**: "AIR Publisher" (or your choice)
   - **App Contact Email**: Your email
   - **Business Account** (optional, can skip for now)
5. After creation, go to **"Add Products"** → Find **"Instagram Graph API"** → Click **"Set Up"**
6. Go to **Settings** → **Basic**
   - Note your **App ID** and **App Secret**
7. Go to **Settings** → **Basic** → Scroll to **"Add Platform"**
   - Add **Website** platform
   - **Site URL**: `http://localhost:3000` (or your production URL)
8. Go to **Products** → **Instagram Graph API** → **Basic Display** (or **Graph API Explorer**)
   - Add **OAuth Redirect URIs**: 
     - `http://localhost:3000/api/auth/instagram/callback`
     - `https://your-production-domain.com/api/auth/instagram/callback`
9. **Important**: For Instagram posting, you need:
   - An Instagram Business or Creator account (not personal)
   - A Facebook Page connected to your Instagram account
   - The Instagram account must be linked to your Facebook Page

#### TikTok
1. Go to [TikTok Developers](https://developers.tiktok.com/)
2. Create an app
3. Add **Video Upload** scope
4. Set **Redirect URI**: `http://localhost:3000/api/auth/tiktok/callback`
5. Get **Client Key** and **Client Secret**

### 2. Add to Environment Variables

Add these to your `.env.local`:

```bash
# YouTube OAuth
YOUTUBE_CLIENT_ID=your-youtube-client-id
YOUTUBE_CLIENT_SECRET=your-youtube-client-secret

# Instagram OAuth
INSTAGRAM_APP_ID=your-instagram-app-id
INSTAGRAM_APP_SECRET=your-instagram-app-secret

# TikTok OAuth
TIKTOK_CLIENT_KEY=your-tiktok-client-key
TIKTOK_CLIENT_SECRET=your-tiktok-client-secret
```

---

## Implementation Steps

The OAuth flow will be implemented in these files:

1. **OAuth Initiation Routes** (`/api/auth/[platform]/route.ts`)
   - Generates OAuth URL
   - Redirects user to platform

2. **OAuth Callback Routes** (`/api/auth/[platform]/callback/route.ts`)
   - Receives authorization code
   - Exchanges for tokens
   - Stores in database

3. **Settings/Connections Page** (`/settings/connections`)
   - UI to connect/disconnect platforms
   - Shows connection status

Let me create these now!

