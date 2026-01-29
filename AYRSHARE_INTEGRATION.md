# Ayrshare API Integration Guide

## Overview

Ayrshare is a unified social media API that supports 13 platforms:
- YouTube ✅
- Instagram ✅
- TikTok ✅
- Facebook
- X (Twitter)
- LinkedIn
- Pinterest
- Bluesky
- Threads
- Snapchat
- Telegram
- Reddit
- Google Business Profile

**Key Benefits:**
- ✅ Single API for all platforms
- ✅ No need to manage individual OAuth flows
- ✅ Users connect accounts through Ayrshare
- ✅ Simple API key authentication
- ✅ Built-in scheduling, analytics, comments management
- ✅ Much simpler than individual platform OAuth

## How It Works

### Current Approach (What We Built):
```
User → Our OAuth → YouTube/Instagram/TikTok → Store tokens → Post via their APIs
```

### With Ayrshare:
```
User → Ayrshare Dashboard (connects accounts) → We use Ayrshare API to post
```

**Much Simpler!**

---

## Setup Steps

### 1. Create Ayrshare Account

1. Go to https://www.ayrshare.com
2. Sign up for an account
3. Get your API Key from the dashboard

### 2. Connect Social Accounts

Users connect their social accounts through:
- **Ayrshare Dashboard** (users log in and connect accounts)
- **OR** Ayrshare OAuth flow (we can implement this)

### 3. Get API Key

- Go to Ayrshare Dashboard → API Key page
- Copy your API Key
- Add to `.env.local`: `AYRSHARE_API_KEY=your-api-key`

---

## API Overview

### Base URL
```
https://api.ayrshare.com/api
```

### Authentication
```http
Authorization: Bearer YOUR_API_KEY
Content-Type: application/json
```

### Key Endpoints

#### Post Content
```http
POST /post
{
  "post": "Your post text",
  "platforms": ["youtube", "instagram", "tiktok"],
  "mediaUrls": ["https://..."],
  "scheduleDate": "2026-01-20T12:00:00Z" // Optional
}
```

#### Get Profiles (Connected Accounts)
```http
GET /profiles
```

#### Get Analytics
```http
GET /analytics/post/{ayrshare_post_id}
```

#### Delete Post
```http
DELETE /post/{ayrshare_post_id}
```

---

## Implementation Plan

### What We'll Build:

1. **Ayrshare API Client** (`lib/ayrshare/api.ts`)
   - Functions to post content
   - Get profiles
   - Get analytics
   - Delete posts

2. **Post via Ayrshare** (Update video posting logic)
   - When user schedules a video, use Ayrshare API
   - Store Ayrshare post ID in database
   - Update status when posted

3. **User Connection Flow**
   - Option A: Users connect via Ayrshare dashboard (simplest)
   - Option B: Implement Ayrshare OAuth (if needed)

4. **Remove Individual OAuth**
   - Remove YouTube/Instagram/TikTok OAuth routes
   - Keep only Ayrshare integration

---

## Code Structure

```
lib/ayrshare/
  ├── api.ts          # Ayrshare API client functions
  └── types.ts        # TypeScript types

app/api/
  ├── ayrshare/
  │   ├── post/       # Post content endpoint
  │   ├── profiles/   # Get connected profiles
  │   └── analytics/  # Get post analytics
```

---

## Next Steps

1. ✅ Study Ayrshare API (done)
2. ⏳ Create Ayrshare API client
3. ⏳ Update video posting to use Ayrshare
4. ⏳ Update connections page
5. ⏳ Remove individual OAuth code (optional cleanup)

Let me know when you're ready to implement!



