# n8n: Scheduled Posting Automation Workflow

This workflow fetches scheduled posts from Supabase and publishes them to the appropriate platforms.

## Workflow Overview

```
[Cron Trigger] (every 5-15 minutes)
  ↓
[Get Scheduled Posts] (HTTP Request to API)
  ↓
[Split in Batches] (process multiple posts)
  ↓
[Get Video Details & Tokens] (for each post)
  ↓
[Platform Router] (YouTube / Instagram / TikTok)
  ↓
[Post to Platform]
  ↓
[Update Scheduled Post Status] (Supabase)
  ↓
[Update Video URL] (Supabase)
```

## Step-by-Step Setup

### 1. Cron Trigger Node

**Node:** Cron  
**Name:** "Check Scheduled Posts"

**Schedule:**
- **Every:** 5-15 minutes (recommended: 10 minutes)
- This ensures posts are published within 5-15 minutes of their scheduled time

**Configuration:**
```
Rule: Every 10 minutes
```

### 2. HTTP Request: Get Scheduled Posts

**Node:** HTTP Request  
**Name:** "Get Scheduled Posts"

**Method:** GET  
**URL:** `https://airpublisher.vercel.app/api/n8n/scheduled-posts?limit=50&before={{ $now.toISO() }}`

**Headers:**
- `x-n8n-api-key: {{ $env.N8N_API_KEY }}`

**Query Parameters:**
- `limit`: 50 (max posts to fetch per run)
- `before`: `{{ $now.toISO() }}` (current time in ISO format - gets posts due now or earlier)
- **Note:** You can also omit `before` parameter - it defaults to current time

**Expected Response:**
```json
{
  "success": true,
  "count": 3,
  "posts": [
    {
      "scheduled_post_id": "uuid",
      "video_id": "uuid",
      "creator_unique_identifier": "creator-id",
      "platform": "tiktok",
      "scheduled_at": "2024-01-15T14:30:00Z",
      "title": "Video Title",
      "description": "Description",
      "video_url": "https://...",
      "thumbnail_url": "https://..."
    }
  ]
}
```

### 3. Split in Batches (Optional)

**Node:** Split in Batches  
**Name:** "Process Posts in Batches"

**Batch Size:** 5-10 posts per batch

This prevents overwhelming the platform APIs and allows for better error handling.

### 4. Loop/Iterate Over Posts

**Node:** Split Out Items  
**Name:** "Iterate Posts"

Split the `posts` array so each post is processed individually.

### 5. HTTP Request: Get Video Details & Tokens

**Node:** HTTP Request  
**Name:** "Get Video Details & Tokens"

**Method:** GET  
**URL:** `https://airpublisher.vercel.app/api/n8n/video-details?video_id={{ $json.video_id }}`

**Headers:**
- `x-n8n-api-key: {{ $env.N8N_API_KEY }}`

**Expected Response:**
```json
{
  "success": true,
  "video": { ... },
  "platform_tokens": {
    "access_token": "...",  // Automatically refreshed if expired
    "refresh_token": "..."
  }
}
```

**Note:** This endpoint **automatically refreshes tokens** via HTTP if they're expired. No extra steps needed! See `N8N_TOKEN_REFRESH_GUIDE.md` for details.

### 6. IF Node: Platform Router

**Node:** IF  
**Name:** "Route by Platform"

**Conditions:**
- `{{ $json.platform }}` equals `youtube` → YouTube branch
- `{{ $json.platform }}` equals `instagram` → Instagram branch
- `{{ $json.platform }}` equals `tiktok` → TikTok branch

### 7. Mark Scheduled Post as Processing (Before Posting)

**Node:** HTTP Request  
**Name:** "Mark as Processing"

**Method:** POST  
**URL:** `https://airpublisher.vercel.app/api/n8n/scheduled-posts/{{ $json.scheduled_post_id }}/update-status`

**Headers:**
- `x-n8n-api-key: {{ $env.N8N_API_KEY }}`
- `Content-Type: application/json`

**Body:**
```json
{
  "status": "processing"
}
```

**Important:** Do this BEFORE posting to prevent duplicate processing if the workflow runs multiple times.

### 8. Platform-Specific Posting

#### For TikTok:
Reuse your existing TikTok immediate posting workflow steps:

1. **Download Video from Dropbox:**
   - **HTTP Request** node
   - **Method:** GET
   - **URL:** `{{ $json.video_url.replace('&dl=0', '&dl=1') }}`
   - **Response:** Binary video file

2. **Extract File Metadata:**
   - **Code** node (JavaScript)
   - Extract video size, calculate chunks, prepare post_info and source_info
   - See `N8N_IMMEDIATE_POSTING_GUIDE.md` for exact code

