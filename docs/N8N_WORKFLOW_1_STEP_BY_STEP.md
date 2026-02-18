# Workflow 1: Scheduled Post Execution - Step by Step

This is the most critical workflow. It runs every 15 minutes and posts scheduled videos to YouTube, Instagram, or TikTok.

## Prerequisites Check

Before we start, make sure you have:

1. ✅ n8n instance running (cloud.n8n.io or self-hosted)
2. ✅ Your Next.js app running (check the URL)
3. ✅ At least one test video in your database with `status = 'scheduled'`

---

## Step 1: Open n8n and Create New Workflow

1. Go to your n8n instance (e.g., `https://your-n8n-instance.com` or `http://localhost:5678`)
2. Click **"Workflows"** in the sidebar
3. Click **"Add Workflow"** button (top right)
4. Name it: **"AIR Publisher - Scheduled Posts"**
5. Click **"Save"**

---

## Step 2: Add Cron Trigger

This will run the workflow every 15 minutes.

1. In the empty workflow, click **"Add Node"** or the **"+"** button
2. Search for **"Cron"** and click it
3. In the node settings:
   - **Trigger Times**: Select **"Every 15 minutes"**
   - OR use Cron expression: `*/15 * * * *`
4. Click **"Execute Node"** to test (should show current timestamp)
5. Click **"Save"** on the node

**What this does:** Triggers the workflow every 15 minutes automatically.

---

## Step 3: Add HTTP Request to Get Scheduled Posts

This fetches videos that need to be posted.

1. Click **"Add Node"** again
2. Search for **"HTTP Request"** and add it
3. Connect it: Drag from Cron node output → HTTP Request node input
4. Configure the HTTP Request node:

   **Basic Settings:**
   - **Method**: `GET`
   - **URL**: `http://localhost:3000/api/n8n/scheduled-posts`
     - Replace `localhost:3000` with your actual Next.js URL
     - If production: `https://your-domain.com/api/n8n/scheduled-posts`
   
   **Query Parameters:**
   - Click **"Add Parameter"**
   - **Name**: `before`
   - **Value**: `{{ $now.toISO() }}` (this gets current time)
   
   **Authentication:**
   - **Authentication**: `Header Auth` or Generic Credential Type
   - **Name**: `X-N8N-Webhook-Secret`
   - **Value**: `your-secret-key-here`
     - For now, use any string (e.g., `test-secret-123`)
     - We'll set this properly in `.env.local` later

5. Click **"Execute Node"** to test
6. You should see a response like:
   ```json
   {
     "success": true,
     "count": 0,
     "posts": []
   }
   ```
7. Click **"Save"**

**What this does:** Gets a list of videos scheduled to be posted.

---

## Step 4: Add IF Node to Check if Posts Exist

We only want to continue if there are posts to process.

1. Add **"IF"** node
2. Connect: HTTP Request → IF
3. Configure:
   - **Condition**: `{{ $json.body.count }}` **Greater Than** `0`
   - OR: `{{ $json.body.posts.length }}` **Greater Than** `0`

4. This creates two paths:
   - **True** (has posts) → Continue to next step
   - **False** (no posts) → End workflow

5. Click **"Save"**

---

## Step 5: Add Loop Over Items

We need to process each scheduled video one by one.

1. Add **"Loop Over Items"** node (or search for "For Each")
2. Connect: IF (True path) → Loop Over Items
3. Configure:
   - **Field to Split Out**: `posts` (from the response)
   - OR use **"For Each"** node and set **Items**: `{{ $json.body.posts }}`

4. Click **"Save"**

**What this does:** Loops through each scheduled video.

---

## Step 6: Add HTTP Request to Get Video Details

For each video, we need to get the full details and platform tokens.

1. Add **"HTTP Request"** node inside the loop
2. Connect: Loop Over Items → HTTP Request
3. Configure:

   **Basic Settings:**
   - **Method**: `GET`
   - **URL**: `http://localhost:3000/api/n8n/video-details`
   
   **Query Parameters:**
   - **Name**: `video_id`
   - **Value**: `{{ $json.video_id }}` (from the loop item)
   
   **Authentication:**
   - Same as Step 3: Header `X-N8N-Webhook-Secret` with your secret

