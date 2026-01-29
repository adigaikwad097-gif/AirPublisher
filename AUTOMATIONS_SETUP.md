# Automations Setup Guide

Now that the server is live at `http://93.127.216.83:3003`, let's set up all the required automations using n8n.

## Prerequisites

1. **n8n instance** (self-hosted or cloud)
2. **n8n API key** for webhook authentication
3. **Platform API credentials** (YouTube, Instagram, TikTok) configured in n8n
4. **Live site URL**: `http://93.127.216.83:3003`

## Environment Variables

Make sure these are set in your n8n instance:

```env
N8N_API_KEY=your_n8n_api_key
NEXT_PUBLIC_APP_URL=http://93.127.216.83:3003
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## Required Automations

### 1. Scheduled Post Execution ⏰

**Purpose:** Automatically posts scheduled videos to platforms at their scheduled time.

**Trigger:** Cron (every 5 minutes)

**Workflow Steps:**

1. **Cron Trigger**
   - Schedule: `*/5 * * * *` (every 5 minutes)

2. **HTTP Request - Get Scheduled Posts**
   - Method: `GET`
   - URL: `http://93.127.216.83:3003/api/n8n/scheduled-posts`
   - Headers:
     ```
     Authorization: Bearer YOUR_N8N_API_KEY
     ```
   - Query Params: `before` = current timestamp

3. **Loop/Iterate** over returned videos

4. **For Each Video:**
   - **HTTP Request - Get Video Details**
     - Method: `GET`
     - URL: `http://93.127.216.83:3003/api/n8n/video-details`
     - Query Params: `video_id` = current video ID
     - Headers: `Authorization: Bearer YOUR_N8N_API_KEY`
   
   - **Platform API Node** (YouTube/Instagram/TikTok)
     - Use the access token from video details
     - Post video to platform
   
   - **HTTP Request - Report Status**
     - Method: `POST`
     - URL: `http://93.127.216.83:3003/api/webhooks/n8n/post-status`
     - Headers:
       ```
       Authorization: Bearer YOUR_N8N_API_KEY
       Content-Type: application/json
       ```
     - Body:
       ```json
       {
         "video_id": "{{ $json.video_id }}",
         "platform": "{{ $json.platform }}",
         "status": "posted" | "failed",
         "platform_post_id": "platform_id_if_success",
         "error": "error_message_if_failed"
       }
       ```

---

### 2. Metrics Collection 📊

**Purpose:** Fetches performance metrics from platforms and updates leaderboards.

**Trigger:** Cron (hourly or daily)

**Workflow Steps:**

1. **Cron Trigger**
   - Schedule: `0 * * * *` (every hour) or `0 0 * * *` (daily at midnight)

2. **Supabase Query** (or HTTP Request to your API)
   - Get all videos with `status = 'posted'`
   - Query: `SELECT * FROM air_publisher_videos WHERE status = 'posted'`

3. **Loop/Iterate** over videos

4. **For Each Video:**
   - **Platform API Node** - Get Metrics
     - YouTube Analytics API
     - Instagram Insights API
     - TikTok Analytics API
     - Fetch: views, likes, comments, shares
   
   - **HTTP Request - Send Metrics**
     - Method: `POST`
     - URL: `http://93.127.216.83:3003/api/webhooks/n8n/metrics`
     - Headers:
       ```
       Authorization: Bearer YOUR_N8N_API_KEY
       Content-Type: application/json
       ```
     - Body:
       ```json
       {
         "video_id": "{{ $json.id }}",
         "platform": "{{ $json.platform }}",
         "views": 1234,
         "likes": 56,
         "comments": 12,
         "shares": 8,
         "estimated_revenue": 0.50
       }
       ```

5. **After All Metrics Collected:**
   - **HTTP Request - Calculate Leaderboard**
     - Method: `POST`
     - URL: `http://93.127.216.83:3003/api/n8n/leaderboard-calculate`
     - Headers: `Authorization: Bearer YOUR_N8N_API_KEY`

---

### 3. AI Content Ingestion 🤖

**Purpose:** Receives AI-generated content from AIR Ideas and creates draft videos.

**Trigger:** Webhook

**Workflow Steps:**

1. **Webhook Trigger**
   - Method: `POST`
   - Path: `/air-ideas-content` (or your custom path)
   - Authentication: Optional (add if needed)

2. **HTTP Request - Send to AIR Publisher**
   - Method: `POST`
   - URL: `http://93.127.216.83:3003/api/webhooks/n8n/ai-content`
   - Headers:
     ```
     Authorization: Bearer YOUR_N8N_API_KEY
     Content-Type: application/json
     ```
   - Body: Forward the webhook payload

