# n8n Immediate Posting Automation Guide

This guide shows how to set up n8n workflows for **immediate video posting** when users click "Post Now".

## How It Works

```
User clicks "Post Now" 
  ↓
Next.js calls /api/trigger/post-video with { video_id }
  ↓
Next.js calls n8n webhook URL (if configured)
  ↓
n8n receives webhook → Calls /api/n8n/post-now
  ↓
API returns: Video details + Dropbox URL + Valid access tokens
  ↓
n8n posts to platform (YouTube/Instagram/TikTok)
  ↓
n8n calls /api/webhooks/n8n/post-status to update video status
```

---

## Step 1: Create n8n Webhook Trigger

1. In n8n, create a new workflow
2. Add a **"Webhook"** node as the first node
3. Configure:
   - **HTTP Method:** POST
   - **Path:** `/post-now` (or any path)
   - **Response Mode:** "Using 'Respond to Webhook'" = true
   - **Authentication:** Optional (can add API key later)

4. Click **"Listen for Test Event"** to activate
5. Copy the **Webhook URL** (e.g., `https://your-n8n.com/webhook/abc123`)

---

## Step 2: Configure Environment Variables

Add to your `.env.local`:

```env
# n8n Webhook URL for immediate posting
N8N_WEBHOOK_URL_POST_VIDEO=https://your-n8n-instance.com/webhook/post-now

# n8n API Key (for authentication - optional)
N8N_API_KEY=your_api_key_here
```

---

## Step 3: Build n8n Workflow

### Workflow Structure:

```
[Webhook Trigger] 
  ↓ Receives: { video_id, creator_unique_identifier, platform, trigger_type }
  ↓
[Get Video & Tokens] 
  ↓ HTTP POST to /api/n8n/post-now
  ↓ Returns: { video, platform_tokens, platform }
  ↓
[Switch by Platform]
  ├── YouTube → [Post to YouTube] → [Update Status]
  ├── Instagram → [Create Container] → [Publish] → [Update Status]
  ├── TikTok → [Initialize Upload] → [Upload] → [Update Status]
  └── Internal → [Update Status Only]
```

---

## Step 4: Configure "Get Video & Tokens" Node

Add an **HTTP Request** node after the webhook:

- **Method:** POST
- **URL:** `https://your-app-url.com/api/n8n/post-now`
- **Authentication:** Header Auth
  - **Header Name:** `x-n8n-api-key`
  - **Header Value:** `{{ $env.N8N_API_KEY }}` (or your API key)
- **Body (JSON):**
  ```json
  {
    "video_id": "{{ $json.video_id }}",
    "platform": "{{ $json.platform }}"
  }
  ```

### Response Format:

```json
{
  "success": true,
  "video": {
    "id": "uuid",
    "title": "Video Title",
    "description": "Description",
    "video_url": "https://dropbox.com/s/...?dl=1",
    "thumbnail_url": "https://...",
    "creator_unique_identifier": "creator-id"
  },
  "platform_tokens": {
    "access_token": "...",
    "refresh_token": "...",
    "channel_id": "..." // YouTube specific
  },
  "platform": "youtube",
  "has_tokens": true
}
```

**Note:** The `video_url` is the **Dropbox URL** - n8n will download this and upload to the platform.

---

## Step 5: Platform-Specific Posting

### YouTube

1. **Download Video from Dropbox:**
   - Use **HTTP Request** node
   - **Method:** GET
   - **URL:** `{{ $json.video.video_url }}`
   - **Response Format:** File
   - Save to a variable (e.g., `$binary.video_file`)

2. **Post to YouTube:**
   - Use **YouTube API** node or **HTTP Request**
   - **Endpoint:** `POST https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status`
   - **Headers:**
     ```
     Authorization: Bearer {{ $json.platform_tokens.access_token }}
     Content-Type: application/json
     ```
   - **Body:**
     ```json
     {
       "snippet": {
         "title": "{{ $json.video.title }}",
         "description": "{{ $json.video.description }}"
       },
       "status": {
         "privacyStatus": "public"
       }
     }
     ```
   - **File Upload:** Use the binary file from Dropbox download

### Instagram

1. **Download Video from Dropbox:**
   - Same as YouTube step 1

2. **Create Container:**
   - **HTTP Request** node
   - **Method:** POST
   - **URL:** `https://graph.facebook.com/v18.0/{{ $json.platform_tokens.instagram_id }}/media`
   - **Headers:**
     ```
     Authorization: Bearer {{ $json.platform_tokens.access_token }}
     ```
   - **Body (form-data):**
     ```
     media_type: VIDEO
     video_url: {{ $json.video.video_url }}
     caption: {{ $json.video.description }}
     ```