4. Click **"Execute Node"** to test (you'll need a video_id)
5. Expected response:
   ```json
   {
     "success": true,
     "video": { ... },
     "platform_tokens": { ... },
     "has_tokens": true
   }
   ```
6. Click **"Save"**

**What this does:** Gets video details and platform API tokens.

---

## Step 7: Add Switch Node to Route by Platform

Different platforms need different handling.

1. Add **"Switch"** node
2. Connect: Get Video Details → Switch
3. Configure:
   - **Mode**: `Rules`
   - **Value**: `{{ $json.body.video.platform_target }}`
   - **Rules**:
     - **Rule 1**: 
       - **Value 1**: `youtube`
       - **Output**: `youtube`
     - **Rule 2**:
       - **Value 1**: `instagram`
       - **Output**: `instagram`
     - **Rule 3**:
       - **Value 1**: `tiktok`
       - **Output**: `tiktok`
     - **Rule 4** (Default):
       - **Output**: `default` (for internal or unknown)

4. Click **"Save"**

**What this does:** Routes to different nodes based on platform.

---

## Step 8: Add YouTube Upload Node

For YouTube videos, we'll use HTTP Request to call YouTube API.

1. Add **"HTTP Request"** node
2. Connect: Switch (youtube output) → HTTP Request
3. Configure:

   **Basic Settings:**
   - **Method**: `POST`
   - **URL**: `https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status`
   
   **Headers:**
   - **Authorization**: `Bearer {{ $json.body.platform_tokens.access_token }}`
   - **Content-Type**: `application/json`
   
   **Body (JSON):**
   ```json
   {
     "snippet": {
       "title": "{{ $json.body.video.title }}",
       "description": "{{ $json.body.video.description }}",
       "tags": []
     },
     "status": {
       "privacyStatus": "public"
     }
   }
   ```

**Note:** YouTube upload is a 2-step process:
1. First, create the video metadata (above)
2. Then upload the actual video file

For now, let's create a simplified version that just prepares the data.

4. Click **"Save"**

---

## Step 9: Add HTTP Request to Report Status

After attempting to post (or if it fails), we need to report back.

1. Add **"HTTP Request"** node
2. Connect: After YouTube node (and we'll add similar for other platforms)
3. Configure:

   **Basic Settings:**
   - **Method**: `POST`
   - **URL**: `http://localhost:3000/api/webhooks/n8n/post-status`
   
   **Authentication:**
   - Same Header Auth: `X-N8N-Webhook-Secret`
   
   **Body (JSON):**
   ```json
   {
     "video_id": "{{ $('Loop Over Items').item.json.video_id }}",
     "status": "posted",
     "platform_post_id": "{{ $json.id }}",
     "posted_at": "{{ $now.toISO() }}"
   }
   ```

4. Click **"Save"**

**What this does:** Updates the video status in your database.

---

## Step 10: Add Error Handling

If something goes wrong, we should report it.

1. Add **"On Error"** node or use **"Try-Catch"** pattern
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

---

## Step 11: Test the Workflow

Before activating, let's test it:

1. **Create a test video** in your database:
   - Go to Supabase Table Editor
   - Insert into `air_publisher_videos`:
     ```sql
     INSERT INTO air_publisher_videos (
       creator_unique_identifier,
       source_type,
       title,
       description,
       platform_target,
       status,
       scheduled_at
     ) VALUES (
       'your-creator-unique-identifier',
       'ugc',
       'Test Video',
       'Test Description',
       'youtube',
       'scheduled',
       NOW() - INTERVAL '1 hour'  -- Scheduled in the past so it's due
     );
     ```

2. **In n8n**, click **"Execute Workflow"** (play button)
3. Watch it run through each step
4. Check the output of each node
5. Verify the video status was updated in Supabase

---

## Step 12: Activate the Workflow

Once testing works:

1. Click the **"Active"** toggle in the top right (should turn green)
2. The workflow will now run automatically every 15 minutes
3. Click **"Save"**

---

## Next Steps

After this workflow is working:

1. Add Instagram and TikTok nodes (similar to YouTube)
2. Create Workflow 2 (Metrics Collection)
3. Create Workflow 3 (AI Content Ingestion)

---

## Troubleshooting

**Issue: "Unauthorized" error**
- Check that `X-N8N-Webhook-Secret` header matches what's expected
- In development, webhook verification is disabled if no key is set

**Issue: No posts found**
- Check that videos have `status = 'scheduled'`
- Check that `scheduled_at` is in the past
- Verify the query is working by testing the HTTP Request node

**Issue: Video details not found**
- Ensure the video exists in `air_publisher_videos` table
- Check that platform tokens exist in `youtube_tokens`, `instagram_tokens`, or `tiktok_tokens` tables

Let me know when you've completed Step 1-3, and we'll continue with the next steps!