3. **Optional: Notification**
   - Email/Slack notification to creator
   - "New AI content ready for review"

---

### 4. Video Processing Pipeline 🎬

**Purpose:** Processes uploaded videos (transcode, thumbnail generation).

**Trigger:** Webhook when video uploaded

**Workflow Steps:**

1. **Webhook Trigger** (from upload completion)
   - Or poll `/api/n8n/pending-posts` for videos with `status = 'processing'`

2. **Video Processing**
   - Download video from Supabase Storage
   - Transcode to platform-specific formats
   - Generate thumbnails
   - Upload processed video back to storage

3. **HTTP Request - Report Completion**
   - Method: `POST`
   - URL: `http://93.127.216.83:3003/api/webhooks/n8n/upload-complete`
   - Headers: `Authorization: Bearer YOUR_N8N_API_KEY`
   - Body:
     ```json
     {
       "video_id": "uuid",
       "processed_video_url": "https://...",
       "thumbnail_url": "https://...",
       "status": "ready"
     }
     ```

---

## API Endpoints Reference

### Query Endpoints (n8n calls these)

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/n8n/scheduled-posts` | GET | Get videos due for posting |
| `/api/n8n/video-details?video_id={id}` | GET | Get video + platform tokens |
| `/api/n8n/pending-posts` | GET | Get videos pending processing |
| `/api/n8n/post-now` | POST | Trigger immediate post |
| `/api/n8n/leaderboard-calculate` | POST | Recalculate leaderboard |

### Webhook Endpoints (n8n sends data here)

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/webhooks/n8n/post-video` | POST | Trigger video posting |
| `/api/webhooks/n8n/post-status` | POST | Report post status |
| `/api/webhooks/n8n/metrics` | POST | Send performance metrics |
| `/api/webhooks/n8n/ai-content` | POST | Receive AI-generated content |
| `/api/webhooks/n8n/upload-complete` | POST | Report video processing completion |

**All webhook endpoints require:**
- Header: `Authorization: Bearer YOUR_N8N_API_KEY`

---

## Testing Workflows

### Test Scheduled Posts

1. Create a test video in the dashboard
2. Schedule it for 2 minutes in the future
3. Wait for cron to trigger
4. Check logs in n8n
5. Verify video status updated in database

### Test Metrics Collection

1. Ensure you have posted videos
2. Trigger metrics workflow manually in n8n
3. Check leaderboard updates
4. Verify metrics appear in dashboard

### Test AI Content

1. Send test webhook to n8n AI content endpoint
2. Verify draft video created in database
3. Check creator dashboard for new content

---

## Monitoring

### Check Workflow Status

- n8n Dashboard → Workflows → View execution history
- Check for failed executions
- Review error logs

### Check API Logs

On the server:
```bash
pm2 logs air-publisher | grep "n8n"
```

### Database Checks

```sql
-- Check scheduled posts
SELECT * FROM air_publisher_videos 
WHERE status = 'scheduled' 
AND scheduled_at <= NOW();

-- Check posted videos
SELECT * FROM air_publisher_videos 
WHERE status = 'posted';

-- Check leaderboard
SELECT * FROM air_leaderboards 
ORDER BY score DESC 
LIMIT 10;
```

---

## Next Steps

1. ✅ Set up n8n instance
2. ✅ Create Scheduled Post Execution workflow
3. ✅ Create Metrics Collection workflow
4. ✅ Create AI Content Ingestion workflow
5. ✅ Create Video Processing Pipeline workflow
6. ✅ Test each workflow individually
7. ✅ Monitor workflow executions
8. ✅ Set up alerts for failed workflows

---

## Troubleshooting

### Webhook Authentication Fails
- Verify `N8N_API_KEY` matches in both n8n and Next.js app
- Check Authorization header format: `Bearer YOUR_KEY`

### Videos Not Posting
- Check cron schedule in n8n
- Verify video has `status = 'scheduled'` and `scheduled_at <= NOW()`
- Check platform API tokens are valid
- Review n8n execution logs

### Metrics Not Updating
- Verify platform API credentials
- Check metrics workflow is running
- Ensure videos have `status = 'posted'`
- Check leaderboard calculation is triggered

---

## Support

If workflows fail:
1. Check n8n execution logs
2. Check Next.js API logs: `pm2 logs air-publisher`
3. Verify database state
4. Test API endpoints manually with curl/Postman

