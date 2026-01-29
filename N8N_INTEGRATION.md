it# n8n Integration Guide

AIR Publisher uses **n8n** as the primary automation engine for all backend operations and platform integrations.

## Architecture Overview

```
Next.js App (Frontend)
    ↓ (creates/updates data)
Supabase Database
    ↓ (triggers or scheduled)
n8n Workflows
    ↓ (executes automation)
Platform APIs (YouTube, Instagram, TikTok)
    ↓ (sends data back)
n8n Webhooks → Next.js API
    ↓ (updates database)
Supabase Database
```

## n8n Workflows Required

### 1. Scheduled Post Execution

**Trigger:** Cron (every 5-15 minutes)

**Flow:**
1. Call `GET /api/n8n/scheduled-posts?before={now}` to get due posts
2. For each post:
   - Call `GET /api/n8n/video-details?video_id={id}` to get video + tokens
   - Post to platform API (YouTube/Instagram/TikTok)
   - Call `POST /api/webhooks/n8n/post-status` with result

**n8n Nodes:**
- Cron Trigger
- HTTP Request (GET scheduled posts)
- Loop/Iterate
- HTTP Request (GET video details)
- Platform API nodes (YouTube/Instagram/TikTok)
- HTTP Request (POST status back)

---

### 2. Metrics Collection

**Trigger:** Cron (hourly or daily)

**Flow:**
1. Query Supabase for all posted videos
2. For each video:
   - Fetch metrics from platform API
   - Call `POST /api/webhooks/n8n/metrics` with metrics
3. After all metrics collected:
   - Call `POST /api/n8n/leaderboard-calculate` to recalculate ranks

**n8n Nodes:**
- Cron Trigger
- Supabase Query (get posted videos)
- Loop/Iterate
- Platform API nodes (get metrics)
- HTTP Request (POST metrics)
- HTTP Request (POST leaderboard calculate)

---

### 3. AI Content Ingestion

**Trigger:** Webhook from AIR Ideas

**Flow:**
1. Receive webhook from AIR Ideas with generated content
2. Call `POST /api/webhooks/n8n/ai-content` with content data
3. (Optional) Notify creator via email/SMS

**n8n Nodes:**
- Webhook Trigger (from AIR Ideas)
- HTTP Request (POST to AIR Publisher)
- (Optional) Email/SMS notification

---

### 4. Video Processing Pipeline

**Trigger:** Webhook when video uploaded

**Flow:**
1. Receive video file from upload
2. Transcode video (if needed)
3. Generate thumbnail
4. Upload to Supabase Storage
5. Update video record with URLs

**n8n Nodes:**
- Webhook Trigger
- Video processing node (FFmpeg)
- Supabase Storage upload
- HTTP Request (update video)

---

## API Endpoints for n8n

### Query Endpoints (n8n calls these)

#### `GET /api/n8n/scheduled-posts`
Get videos that need to be posted.

**Query Params:**
- `limit` (optional): Number of posts (default: 50)
- `before` (optional): ISO timestamp (default: now)

**Response:**
```json
{
  "success": true,
  "count": 5,
  "posts": [
    {
      "video_id": "uuid",
      "creator_unique_identifier": "creator-id",
      "platform": "youtube",
      "video_url": "https://...",
      "title": "Video Title",
      "description": "Description",
      "thumbnail_url": "https://...",
      "scheduled_at": "2024-01-01T12:00:00Z"
    }
  ]
}
```

#### `GET /api/n8n/video-details?video_id={id}`
Get video details and platform tokens.

