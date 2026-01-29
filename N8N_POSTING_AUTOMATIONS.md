# n8n Posting Automations Guide

After Dropbox upload automation works, you need to create **3 main posting automations** in n8n:

## 1. Scheduled Post Automation (Most Important)

**Purpose:** Automatically post videos that are scheduled for a future time.

### Workflow Structure

```
┌─────────────────┐
│  Cron Trigger   │ (Runs every 5-15 minutes)
└────────┬────────┘
         │
         ▼
┌─────────────────────────┐
│ HTTP Request            │ GET /api/n8n/scheduled-posts?before={now}
│ (Get scheduled videos)   │ Headers: x-n8n-api-key: {N8N_API_KEY}
└────────┬────────────────┘
         │
         ▼
┌─────────────────────────┐
│ Split In Batches        │ Process videos one by one
│ (Loop through videos)   │
└────────┬────────────────┘
         │
         ▼
┌─────────────────────────┐
│ HTTP Request            │ GET /api/n8n/video-details?video_id={video_id}
│ (Get video + tokens)    │ Headers: x-n8n-api-key: {N8N_API_KEY}
└────────┬────────────────┘
         │
         ▼
┌─────────────────────────┐
│ IF Node                 │ Check platform_target
│ (Route by platform)     │ - youtube → YouTube path
│                         │ - instagram → Instagram path
│                         │ - tiktok → TikTok path
└────────┬────────────────┘
         │
    ┌────┴────┬──────────────┬──────────────┐
    │         │              │              │
    ▼         ▼              ▼              ▼
┌─────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐
│ YouTube │ │Instagram │ │  TikTok  │ │ Internal │
│   Post  │ │   Post   │ │   Post   │ │  (Skip)  │
└────┬────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘
     │           │            │            │
     └───────────┴────────────┴────────────┘
                    │
                    ▼
         ┌─────────────────────────┐
         │ HTTP Request             │ POST /api/webhooks/n8n/post-status
         │ (Report post status)     │ Body: {video_id, status, platform_post_id, ...}
         │                          │ Headers: x-n8n-api-key: {N8N_API_KEY}
         └──────────────────────────┘
```

### n8n Nodes Configuration

#### 1. Cron Trigger
- **Schedule:** Every 5-15 minutes (recommended: 10 minutes)
- **Settings:**
  ```
  Cron Expression: */10 * * * * (every 10 minutes)
  ```

#### 2. HTTP Request - Get Scheduled Posts
- **Method:** GET
- **URL:** `https://airpublisher.vercel.app/api/n8n/scheduled-posts?before={{$now.toISO()}}`
- **Headers:**
  ```
  x-n8n-api-key: {{$env.N8N_API_KEY}}
  Content-Type: application/json
  ```
- **Response:** JSON with `{success: true, count: N, posts: [...]}`

#### 3. Split In Batches (or Loop)
- **Mode:** Process items one by one
- **Batch Size:** 1
- **This loops through each video in the `posts` array

#### 4. HTTP Request - Get Video Details
- **Method:** GET
- **URL:** `https://airpublisher.vercel.app/api/n8n/video-details?video_id={{$json.video_id}}`
- **Headers:**
  ```
  x-n8n-api-key: {{$env.N8N_API_KEY}}
  ```
- **Response:** JSON with video details and platform tokens

#### 5. IF Node - Route by Platform
- **Condition:** `{{$json.platform}}`
- **Routes:**
  - `youtube` → YouTube posting path
  - `instagram` → Instagram posting path
  - `tiktok` → TikTok posting path
  - `internal` → Skip (no posting needed)

#### 6. Platform-Specific Posting Nodes

**For YouTube:**
- Use **YouTube API** node or **HTTP Request** node
- **Endpoint:** `https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status`
- **Method:** POST
- **Headers:**
  ```
  Authorization: Bearer {{$json.platform_tokens.google_access_token}}
  Content-Type: application/json
  ```
- **Body:**
  ```json
  {
    "snippet": {
      "title": "{{$json.video.title}}",
      "description": "{{$json.video.description}}",
      "tags": []
    },
    "status": {
      "privacyStatus": "public"
    }
  }
  ```
- Then upload video file from Dropbox URL

**For Instagram:**
- Use **HTTP Request** node
- **Endpoint:** `https://graph.facebook.com/v18.0/{{$json.platform_tokens.instagram_business_account_id}}/media`
- **Method:** POST
- **Headers:**
  ```
  Authorization: Bearer {{$json.platform_tokens.facebook_access_token}}
  ```
- **Body:**
  ```
  media_type=VIDEO
  video_url={{$json.video.video_url}}
  caption={{$json.video.description}}
  ```
