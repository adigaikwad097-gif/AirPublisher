# n8n Workflow Setup Guide - Post to Social Platforms

This guide will walk you through creating an n8n workflow to automatically post scheduled videos to YouTube, Instagram, and TikTok.

## Prerequisites

- n8n instance set up and running
- `N8N_API_KEY` configured in your `.env.local`
- Platform OAuth connections completed (YouTube, Instagram, TikTok)
- Videos scheduled in AIR Publisher

## Workflow Overview

The workflow will:
1. **Check for scheduled videos** (runs every 15 minutes)
2. **Get video details and tokens** for each video
3. **Post to the appropriate platform** (YouTube/Instagram/TikTok)
4. **Update video status** in Supabase

---

## Step 1: Create the Workflow

1. Open your n8n instance
2. Click **"Add Workflow"** or **"New Workflow"**
3. Name it: **"Scheduled Post Executor"**

---

## Step 2: Add Cron Trigger

1. Add a **"Cron"** node
2. Configure it to run **every 15 minutes**:
   - **Mode:** Every X
   - **Unit:** Minutes
   - **Value:** 15

This will check for scheduled videos every 15 minutes.

---

## Step 3: Fetch Scheduled Videos

You have two options:

### Option A: Use `/api/n8n/scheduled-posts` (existing)
- Returns scheduled videos due to be posted
- Best for scheduled posts with future dates

### Option B: Use `/api/n8n/pending-posts` (new - recommended)
- Returns both scheduled videos AND immediate posts
- Includes `is_immediate` flag to prioritize immediate posts
- Best for handling both scheduled and "publish now" flows

**Recommended: Use `/api/n8n/pending-posts`**

1. Add an **"HTTP Request"** node
2. Connect it to the Cron node
3. Configure:
   - **Method:** GET
   - **URL:** `https://your-app-url.com/api/n8n/pending-posts?before={{ $now.toISO() }}`
   - **Authentication:** Generic Credential Type
   - **Authentication Method:** Header Auth
   - **Name:** `x-n8n-api-key`
   - **Value:** `{{ $env.N8N_API_KEY }}` or your API key

**Response Format:**
```json
{
  "success": true,
  "count": 2,
  "posts": [
    {
      "video_id": "uuid",
      "creator_unique_identifier": "creator-id",
      "platform": "youtube",
      "video_url": "https://...",
      "title": "Video Title",
      "description": "Video description",
      "thumbnail_url": "https://...",
      "scheduled_at": "2024-01-01T12:00:00Z"
    }
  ]
}
```

---

## Step 4: Loop Through Videos

1. Add a **"Split In Batches"** node or **"Loop Over Items"**
2. Set **Batch Size:** 1 (process one video at a time)
3. This will iterate through each scheduled video

---

## Step 5: Get Video Details and Tokens

For each video, fetch complete details including access tokens:

1. Add another **"HTTP Request"** node
2. Configure:
   - **Method:** GET
   - **URL:** `https://your-app-url.com/api/n8n/video-details?video_id={{ $json.video_id }}`
   - **Authentication:** Same as Step 3 (Header Auth with API key)

**Response Format:**
```json
{
  "success": true,
  "video": {
    "id": "uuid",
    "title": "Video Title",
    "description": "Description",
    "video_url": "https://...",
    "thumbnail_url": "https://...",
    "platform_target": "youtube",
    "creator_unique_identifier": "creator-id"
  },
  "platform_tokens": {
    "access_token": "...",
    "refresh_token": "...",
    "channel_id": "..." // YouTube specific
  },
  "has_tokens": true
}
```

---

## Step 6: Switch by Platform

Add an **"IF"** node or **"Switch"** node to route based on platform:
- **YouTube** → YouTube Upload
- **Instagram** → Instagram Upload
- **TikTok** → TikTok Upload

**Condition:** `{{ $json.video.platform_target }}`

---

## Step 7: Post to YouTube

### Option A: Using YouTube API Node (if available)

1. Add **"YouTube"** node
2. Configure:
   - **Operation:** Upload Video
   - **Title:** `{{ $json.video.title }}`
   - **Description:** `{{ $json.video.description }}`
   - **Video File URL:** `{{ $json.video.video_url }}`
   - **Access Token:** `{{ $json.platform_tokens.access_token }}`

### Option B: Using HTTP Request (Manual API Call)

1. Add **"HTTP Request"** node
2. Configure:
   - **Method:** POST
   - **URL:** `https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status`
   - **Headers:**
     - `Authorization: Bearer {{ $json.platform_tokens.access_token }}`
     - `Content-Type: application/json`
   - **Body (JSON):**
     ```json
     {
       "snippet": {
         "title": "{{ $json.video.title }}",
         "description": "{{ $json.video.description }}",
         "categoryId": "22"
       },
       "status": {
         "privacyStatus": "public"
       }
     }
     ```

**Note:** YouTube upload requires a resumable upload flow (2-step process). See YouTube API docs for details.

---

## Step 8: Post to Instagram

1. Add **"HTTP Request"** node
2. Configure:
   - **Method:** POST
   - **URL:** `https://graph.facebook.com/v18.0/{{ $json.platform_tokens.instagram_business_account_id }}/media`
   - **Headers:**
     - `Authorization: Bearer {{ $json.platform_tokens.access_token }}`
     - `Content-Type: application/json`
   - **Body (JSON):**
     ```json
     {
       "media_type": "VIDEO",
       "video_url": "{{ $json.video.video_url }}",
       "caption": "{{ $json.video.description }}",
       "thumb_offset": 0
     }
     ```
   - This returns a `container_id`, then you need to publish it (see Step 8b)