3. **Initialize Upload:**
   - **HTTP Request** node
   - **Method:** POST
   - **URL:** `https://open.tiktokapis.com/v2/post/publish/inbox/video/init/`
   - **Headers:**
     ```
     Authorization: Bearer {{ $('Get Video Details & Tokens').item.json.platform_tokens.access_token }}
     Content-Type: application/json
     ```
   - **Body:** Use post_info and source_info from previous step

4. **Upload Video:**
   - **HTTP Request** node
   - **Method:** PUT
   - **URL:** `{{ $('Initialize Upload').item.json.data.upload_url }}`
   - **Headers:**
     ```
     Content-Type: video/mp4
     Content-Range: bytes 0-{{ $('Extract File Metadata').item.json.video_size - 1 }}/{{ $('Extract File Metadata').item.json.video_size }}
     ```
   - **Body:** Binary data from download step

5. **Publish Video:**
   - **HTTP Request** node
   - **Method:** POST
   - **URL:** `https://open.tiktokapis.com/v2/post/publish/status/fetch/`
   - **Headers:**
     ```
     Authorization: Bearer {{ $('Get Video Details & Tokens').item.json.platform_tokens.access_token }}
     Content-Type: application/json
     ```
   - **Body:**
     ```json
     {
       "publish_id": "{{ $('Initialize Upload').item.json.data.publish_id }}"
     }
     ```

6. **Get TikTok Video URL:**
   - Construct URL from video ID: `https://www.tiktok.com/@username/video/{{ $json.video_id }}`
   - Or use TikTok Video List API if you have `video.list` scope

#### For YouTube:
1. **Download Video from Dropbox:**
   - Same as TikTok step 1

2. **Upload to YouTube:**
   - Use YouTube API v3 Upload endpoint
   - **Method:** POST
   - **URL:** `https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status`
   - **Headers:**
     ```
     Authorization: Bearer {{ $('Get Video Details & Tokens').item.json.platform_tokens.access_token }}
     Content-Type: application/json
     ```
   - **Body:**
     ```json
     {
       "snippet": {
         "title": "{{ $json.title }}",
         "description": "{{ $json.description }}"
       },
       "status": {
         "privacyStatus": "public"
       }
     }
     ```
   - Then upload binary data to the resumable upload URL

3. **Get YouTube Video URL:**
   - Extract video ID from upload response
   - Construct URL: `https://www.youtube.com/watch?v={{ $json.id }}`

#### For Instagram:
1. **Download Video from Dropbox:**
   - Same as TikTok step 1

2. **Create Media Container:**
   - **HTTP Request** node
   - **Method:** POST
   - **URL:** `https://graph.facebook.com/v18.0/{{ $('Get Video Details & Tokens').item.json.platform_tokens.instagram_account_id }}/media`
   - **Headers:**
     ```
     Authorization: Bearer {{ $('Get Video Details & Tokens').item.json.platform_tokens.access_token }}
     ```
   - **Body (Form Data):**
     ```
     media_type: VIDEO
     video_url: {{ $json.video_url }}
     caption: {{ $json.description }}
     ```

3. **Publish Media:**
   - **HTTP Request** node
   - **Method:** POST
   - **URL:** `https://graph.facebook.com/v18.0/{{ $('Get Video Details & Tokens').item.json.platform_tokens.instagram_account_id }}/media_publish`
   - **Headers:**
     ```
     Authorization: Bearer {{ $('Get Video Details & Tokens').item.json.platform_tokens.access_token }}
     ```
   - **Body (Form Data):**
     ```
     creation_id: {{ $('Create Media Container').item.json.id }}
     ```

4. **Get Instagram Post URL:**
   - Extract post ID from publish response
   - Construct URL: `https://www.instagram.com/p/{{ $json.id }}/`

### 9. Update Scheduled Post Status (After Posting)

**Node:** HTTP Request  
**Name:** "Update Scheduled Post Status"

**Method:** POST  
**URL:** `https://airpublisher.vercel.app/api/n8n/scheduled-posts/{{ $('Get Scheduled Posts').item.json.scheduled_post_id }}/update-status`

**Headers:**
- `x-n8n-api-key: {{ $env.N8N_API_KEY }}`
- `Content-Type: application/json`

**On Success:**
```json
{
  "status": "posted",
  "posted_at": "{{ $now }}"
}
```

**On Error:**
```json
{
  "status": "failed",
  "error_message": "{{ $json.error || $json.message }}"
}
```

### 10. Update Video Status and Platform URL

**Node:** HTTP Request  
**Name:** "Update Video Status"

**Method:** POST  
**URL:** `https://airpublisher.vercel.app/api/webhooks/n8n/post-status`

**Headers:**
- `x-n8n-api-key: {{ $env.N8N_API_KEY }}`
- `Content-Type: application/json`

