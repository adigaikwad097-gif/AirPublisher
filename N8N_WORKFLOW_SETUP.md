# n8n Workflow Setup Guide - Step by Step

This guide will walk you through creating all the n8n workflows needed for AIR Publisher.

## Prerequisites

1. **n8n instance running** (cloud or self-hosted)
2. **Your Next.js app URL** (e.g., `http://localhost:3000` or your production URL)
3. **n8n Webhook Secret** (set in `.env.local` as `N8N_WEBHOOK_SECRET`)

---

## Workflow 1: Scheduled Post Execution

This workflow runs every 15 minutes and posts scheduled videos to YouTube, Instagram, or TikTok.

### Step 1: Create New Workflow

1. In n8n, click **"Add Workflow"** or **"New Workflow"**
2. Name it: `AIR Publisher - Scheduled Post Execution`

### Step 2: Add Cron Trigger

1. Click **"Add Node"** or drag from the node panel
2. Search for **"Cron"** and add it
3. Configure:
   - **Trigger Times**: `Every 15 minutes`
   - Or use Cron expression: `*/15 * * * *` (every 15 minutes)

### Step 3: Add HTTP Request Node (Get Scheduled Posts)

1. Add **"HTTP Request"** node
2. Connect it after the Cron node
3. Configure:
   - **Method**: `GET`
   - **URL**: `{{ $env.NEXTJS_URL }}/api/n8n/scheduled-posts?before={{ $now.toISO() }}`
     - Replace `{{ $env.NEXTJS_URL }}` with your actual URL (e.g., `http://localhost:3000`)
   - **Authentication**: `Generic Credential Type`
   - **Credential Type**: `Header Auth`
   - **Name**: `X-N8N-Webhook-Secret`
   - **Value**: `{{ $env.N8N_WEBHOOK_SECRET }}`
     - Or hardcode your secret from `.env.local`