**Response:**
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
    "refresh_token": "..."
  },
  "has_tokens": true
}
```

---

### Webhook Endpoints (n8n sends data here)

#### `POST /api/webhooks/n8n/post-video`
Trigger video posting (alternative flow - n8n can call this to get video data).

**Request Body:**
```json
{
  "video_id": "uuid",
  "platform": "youtube",
  "video_url": "https://...",
  "title": "Video Title",
  "description": "Description",
  "thumbnail_url": "https://..."
}
```

**Response:**
```json
{
  "success": true,
  "video": { ... },
  "platform_tokens": { ... },
  "platform": "youtube"
}
```

#### `POST /api/webhooks/n8n/post-status`
Report post status after attempting to post.

**Request Body:**
```json
{
  "video_id": "uuid",
  "status": "posted" | "failed",
  "platform_post_id": "platform-id",
  "platform_url": "https://...",
  "error_message": "..." // if failed
}
```

#### `POST /api/webhooks/n8n/metrics`
Send performance metrics for a video.

**Request Body:**
```json
{
  "video_id": "uuid",
  "platform": "youtube",
  "platform_post_id": "platform-id",
  "metrics": {
    "views": 1000,
    "likes": 50,
    "comments": 10,
    "shares": 5,
    "estimated_revenue": 10.50
  }
}
```

#### `POST /api/webhooks/n8n/ai-content`
Receive AI-generated content from AIR Ideas.

**Request Body:**
```json
{
  "creator_unique_identifier": "creator-id",
  "title": "Generated Title",
  "description": "Generated description",
  "video_url": "https://...",
  "thumbnail_url": "https://...",
  "platform_suggestions": ["youtube", "instagram"]
}
```

#### `POST /api/n8n/leaderboard-calculate`
Trigger leaderboard rank recalculation.

**Request Body:** (empty)

**Response:**
```json
{
  "success": true,
  "message": "Leaderboard ranks recalculated"
}
```

---

## Authentication

All n8n endpoints require authentication via one of:

1. **API Key Header:**
   ```
   x-n8n-api-key: your_api_key
   ```

2. **Bearer Token:**
   ```
   Authorization: Bearer your_api_key
   ```

Set `N8N_API_KEY` in your `.env.local` file.

---

## n8n Setup Steps

### 1. Create API Credentials

In your n8n instance:
1. Go to Settings → API
2. Create a new API key
3. Add it to your `.env.local` as `N8N_API_KEY`

### 2. Create Workflows

Import or create the following workflows:

1. **Scheduled Post Executor** (Cron → HTTP → Platform APIs → HTTP)
2. **Metrics Collector** (Cron → Supabase → Platform APIs → HTTP)
3. **AI Content Receiver** (Webhook → HTTP → Optional Notification)
4. **Video Processor** (Webhook → FFmpeg → Storage → HTTP)

### 3. Configure Platform APIs

For each platform (YouTube, Instagram, TikTok):
1. Set up OAuth credentials
2. Store tokens in respective token tables
3. Configure n8n nodes with credentials

### 4. Set Up Webhooks

In n8n:
1. Create webhook nodes for receiving data
2. Configure webhook URLs to point to your Next.js app
3. Add authentication headers

---

## Example n8n Workflow: Scheduled Post

```json
{
  "name": "Execute Scheduled Posts",
  "nodes": [
    {
      "type": "n8n-nodes-base.cron",
      "parameters": {
        "rule": {
          "interval": [{"field": "minutes", "minutesInterval": 15}]
        }
      }
    },
    {
      "type": "n8n-nodes-base.httpRequest",
      "parameters": {
        "method": "GET",
        "url": "https://your-app.com/api/n8n/scheduled-posts",
        "authentication": "genericCredentialType",
        "genericAuthType": "httpHeaderAuth",
        "sendHeaders": true,
        "headerParameters": {
          "parameters": [
            {
              "name": "x-n8n-api-key",
              "value": "={{ $env.N8N_API_KEY }}"
            }
          ]
        }
      }
    },
    {
      "type": "n8n-nodes-base.splitInBatches",
      "parameters": {
        "batchSize": 10
      }
    },
    {
      "type": "n8n-nodes-base.httpRequest",
      "parameters": {
        "method": "GET",
        "url": "https://your-app.com/api/n8n/video-details",
        "qs": {
          "video_id": "={{ $json.posts[0].video_id }}"
        }
      }
    },
    {
      "type": "n8n-nodes-base.youtube",
      "parameters": {
        "operation": "upload",
        "videoTitle": "={{ $json.video.title }}",
        "videoDescription": "={{ $json.video.description }}",
        "videoFileUrl": "={{ $json.video.video_url }}"
      }
    },
    {
      "type": "n8n-nodes-base.httpRequest",
      "parameters": {
        "method": "POST",
        "url": "https://your-app.com/api/webhooks/n8n/post-status",
        "body": {
          "video_id": "={{ $('Get Video Details').item.json.video.id }}",
          "status": "posted",
          "platform_post_id": "={{ $json.id }}",
          "platform_url": "={{ $json.url }}"
        }
      }
    }
  ]
}
```

---

## Testing

### Test Webhook Endpoints

Use curl or Postman to test:

```bash
# Test post-status webhook
curl -X POST https://your-app.com/api/webhooks/n8n/post-status \
  -H "x-n8n-api-key: your_api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "video_id": "test-uuid",
    "status": "posted",
    "platform_post_id": "test-id",
    "platform_url": "https://youtube.com/watch?v=test"
  }'
```

### Test Query Endpoints

```bash
# Test scheduled-posts query
curl -X GET "https://your-app.com/api/n8n/scheduled-posts?limit=10" \
  -H "x-n8n-api-key: your_api_key"
```

---

## Troubleshooting

### Webhook Authentication Fails
- Check `N8N_API_KEY` is set correctly
- Verify header name matches (`x-n8n-api-key` or `Authorization: Bearer`)
- Check n8n workflow is sending the header

### Video Not Posting
- Verify video has `status: 'scheduled'` and `scheduled_at` is in the past
- Check platform tokens exist in database
- Verify n8n workflow is running on schedule
- Check n8n execution logs

### Metrics Not Updating
- Verify metrics webhook is being called
- Check metrics payload format matches expected schema
- Verify leaderboard calculation is running after metrics collection

---

## Security Best Practices

1. **Use HTTPS** for all webhook endpoints
2. **Rotate API keys** regularly
3. **Implement rate limiting** on webhook endpoints
4. **Validate payloads** before processing
5. **Log all webhook calls** for auditing
6. **Use HMAC signatures** for critical webhooks (optional)

---

## Next Steps

1. Set up n8n instance (self-hosted or cloud)
2. Create the workflows described above
3. Configure platform API credentials
4. Test each workflow individually
5. Set up monitoring and alerts
6. Document any custom workflows

For questions or issues, refer to the main documentation or contact the development team.