**Body:**
```json
{
  "video_id": "{{ $json.video_id }}",
  "status": "posted",
  "platform": "{{ $json.platform }}",
  "youtube_url": "{{ $json.youtube_url }}",
  "instagram_url": "{{ $json.instagram_url }}",
  "tiktok_url": "{{ $json.tiktok_url }}",
  "published_at": "{{ $now }}"
}
```

**Note:** Use the appropriate platform URL field based on which platform was posted to.

## Complete Workflow Structure

```
[Cron Trigger] (every 10 minutes)
  ↓
[Get Scheduled Posts] → GET /api/n8n/scheduled-posts
  ↓
[Split Out Items] → Iterate over posts array
  ↓
[Get Video Details & Tokens] → GET /api/n8n/video-details
  ↓
[IF Error] → [Mark as Failed] → [Stop]
  ↓
[Mark as Processing] → POST /api/n8n/scheduled-posts/{id}/update-status
  ↓
[IF Platform Router]
  ├── TikTok → [Download] → [Initialize] → [Upload] → [Publish] → [Get URL]
  ├── YouTube → [Download] → [Upload] → [Get URL]
  └── Instagram → [Download] → [Create Container] → [Publish] → [Get URL]
  ↓
[IF Posting Success]
  ├── [Update Video Status] → POST /api/webhooks/n8n/post-status
  └── [Update Scheduled Post] → POST /api/n8n/scheduled-posts/{id}/update-status (status: posted)
  ↓
[IF Posting Failed]
  └── [Update Scheduled Post] → POST /api/n8n/scheduled-posts/{id}/update-status (status: failed)
```

## Error Handling

### Mark Failed Posts

If posting fails at any step, update the scheduled post:

**Node:** HTTP Request  
**Name:** "Mark as Failed"

**Method:** POST  
**URL:** `https://airpublisher.vercel.app/api/n8n/scheduled-posts/{{ $json.scheduled_post_id }}/update-status`

**Body:**
```json
{
  "status": "failed",
  "error_message": "{{ $json.error || $json.message || 'Unknown error' }}"
}
```

### Error Handling Flow

1. **Wrap each platform posting step in error handling:**
   - Use n8n's "On Error" workflow feature
   - Or use IF nodes to check for errors after each step

2. **Common Error Scenarios:**
   - **Token expired:** Should trigger token refresh (handled by `/api/n8n/video-details`)
   - **Rate limit:** Mark as failed, can retry later
   - **Invalid video:** Mark as failed with error message
   - **Network error:** Retry up to 3 times, then mark as failed

3. **Retry Logic (Optional):**
   - Add a "Retry" node after marking as failed
   - Check if error is temporary (rate limit, network)
   - Retry up to 3 times with exponential backoff
   - After 3 failures, mark as "failed" permanently

### Error Handling Example

```
[Post to Platform]
  ↓
[IF Error]
  ├── [Check Error Type]
  │   ├── Rate Limit → [Wait 5 min] → [Retry]
  │   ├── Token Expired → [Mark as Failed] (shouldn't happen, tokens auto-refresh)
  │   └── Other → [Mark as Failed]
  └── [Success] → [Continue to Update Status]
```

## Complete n8n Workflow JSON Structure

```json
{
  "name": "Scheduled Post Executor",
  "nodes": [
    {
      "type": "n8n-nodes-base.cron",
      "parameters": {
        "rule": {
          "interval": [{"field": "minutes", "minutesInterval": 10}]
        }
      }
    },
    {
      "type": "n8n-nodes-base.httpRequest",
      "parameters": {
        "method": "GET",
        "url": "https://airpublisher.vercel.app/api/n8n/scheduled-posts",
        "qs": {
          "limit": 50,
          "before": "={{ $now }}"
        }
      }
    },
    {
      "type": "n8n-nodes-base.splitOutItems",
      "parameters": {
        "fieldToSplitOut": "posts"
      }
    }
    // ... rest of workflow
  ]
}
```

## Testing

1. **Create a test scheduled post** in Supabase:
   ```sql
   INSERT INTO air_publisher_scheduled_posts 
   (video_id, creator_unique_identifier, platform, scheduled_at)
   VALUES 
   ('video-uuid', 'creator-id', 'tiktok', NOW() + INTERVAL '1 minute');
   ```

2. **Run the workflow manually** in n8n
3. **Verify** the post is processed and status updated

## Monitoring

- Check n8n execution logs
- Monitor failed posts in Supabase
- Set up alerts for high failure rates
- Track posting success rate

## Notes

- Posts are fetched in order of `scheduled_at` (oldest first)
- Only posts with `status = 'pending'` are fetched
- Posts with `scheduled_at <= now` are considered due
- The workflow processes posts in batches to avoid rate limits