**Alternative (if environment variables don't work):**
- **URL**: `http://localhost:3000/api/n8n/scheduled-posts?before={{ $now.toISO() }}`
- Add **Header**:
  - **Name**: `X-N8N-Webhook-Secret`
  - **Value**: `your-secret-key-here` (from `.env.local`)

### Step 4: Add Split In Batches Node

1. Add **"Split In Batches"** node
2. Connect it after HTTP Request
3. Configure:
   - **Field to Split Out**: `posts` (from the response)
   - **Batch Size**: `10` (process 10 videos at a time)

### Step 5: Add Loop Over Items Node

1. Add **"Loop Over Items"** node (or use "For Each" node)
2. Connect it after Split In Batches
3. This will iterate through each scheduled video

### Step 6: Add HTTP Request Node (Get Video Details)

1. Add another **"HTTP Request"** node inside the loop
2. Configure:
   - **Method**: `GET`
   - **URL**: `{{ $env.NEXTJS_URL }}/api/n8n/video-details?video_id={{ $json.video_id }}`
   - **Authentication**: Same as Step 3 (Header Auth with `X-N8N-Webhook-Secret`)

### Step 7: Add Switch Node (Route by Platform)

1. Add **"Switch"** node
2. Connect it after Get Video Details
3. Configure:
   - **Mode**: `Rules`
   - **Value**: `{{ $json.body.platform }}` or `{{ $json.body.video.platform_target }}`
   - **Rules**:
     - **Rule 1**: `youtube` → Connect to YouTube node
     - **Rule 2**: `instagram` → Connect to Instagram node
     - **Rule 3**: `tiktok` → Connect to TikTok node
     - **Rule 4**: `internal` → Skip (no posting needed)

### Step 8: Add YouTube Upload Node

1. Add **"YouTube"** node (or "HTTP Request" if no YouTube node)
2. Configure for YouTube Data API v3:
   - **Operation**: `Upload a Video`
   - **Title**: `{{ $json.body.video.title }}`
   - **Description**: `{{ $json.body.video.description }}`
   - **Video File**: `{{ $json.body.video.video_url }}` (or download first)
   - **Thumbnail**: `{{ $json.body.video.thumbnail_url }}`
   - **Access Token**: `{{ $json.body.platform_tokens.access_token }}`

**Note**: You may need to:
- Download the video file first using HTTP Request
- Upload it to YouTube using their API
- Handle OAuth token refresh if needed

### Step 9: Add Instagram Upload Node

1. Add **"Instagram"** node or HTTP Request
2. Configure for Instagram Graph API:
   - **Operation**: `Create Media Container` then `Publish Media`
   - **Media Type**: `VIDEO`
   - **Video URL**: `{{ $json.body.video.video_url }}`
   - **Caption**: `{{ $json.body.video.title }}\n\n{{ $json.body.video.description }}`
   - **Access Token**: `{{ $json.body.platform_tokens.access_token }}`

### Step 10: Add TikTok Upload Node

1. Add **"TikTok"** node or HTTP Request
2. Configure for TikTok API:
   - **Operation**: `Upload Video`
   - **Video File**: Download from `{{ $json.body.video.video_url }}`
   - **Title**: `{{ $json.body.video.title }}`
   - **Access Token**: `{{ $json.body.platform_tokens.access_token }}`

### Step 11: Add HTTP Request Node (Report Status)

1. Add **"HTTP Request"** node after each platform node
2. Configure:
   - **Method**: `POST`
   - **URL**: `{{ $env.NEXTJS_URL }}/api/webhooks/n8n/post-status`
   - **Authentication**: Same Header Auth
   - **Body** (JSON):
   ```json
   {
     "video_id": "{{ $json.video_id }}",
     "status": "posted",
     "platform_post_id": "{{ $json.id }}",
     "posted_at": "{{ $now.toISO() }}",
     "platform": "{{ $json.platform }}"
   }
   ```

### Step 12: Add Error Handling

1. Add **"On Error"** node or use Try-Catch
2. Configure to send error status:
   - **HTTP Request** to `/api/webhooks/n8n/post-status`
   - **Body**: 
   ```json
   {
     "video_id": "{{ $json.video_id }}",
     "status": "failed",
     "error_message": "{{ $json.error.message }}"
   }
   ```

### Step 13: Activate Workflow

1. Click **"Active"** toggle in the top right
2. Save the workflow
3. Test by manually executing it

---

## Workflow 2: Metrics Collection

This workflow collects performance metrics from platforms and updates leaderboards.

### Step 1: Create New Workflow

1. Name: `AIR Publisher - Metrics Collection`

### Step 2: Add Cron Trigger

1. **Trigger**: `Every hour` or `Daily at 2 AM`
2. Cron: `0 2 * * *` (daily at 2 AM)

### Step 3: Query Supabase for Posted Videos

1. Add **"Supabase"** node or **"HTTP Request"**
2. Query all videos with `status = 'posted'`
3. Or use HTTP Request to your Supabase REST API

### Step 4: Loop Through Videos

1. Add **"Loop Over Items"** node
2. For each video, fetch metrics from platform API

### Step 5: Fetch Metrics by Platform

1. Add **Switch** node to route by platform
2. For each platform:
   - **YouTube**: Get video stats via YouTube Data API
   - **Instagram**: Get post insights via Instagram Graph API
   - **TikTok**: Get video stats via TikTok API

### Step 6: Send Metrics to Next.js

1. Add **HTTP Request** node
2. **POST** to `/api/webhooks/n8n/metrics`
3. **Body**:
   ```json
   {
     "video_id": "{{ $json.video_id }}",
     "platform": "youtube",
     "views": 1000,
     "likes": 50,
     "comments": 10,
     "estimated_revenue": 5.00
   }
   ```

### Step 7: Recalculate Leaderboard

1. After all metrics sent, add **HTTP Request** node
2. **POST** to `/api/n8n/leaderboard-calculate`
3. This recalculates all ranks

---

## Workflow 3: AI Content Ingestion

This receives content from AIR Ideas and creates draft videos.

### Step 1: Create New Workflow

1. Name: `AIR Publisher - AI Content Ingestion`

### Step 2: Add Webhook Trigger

1. Add **"Webhook"** node
2. **HTTP Method**: `POST`
3. **Path**: `ai-content` (or any path you prefer)
4. Copy the webhook URL

### Step 3: Send to Next.js

1. Add **HTTP Request** node
2. **POST** to `/api/webhooks/n8n/ai-content`
3. **Body**: Pass through the webhook payload

---

## Testing Your Workflows

### Test Workflow 1 (Scheduled Posts):

1. Create a test video in your database with `status = 'scheduled'`
2. Set `scheduled_at` to a time in the past
3. Manually execute the workflow
4. Check if it:
   - Fetches the scheduled video
   - Gets video details
   - Attempts to post (or shows what it would post)
   - Updates status

### Test Workflow 2 (Metrics):

1. Ensure you have posted videos in the database
2. Manually execute the workflow
3. Check if metrics are collected and sent

---

## Environment Variables in n8n

Set these in n8n (Settings → Environment Variables):

- `NEXTJS_URL`: Your Next.js app URL (e.g., `http://localhost:3000`)
- `N8N_WEBHOOK_SECRET`: Your webhook secret (from `.env.local`)
- `SUPABASE_URL`: Your Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY`: For direct database access (optional)

---

## Next Steps

1. Start with **Workflow 1** (Scheduled Posts) - most critical
2. Test it thoroughly before moving to others
3. Set up platform API credentials in n8n
4. Configure OAuth tokens for each platform

Let me know when you're ready to start, and I'll guide you through each step in detail!

