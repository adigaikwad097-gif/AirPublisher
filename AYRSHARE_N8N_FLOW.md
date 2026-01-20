# Ayrshare + n8n Upload Flow Architecture

## Overview

**Ayrshare handles OAuth and token storage. n8n handles the automation workflow.**

## The Complete Flow

### Step 1: User Connects Social Accounts (One-Time Setup)

1. **User goes to Settings** → `/settings/connections-ayrshare`
2. **Clicks "Go to Ayrshare Dashboard"** → Opens Ayrshare's website
3. **User connects YouTube, Instagram, TikTok** in Ayrshare's dashboard
4. **Ayrshare stores the OAuth tokens** (we don't store them)
5. **We create/get user's Ayrshare profile** and store:
   - `ayrshare_profile_id` (Ayrshare's profile ID for this user)
   - `ayrshare_profile_key` (used to post on their behalf)
   - Stored in our `ayrshare_profiles` table

**Key Point:** Ayrshare manages all OAuth tokens. We just store the profileKey to identify which user's accounts to use.

---

### Step 2: User Uploads Video (Current Flow)

1. **User uploads video** via `/upload` page
2. **Video metadata saved** to `air_publisher_videos` table:
   - `title`, `description`, `platform_target`, `status = 'draft'`
3. **Video file** (currently not uploaded - TODO)

---

### Step 3: n8n Workflow (Automated)

**n8n runs on a schedule** (e.g., every 5 minutes) and:

#### 3a. Fetch Scheduled Videos
```
GET /api/n8n/scheduled-posts
```
- Returns videos where `status = 'scheduled'` and `scheduled_at <= now()`
- Includes `creator_unique_identifier` for each video

#### 3b. For Each Video:
1. **Get user's Ayrshare profile** from `ayrshare_profiles` table
   - Lookup by `creator_unique_identifier`
   - Get `ayrshare_profile_key`

2. **Post via Ayrshare API**:
   ```
   POST https://api.ayrshare.com/api/post
   Headers:
     Authorization: Bearer YOUR_AYRSHARE_API_KEY
     Profile-Key: user's_profile_key  ← This tells Ayrshare which user's accounts to use
   Body:
     {
       "post": "Video description",
       "platforms": ["youtube", "instagram", "tiktok"],
       "mediaUrls": ["https://your-storage.com/video.mp4"]
     }
   ```

3. **Ayrshare handles the actual posting**:
   - Uses stored OAuth tokens (managed by Ayrshare)
   - Posts to YouTube, Instagram, TikTok
   - Returns post IDs

4. **Update video status** via webhook:
   ```
   POST /api/webhooks/n8n/post-status
   Body:
     {
       "video_id": "...",
       "status": "posted",
       "ayrshare_post_id": "...",
       "platform_post_ids": {...}
     }
   ```

---

## Architecture Diagram

```
┌─────────────┐
│   User      │
│  (Browser)  │
└──────┬──────┘
       │
       │ 1. Connect accounts
       ▼
┌─────────────────────┐
│  Ayrshare Dashboard │ ← User connects YouTube/Instagram/TikTok here
│  (OAuth handled)    │ ← Ayrshare stores tokens
└─────────────────────┘
       │
       │ 2. Store profileKey
       ▼
┌─────────────────────┐
│   Supabase          │
│  ayrshare_profiles  │ ← We store: profileId, profileKey
│  air_publisher_     │ ← We store: video metadata
│    videos           │
└──────┬──────────────┘
       │
       │ 3. n8n fetches scheduled videos
       ▼
┌─────────────────────┐
│   n8n Workflow      │
│  (Automated)        │
└──────┬──────────────┘
       │
       │ 4. Post via Ayrshare API
       ▼
┌─────────────────────┐
│  Ayrshare API       │ ← Uses profileKey to identify user
│  (Uses stored       │ ← Uses Ayrshare's stored OAuth tokens
│   OAuth tokens)     │
└──────┬──────────────┘
       │
       │ 5. Posts to platforms
       ▼
┌──────────┬──────────┬──────────┐
│ YouTube  │ Instagram │  TikTok  │
└──────────┴──────────┴──────────┘
```

---

## What We Store vs What Ayrshare Stores

### We Store (in Supabase):
- ✅ `ayrshare_profile_id` - Ayrshare's profile ID
- ✅ `ayrshare_profile_key` - Used to post on user's behalf
- ✅ Video metadata (title, description, scheduled_at, etc.)
- ✅ Video file URLs (after upload to Supabase Storage)

### Ayrshare Stores:
- ✅ YouTube OAuth tokens
- ✅ Instagram OAuth tokens
- ✅ TikTok OAuth tokens
- ✅ Token refresh logic
- ✅ Platform-specific account info

**We don't store platform tokens** - Ayrshare handles all of that!

---

## n8n Workflow Steps

### Workflow: "Scheduled Post Execution"

1. **Cron Trigger** (every 5 minutes)

2. **HTTP Request: Fetch Scheduled Videos**
   ```
   GET https://your-app.com/api/n8n/scheduled-posts
   Headers:
     Authorization: Bearer YOUR_N8N_API_KEY
   ```

3. **For Each Video** (Loop):
   
   a. **Get Ayrshare Profile**
      - Query Supabase: `SELECT * FROM ayrshare_profiles WHERE creator_unique_identifier = ?`
      - Get `ayrshare_profile_key`
   
   b. **Post via Ayrshare**
      ```
      POST https://api.ayrshare.com/api/post
      Headers:
        Authorization: Bearer YOUR_AYRSHARE_API_KEY
        Profile-Key: {profileKey}
      Body:
        {
          "post": "{video.description}",
          "platforms": ["{video.platform_target}"],
          "mediaUrls": ["{video.video_url}"]
        }
      ```
   
   c. **Update Video Status**
      ```
      POST https://your-app.com/api/webhooks/n8n/post-status
      Headers:
        Authorization: Bearer YOUR_N8N_API_KEY
      Body:
        {
          "video_id": "{video.id}",
          "status": "posted",
          "ayrshare_post_id": "{response.id}"
        }
      ```

---

## Current Implementation Status

### ✅ Already Implemented:
- Ayrshare API client (`lib/ayrshare/api.ts`)
- Ayrshare user profile management (`lib/ayrshare/user.ts`)
- API route for posting (`/api/ayrshare/post`)
- API route for fetching profiles (`/api/ayrshare/profiles`)
- Settings page with Ayrshare connection UI
- Database table for Ayrshare profiles

### ⏳ TODO:
- [ ] Video file upload to Supabase Storage
- [ ] n8n workflow setup (documented in `N8N_WORKFLOW_SETUP.md`)
- [ ] Webhook endpoint for post status updates
- [ ] Error handling and retry logic in n8n

---

## Key Points

1. **Ayrshare = Token Manager**: Handles all OAuth, token storage, and refresh
2. **We = Metadata Manager**: Store video info and Ayrshare profileKeys
3. **n8n = Automation Engine**: Fetches scheduled videos and calls Ayrshare API
4. **No Direct Platform APIs**: We never directly call YouTube/Instagram/TikTok APIs

---

## Questions?

- **Q: Do we need a UI for Ayrshare?**
  - A: Yes, but it's already built! Users go to `/settings/connections-ayrshare` and click "Go to Ayrshare Dashboard" to connect accounts.

- **Q: Where are tokens stored?**
  - A: Ayrshare stores them. We only store the `profileKey` to identify which user's accounts to use.

- **Q: How does n8n know which user's accounts to use?**
  - A: n8n looks up the `creator_unique_identifier` → gets `ayrshare_profile_key` → uses that in the Ayrshare API call.

- **Q: What if user disconnects an account in Ayrshare?**
  - A: Ayrshare will return an error when we try to post. n8n should handle this and mark the video as failed, then notify the user.