- Then publish the media container

**For TikTok:**
- Use **HTTP Request** node
- **Endpoint:** `https://open.tiktokapis.com/v2/post/publish/inbox/video/init/`
- **Method:** POST
- **Headers:**
  ```
  Authorization: Bearer {{$json.platform_tokens.access_token}}
  Content-Type: application/json
  ```
- **Body:** TikTok-specific format (check TikTok API docs)

#### 7. HTTP Request - Report Post Status
- **Method:** POST
- **URL:** `https://airpublisher.vercel.app/api/webhooks/n8n/post-status`
- **Headers:**
  ```
  x-n8n-api-key: {{$env.N8N_API_KEY}}
  Content-Type: application/json
  ```
- **Body:**
  ```json
  {
    "video_id": "{{$json.video_id}}",
    "status": "posted", // or "failed"
    "platform_post_id": "{{$json.platform_response.id}}",
    "platform_url": "{{$json.platform_response.url}}",
    "error_message": "" // if failed
  }
  ```

---

## 2. Immediate Post Automation (Post Now)

**Purpose:** Post videos immediately when user clicks "Post Now" button.

### Workflow Structure

```
┌─────────────────┐
│  Webhook        │ POST /webhook/post-now
│  (Trigger)      │ Receives: {video_id, platform}
└────────┬────────┘
         │
         ▼
┌─────────────────────────┐
│ HTTP Request            │ GET /api/n8n/video-details?video_id={video_id}
│ (Get video + tokens)    │ Headers: x-n8n-api-key: {N8N_API_KEY}
└────────┬────────────────┘
         │
         ▼
┌─────────────────────────┐
│ IF Node                 │ Route by platform
│ (Route by platform)     │
└────────┬────────────────┘
         │
    ┌────┴────┬──────────────┬──────────────┐
    │         │              │              │
    ▼         ▼              ▼              ▼
┌─────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐
│ YouTube │ │Instagram │ │  TikTok  │ │ Internal │
│   Post  │ │   Post   │ │   Post   │ │  (Skip)  │
└────┬────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘
     │           │            │            │
     └───────────┴────────────┴────────────┘
                    │
                    ▼
         ┌─────────────────────────┐
         │ HTTP Request             │ POST /api/webhooks/n8n/post-status
         │ (Report post status)     │
         └──────────────────────────┘
```

### Alternative: Use Existing Endpoint

You can also use the existing `/api/n8n/post-now` endpoint which handles everything:

```
┌─────────────────┐
│  Webhook        │ POST /webhook/post-now
│  (Trigger)      │ Receives: {video_id, platform}
└────────┬────────┘
         │
         ▼
┌─────────────────────────┐
│ HTTP Request            │ POST /api/n8n/post-now
│ (Post video)            │ Body: {video_id, platform}
│                         │ Headers: x-n8n-api-key: {N8N_API_KEY}
└─────────────────────────┘
```

This endpoint returns all the data n8n needs to post, including refreshed tokens.

---

## 3. Metrics Collection Automation (Optional but Recommended)

**Purpose:** Collect performance metrics (views, likes, comments) from platforms and update leaderboards.

### Workflow Structure

```
┌─────────────────┐
│  Cron Trigger   │ (Runs hourly or daily)
└────────┬────────┘
         │
         ▼
┌─────────────────────────┐
│ Supabase Query          │ Get all posted videos
│ (Get posted videos)     │ WHERE status = 'posted'
└────────┬────────────────┘
         │
         ▼
┌─────────────────────────┐
│ Split In Batches        │ Process videos one by one
│ (Loop through videos)   │
└────────┬────────────────┘
         │
         ▼
┌─────────────────────────┐
│ IF Node                 │ Route by platform
│ (Route by platform)     │
└────────┬────────────────┘
         │
    ┌────┴────┬──────────────┬──────────────┐
    │         │              │              │
    ▼         ▼              ▼              ▼
┌─────────┐ ┌──────────┐ ┌──────────┐
│ YouTube │ │Instagram │ │  TikTok  │
│ Metrics │ │ Metrics  │ │ Metrics  │
└────┬────┘ └────┬─────┘ └────┬─────┘
     │           │            │
     └───────────┴────────────┘
                    │
                    ▼
         ┌─────────────────────────┐
         │ HTTP Request             │ POST /api/webhooks/n8n/metrics
         │ (Send metrics)           │ Body: {video_id, platform, metrics: {...}}
         │                          │ Headers: x-n8n-api-key: {N8N_API_KEY}
         └──────────────────────────┘
                    │
                    ▼
         ┌─────────────────────────┐
         │ HTTP Request            │ POST /api/n8n/leaderboard-calculate
         │ (Recalculate ranks)     │ (After all metrics collected)
         │                         │ Headers: x-n8n-api-key: {N8N_API_KEY}
         └──────────────────────────┘
```

