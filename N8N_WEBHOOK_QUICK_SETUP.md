# Quick Setup: n8n Webhook for Instant Posting

Your n8n webhook URL: `https://support-team.app.n8n.cloud/webhook/c5c7dd87-7d9a-4e3f-83c4-5420dd2bbd4f`

## Step 1: Add Webhook URL to Environment

Add this to your `.env.local` file:

```env
N8N_WEBHOOK_URL_POST_VIDEO=https://support-team.app.n8n.cloud/webhook/c5c7dd87-7d9a-4e3f-83c4-5420dd2bbd4f
```

**Important:** Restart your dev server after adding this!

---

## Step 2: Build n8n Workflow

Your n8n workflow should receive this payload when user clicks "Publish Now":

```json
{
  "video_id": "uuid",
  "creator_unique_identifier": "creator-id",
  "platform": "youtube",
  "trigger_type": "immediate"
}
```

---

## Step 3: n8n Workflow Structure

```
[Webhook Trigger] → Receives payload above
    ↓
[Get Video Details] → HTTP Request to your app
    ↓
[Switch by Platform]
    ├── YouTube → [Post to YouTube] → [Update Status]
    ├── Instagram → [Create Container] → [Publish] → [Update Status]
    └── TikTok → [Initialize Upload] → [Upload] → [Update Status]
```

---

## Step 4: Configure Each Node

### Node 1: Webhook (Already Done ✅)
- Your webhook URL is: `https://support-team.app.n8n.cloud/webhook/c5c7dd87-7d9a-4e3f-83c4-5420dd2bbd4f`
- It will receive the payload automatically

### Node 2: Get Video Details

Add **"HTTP Request"** node:

- **Method:** GET
- **URL:** `https://your-app-url.com/api/n8n/video-details?video_id={{ $json.video_id }}`
- **Authentication:** Header Auth
- **Header Name:** `x-n8n-api-key`
- **Header Value:** Your `N8N_API_KEY` from `.env.local`

**Response you'll get:**
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

### Node 3: Switch by Platform

Add **"IF"** or **"Switch"** node to route based on `{{ $json.video.platform_target }}`:
- `youtube` → YouTube posting flow
- `instagram` → Instagram posting flow
- `tiktok` → TikTok posting flow

### Node 4: Post to Platform

See detailed instructions in `N8N_WORKFLOW_SETUP.md` for each platform:
- **YouTube:** Use YouTube API node or HTTP Request
- **Instagram:** 2-step (create container, then publish)
- **TikTok:** 2-step (initialize, then upload)

### Node 5: Update Status

Add **"HTTP Request"** node:

- **Method:** POST
- **URL:** `https://your-app-url.com/api/webhooks/n8n/post-status`
- **Authentication:** Header Auth (same API key)
- **Body (JSON):**
  ```json
  {
    "video_id": "{{ $('Get Video Details').item.json.video.id }}",
    "status": "posted",
    "platform_post_id": "{{ $json.id }}",
    "platform_url": "{{ $json.url }}"
  }
  ```

---

## Step 5: Test the Workflow

1. **Test in n8n:**
   - Click "Test" button in Webhook node
   - Send test payload:
     ```json
     {
       "video_id": "your-test-video-id",
       "creator_unique_identifier": "creator-id",
       "platform": "youtube",
       "trigger_type": "immediate"
     }
     ```

2. **Test from AIR Publisher:**
   - Upload a video
   - Click "Publish Now"
   - Check n8n execution logs - should trigger immediately

---

## What Happens When User Clicks "Publish Now"

1. ✅ Video status set to `scheduled` with `scheduled_at=now()`
2. ✅ `/api/trigger/post-video` automatically called
3. ✅ Your n8n webhook receives payload
4. ✅ n8n gets video details and tokens
5. ✅ n8n posts to platform
6. ✅ Video status updates to `posted`

---

## Troubleshooting

### Webhook Not Receiving Data
- Check `.env.local` has `N8N_WEBHOOK_URL_POST_VIDEO` set
- Restart dev server after adding env var
- Check n8n webhook is active (green/active status)

### Video Not Posting
- Check n8n execution logs
- Verify video has `status='scheduled'`
- Check platform tokens exist
- Verify API calls in n8n logs

---

**Next:** Build the workflow in n8n following the structure above!



