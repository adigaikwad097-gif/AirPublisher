# n8n Webhook Trigger Setup - Instant Posting

This guide shows how to set up an n8n webhook trigger for **instant video posting** when users click "Publish Now".

## How It Works

When a user clicks "Publish Now":
1. Frontend calls `publishVideoAction()` - sets video status to `scheduled` with `scheduled_at=now()`
2. `publishVideoAction` automatically calls `/api/trigger/post-video` webhook
3. This triggers your n8n webhook **immediately** (no waiting for cron)
4. n8n posts the video to the platform
5. n8n calls `/api/webhooks/n8n/post-status` to update video status

---

## Step 1: Create n8n Webhook Node

1. In your n8n workflow, add a **"Webhook"** node at the start
2. Configure:
   - **HTTP Method:** POST
   - **Path:** `/post-video` (or any path you want)
   - **Response Mode:** Using "Respond to Webhook" = true (n8n responds immediately)
   - **Authentication:** None (or add if needed)

3. Click **"Listen for Test Event"** to activate the webhook
4. Copy the **Webhook URL** (looks like: `https://your-n8n-instance.com/webhook/post-video`)

---

## Step 2: Add Webhook URL to Environment

Add to your `.env.local`:

```env
N8N_WEBHOOK_URL_POST_VIDEO=https://your-n8n-instance.com/webhook/post-video
```

Or if you're using the webhook ID:
```env
N8N_WEBHOOK_URL_POST_VIDEO=https://your-n8n-instance.com/webhook/abc123def456
```

---

## Step 3: Build n8n Workflow for Webhook Trigger

Your workflow should look like this:

```
[Webhook Trigger] → Receives { video_id, creator_unique_identifier, platform }
    ↓
[Get Video Details] → HTTP Request to /api/n8n/video-details?video_id={id}
    ↓
[Switch by Platform]
    ├── YouTube → [Post to YouTube] → [Update Status]
    ├── Instagram → [Create Container] → [Publish] → [Update Status]
    └── TikTok → [Initialize Upload] → [Upload] → [Update Status]
```

---

## Step 4: Configure Webhook Node

In the **Webhook** node:

**Expected Payload:**
```json
{
  "video_id": "uuid",
  "creator_unique_identifier": "creator-id",
  "platform": "youtube",
  "trigger_type": "immediate"
}
```

The webhook receives this and should:
1. Extract `video_id` from payload
2. Call `/api/n8n/video-details?video_id={id}` to get video details and tokens
3. Post to the platform
4. Call `/api/webhooks/n8n/post-status` to update status

---

## Step 5: Get Video Details in n8n

After the webhook trigger, add an **"HTTP Request"** node:

- **Method:** GET
- **URL:** `https://your-app-url.com/api/n8n/video-details?video_id={{ $json.video_id }}`
- **Authentication:** Header Auth
- **Header Name:** `x-n8n-api-key`
- **Header Value:** `{{ $env.N8N_API_KEY }}`

This returns:
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

## Step 6: Post to Platform

Follow the same steps as the cron workflow:
- **YouTube** → Use YouTube API node or HTTP Request
- **Instagram** → 2-step process (create container, then publish)
- **TikTok** → 2-step process (initialize, then upload)

See the main `N8N_WORKFLOW_SETUP.md` guide for platform-specific posting instructions.

---

## Step 7: Update Video Status

After posting, call `/api/webhooks/n8n/post-status`:

- **Method:** POST
- **URL:** `https://your-app-url.com/api/webhooks/n8n/post-status`
- **Body:**
  ```json
  {
    "video_id": "{{ $('Get Video Details').item.json.video.id }}",
    "status": "posted",
    "platform_post_id": "{{ $json.id }}",
    "platform_url": "{{ $json.url }}"
  }
  ```

---

## Complete Workflow Structure

```
[Webhook Trigger] → POST /webhook/post-video
    ↓
[Get Video Details] → GET /api/n8n/video-details
    ↓
[Switch by Platform]
    ├── YouTube → [Post to YouTube] → [Update Status]
    ├── Instagram → [Create Container] → [Publish] → [Update Status]
    └── TikTok → [Initialize Upload] → [Upload] → [Update Status]
```

---

## Testing

### Test the Webhook

1. **Test in n8n:**
   - Click "Test" button in Webhook node
   - Manually send test payload:
     ```json
     {
       "video_id": "your-test-video-id",
       "creator_unique_identifier": "creator-id",
       "platform": "youtube",
       "trigger_type": "immediate"
     }
     ```

2. **Test from Next.js:**
   - Upload a video in AIR Publisher
   - Click "Publish Now"
   - Check n8n execution logs - webhook should trigger immediately

3. **Check Video Status:**
   - Video should change from `draft` → `scheduled` → `posted`
   - Check `posted_at` timestamp in Supabase

---

## Fallback Behavior

If the webhook URL is **not configured** in `.env.local`:
- The publish action still works
- Video is set to `scheduled` with `scheduled_at=now()`
- n8n cron workflow will pick it up on the next run (within 15 minutes)

This ensures the system works even if webhook is not set up yet.

---

## Environment Variables

Add to `.env.local`:

```env
# n8n Webhook URL for instant posting (optional - if not set, cron will handle it)
N8N_WEBHOOK_URL_POST_VIDEO=https://your-n8n-instance.com/webhook/post-video

# n8n API Key (for authenticated webhooks)
N8N_API_KEY=your_api_key_here
```

---

## Benefits of Webhook Approach

✅ **Instant Posting** - No waiting for cron (0-15 min delay eliminated)  
✅ **User Feedback** - Users see immediate action  
✅ **Reliable** - Falls back to cron if webhook fails  
✅ **Scalable** - Can handle many concurrent requests  

---

## Troubleshooting

### Webhook Not Triggering

- Check `N8N_WEBHOOK_URL_POST_VIDEO` is set in `.env.local`
- Verify webhook URL is correct in n8n
- Check n8n workflow is active
- Check Next.js logs for webhook call errors

### Video Not Posting

- Check n8n execution logs
- Verify video has `status='scheduled'`
- Check platform tokens exist in database
- Verify platform API calls are working

### Status Not Updating

- Verify `post-status` webhook is being called
- Check webhook payload format
- Check Supabase logs for update errors

---

Ready to set up? Follow steps 1-7 above!