### n8n Nodes Configuration

#### 1. Cron Trigger
- **Schedule:** Every hour or daily
- **Settings:**
  ```
  Cron Expression: 0 * * * * (every hour)
  or
  Cron Expression: 0 0 * * * (daily at midnight)
  ```

#### 2. Supabase Query
- **Query:**
  ```sql
  SELECT * FROM air_publisher_videos 
  WHERE status = 'posted' 
  AND posted_at IS NOT NULL
  ORDER BY posted_at DESC
  ```

#### 3. Platform-Specific Metrics Nodes

**For YouTube:**
- **Endpoint:** `https://www.googleapis.com/youtube/v3/videos?part=statistics&id={{$json.platform_post_id}}`
- **Headers:**
  ```
  Authorization: Bearer {{$json.platform_tokens.google_access_token}}
  ```

**For Instagram:**
- **Endpoint:** `https://graph.facebook.com/v18.0/{{$json.platform_post_id}}?fields=insights.metric(impressions,reach,likes,comments,shares)`
- **Headers:**
  ```
  Authorization: Bearer {{$json.platform_tokens.facebook_access_token}}
  ```

**For TikTok:**
- **Endpoint:** `https://open.tiktokapis.com/v2/video/query/`
- **Headers:**
  ```
  Authorization: Bearer {{$json.platform_tokens.access_token}}
  ```

#### 4. HTTP Request - Send Metrics
- **Method:** POST
- **URL:** `https://airpublisher.vercel.app/api/webhooks/n8n/metrics`
- **Headers:**
  ```
  x-n8n-api-key: {{$env.N8N_API_KEY}}
  Content-Type: application/json
  ```
- **Body:**
  ```json
  {
    "video_id": "{{$json.video_id}}",
    "platform": "{{$json.platform}}",
    "platform_post_id": "{{$json.platform_post_id}}",
    "metrics": {
      "views": {{$json.metrics.views}},
      "likes": {{$json.metrics.likes}},
      "comments": {{$json.metrics.comments}},
      "shares": {{$json.metrics.shares}},
      "estimated_revenue": {{$json.metrics.revenue}}
    }
  }
  ```

---

## Environment Variables Needed in n8n

Make sure these are set in n8n:

```
N8N_API_KEY=your_n8n_api_key
NEXT_PUBLIC_APP_URL=https://airpublisher.vercel.app
```

---

## Testing the Automations

### Test Scheduled Post Automation

1. **Create a test video** in your app
2. **Schedule it** for 2 minutes in the future
3. **Wait for cron to trigger** (or manually trigger the workflow)
4. **Check Vercel logs** to see if:
   - `/api/n8n/scheduled-posts` was called
   - `/api/n8n/video-details` was called
   - `/api/webhooks/n8n/post-status` was called
5. **Verify video was posted** on the platform

### Test Immediate Post Automation

1. **Create a test video** in your app
2. **Click "Post Now"** button
3. **Check if webhook was triggered** in n8n
4. **Verify video was posted** on the platform

### Test Metrics Collection

1. **Wait for a video to be posted** and have some views
2. **Manually trigger metrics workflow** (or wait for cron)
3. **Check Vercel logs** to see if metrics were received
4. **Verify leaderboard was updated**

---

## Priority Order

1. **Scheduled Post Automation** - Most critical, enables scheduled posting
2. **Immediate Post Automation** - Important for "Post Now" feature
3. **Metrics Collection** - Nice to have, can be added later

---

## Common Issues & Solutions

### Issue: Videos not being posted

**Check:**
- Is cron trigger running? (Check n8n execution history)
- Are videos in `scheduled` status with `scheduled_at` set?
- Are platform tokens valid? (Check `/api/n8n/video-details` response)
- Are API calls to platforms succeeding? (Check n8n execution logs)

### Issue: Token expired errors

**Solution:** The `/api/n8n/video-details` endpoint automatically refreshes tokens. Make sure you're calling it before posting.

### Issue: Platform API errors

**Check:**
- Platform API documentation for correct endpoints
- OAuth scopes (need publishing permissions)
- Video format requirements (file size, duration, etc.)

---

## Next Steps

1. **Create Scheduled Post Automation** (start with this)
2. **Test with a scheduled video**
3. **Create Immediate Post Automation** (if needed)
4. **Add Metrics Collection** (optional, can do later)