3. **Publish Container:**
   - **HTTP Request** node
   - **Method:** POST
   - **URL:** `https://graph.facebook.com/v18.0/{{ $json.platform_tokens.instagram_id }}/media_publish`
   - **Body:**
     ```json
     {
       "creation_id": "{{ $json.id }}" // from container creation
     }
     ```

### TikTok

1. **Download Video from Dropbox:**
   - Same as YouTube step 1

2. **Initialize Upload:**
   - **HTTP Request** node
   - **Method:** POST
   - **URL:** `https://open.tiktokapis.com/v2/post/publish/inbox/video/init/`
   - **Headers:**
     ```
     Authorization: Bearer {{ $json.platform_tokens.access_token }}
     Content-Type: application/json
     ```
   - **Body:**
     ```json
     {
       "post_info": {
         "title": "{{ $json.video.title }}",
         "description": "{{ $json.video.description }}",
         "privacy_level": "PUBLIC_TO_EVERYONE"
       }
     }
     ```

3. **Upload Video:**
   - Use the upload URL from initialization
   - Upload the binary file from Dropbox

---

## Step 6: Update Video Status

After successful posting, call the status update endpoint:

**HTTP Request** node:
- **Method:** POST
- **URL:** `https://your-app-url.com/api/webhooks/n8n/post-status`
- **Headers:**
  ```
  x-n8n-api-key: {{ $env.N8N_API_KEY }}
  ```
- **Body:**
  ```json
  {
    "video_id": "{{ $('Get Video & Tokens').item.json.video.id }}",
    "status": "posted",
    "platform_post_id": "{{ $json.id }}",
    "platform_url": "{{ $json.url }}"
  }
  ```

---

## Step 7: Error Handling

Add error handling in n8n:

1. **If token refresh fails:**
   - Check for `requires_reconnection: true` in response
   - Send notification to user
   - Stop workflow

2. **If video download fails:**
   - Retry up to 3 times
   - If still fails, update status to `failed`

3. **If platform posting fails:**
   - Update status to `failed`
   - Log error details
   - Send notification

---

## Complete n8n Workflow Example

```
[Webhook] → Receives { video_id, platform }
  ↓
[Get Video & Tokens] → POST /api/n8n/post-now
  ↓
[IF Error] → [Send Error Notification] → [Stop]
  ↓
[IF Success] → [Switch by Platform]
  ├── YouTube → [Download from Dropbox] → [Post to YouTube] → [Update Status]
  ├── Instagram → [Download from Dropbox] → [Create Container] → [Publish] → [Update Status]
  ├── TikTok → [Download from Dropbox] → [Initialize] → [Upload] → [Update Status]
  └── Internal → [Update Status Only]
```

---

## Testing

### Test the Webhook:

1. **In n8n:**
   - Click "Test" in Webhook node
   - Send test payload:
     ```json
     {
       "video_id": "your-test-video-id",
       "creator_unique_identifier": "creator-id",
       "platform": "youtube",
       "trigger_type": "immediate"
     }
     ```

2. **From Next.js:**
   - Upload a video
   - Click "Post Now" for a platform
   - Check n8n execution logs

3. **Verify:**
   - Video status changes to `posted`
   - Video appears on the platform
   - `posted_at` timestamp is set

---

## Key Features

✅ **Automatic Token Refresh** - Tokens are validated and refreshed automatically  
✅ **Dropbox URL Support** - Video URLs are Dropbox links, n8n downloads them  
✅ **Platform-Specific** - Different workflows for YouTube, Instagram, TikTok  
✅ **Error Handling** - Handles token expiration, download failures, posting errors  
✅ **Status Updates** - Automatically updates video status after posting  

---

## Troubleshooting

### Webhook Not Receiving Requests

- Check `N8N_WEBHOOK_URL_POST_VIDEO` in `.env.local`
- Verify webhook URL is correct
- Check n8n workflow is active
- Check Next.js logs for webhook call errors

### Token Errors

- Check tokens exist in Supabase
- Verify token refresh is working
- Check platform-specific token fields

### Video Download Fails

- Verify Dropbox URL is accessible
- Check URL format (should have `?dl=1`)
- Verify Dropbox link permissions

### Posting Fails

- Check platform API credentials
- Verify video format is supported
- Check platform API rate limits
- Review n8n execution logs

---

## Environment Variables Summary

```env
# Required
N8N_WEBHOOK_URL_POST_VIDEO=https://your-n8n.com/webhook/post-now

# Optional (for authentication)
N8N_API_KEY=your_api_key_here

# Supabase (already configured)
NEXT_PUBLIC_SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
```

---

Ready to set up? Follow steps 1-7 above!