### Step 8b: Publish Instagram Video

Add another **"HTTP Request"** node:
- **Method:** POST
- **URL:** `https://graph.facebook.com/v18.0/{{ $json.platform_tokens.instagram_business_account_id }}/media_publish`
- **Body:**
  ```json
  {
    "creation_id": "{{ $('Create Container').item.json.id }}"
  }
  ```

---

## Step 9: Post to TikTok

1. Add **"HTTP Request"** node
2. Configure:
   - **Method:** POST
   - **URL:** `https://open.tiktokapis.com/v2/post/publish/video/init/`
   - **Headers:**
     - `Authorization: Bearer {{ $json.platform_tokens.access_token }}`
     - `Content-Type: application/json`
   - **Body (JSON):**
     ```json
     {
       "post_info": {
         "title": "{{ $json.video.title }}",
         "privacy_level": "PUBLIC_TO_EVERYONE",
         "disable_duet": false,
         "disable_comment": false,
         "disable_stitch": false,
         "video_cover_timestamp_ms": 1000
       },
       "source_info": {
         "source": "FILE_UPLOAD",
         "video_url": "{{ $json.video.video_url }}"
       }
     }
     ```

**Note:** TikTok upload is a 2-step process (initialize, then upload). See TikTok API docs for complete flow.

---

## Step 10: Update Video Status

After successful posting, update the video status in Supabase:

1. Add **"HTTP Request"** node
2. Configure:
   - **Method:** POST
   - **URL:** `https://your-app-url.com/api/webhooks/n8n/post-status`
   - **Authentication:** Header Auth (same API key)
   - **Body (JSON):**
     ```json
     {
       "video_id": "{{ $('Get Video Details').item.json.video.id }}",
       "status": "posted",
       "platform_post_id": "{{ $json.id }}",
       "platform_url": "{{ $json.url || $json.permalink }}"
     }
     ```

If posting failed:
```json
{
  "video_id": "{{ $('Get Video Details').item.json.video.id }}",
  "status": "failed",
  "error_message": "{{ $json.error.message }}"
}
```

---

## Complete Workflow Structure

```
[Cron Trigger]
    ↓
[Get Scheduled Posts] → HTTP Request to /api/n8n/scheduled-posts
    ↓
[Split In Batches] → Process one video at a time
    ↓
[Get Video Details] → HTTP Request to /api/n8n/video-details
    ↓
[Switch by Platform]
    ├── YouTube → [Post to YouTube] → [Update Status]
    ├── Instagram → [Create Container] → [Publish] → [Update Status]
    └── TikTok → [Initialize Upload] → [Upload] → [Update Status]
```

---

## Testing the Workflow

### 1. Test with a Single Video

1. Create a test video in AIR Publisher
2. Schedule it for a few minutes in the future
3. Run the workflow manually in n8n
4. Check if it posts successfully

### 2. Check Logs

- n8n execution logs show each step
- Check AIR Publisher logs for API calls
- Verify video status updates in Supabase

### 3. Verify Posting

- Check YouTube/Instagram/TikTok for the posted video
- Verify video status is "posted" in Supabase
- Check `posted_at` timestamp is set

---

## Troubleshooting

### No Videos Found

- Verify video has `status: 'scheduled'`
- Check `scheduled_at` is in the past
- Ensure video has `platform_target` set

### Token Errors

- Check tokens exist in `airpublisher_*_tokens` tables
- Verify tokens are not expired (auto-refresh should handle this)
- Check `creator_unique_identifier` matches

### Platform API Errors

- **YouTube:** Check video format (MP4), file size limits, API quotas
- **Instagram:** Verify Business Account, check video dimensions, caption length
- **TikTok:** Verify app permissions, check video format requirements

### Status Not Updating

- Verify `post-status` webhook is being called
- Check webhook response is successful
- Verify `video_id` in webhook payload matches database

---

## Environment Variables for n8n

In your n8n environment, set:

```
N8N_API_KEY=your_api_key_here
AIR_PUBLISHER_URL=https://your-app-url.com
```

Use these in workflow nodes:
- `{{ $env.N8N_API_KEY }}` for API key
- `{{ $env.AIR_PUBLISHER_URL }}` for base URL

---

## Next Steps

1. Create the workflow in n8n following steps above
2. Test with a single scheduled video
3. Verify it posts correctly to each platform
4. Set up error handling (try/catch nodes)
5. Add notifications for failures (email/Slack)
6. Monitor workflow executions

---

## API Endpoint Reference

### GET /api/n8n/pending-posts (Recommended)
Returns videos that need to be posted (scheduled + immediate posts). This endpoint handles both scheduled videos and videos that should be posted immediately when user clicks "Publish Now".

**Query Params:**
- `limit` (optional): Number of posts (default: 50)
- `before` (optional): ISO timestamp (default: now)

**Response includes `is_immediate` flag** to help n8n prioritize immediate posts.

### GET /api/n8n/scheduled-posts (Alternative)
Returns scheduled videos that need to be posted.

**Query Params:**
- `limit` (optional): Number of posts (default: 50)
- `before` (optional): ISO timestamp (default: now)

### GET /api/n8n/video-details?video_id={id}
Returns video details and refreshed platform tokens.

### POST /api/webhooks/n8n/post-status
Updates video status after posting.

**Body:**
```json
{
  "video_id": "uuid",
  "status": "posted" | "failed",
  "platform_post_id": "id",
  "platform_url": "https://...",
  "error_message": "..." // if failed
}
```

---

Ready to build? Start with Step 1 and work through each step methodically!
