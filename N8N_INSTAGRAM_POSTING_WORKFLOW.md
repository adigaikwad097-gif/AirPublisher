# n8n Instagram Posting Workflow

Complete guide for posting videos to Instagram using n8n.

## Instagram Graph API Overview

Instagram uses a **two-step process** for posting:
1. **Create Media Container** - Upload video URL and metadata
2. **Publish Container** - Publish the created container

## Prerequisites

- Instagram Business or Creator account
- Instagram Business Account ID (`instagram_id` or `instagram_business_account_id`)
- Valid Instagram access token (long-lived, 60 days)
- Video URL accessible to Instagram (public Dropbox link)
- n8n webhook URL configured in `N8N_WEBHOOK_URL_POST_VIDEO` environment variable

## How It's Triggered

When a user clicks "Post Now" for Instagram in the app:
1. Frontend calls `/api/videos/[id]/publish` with `platform: "instagram"` and `postType: "now"`
2. The API route triggers the n8n webhook at `N8N_WEBHOOK_URL_POST_VIDEO`
3. n8n receives the payload and processes the Instagram posting workflow
4. n8n calls back to `/api/webhooks/n8n/post-status` when done

**Note:** You can either:
- Use one webhook that branches by `platform` (YouTube, Instagram, TikTok)
- Create separate webhooks for each platform (recommended for clarity)

## Workflow Structure

```
Webhook (receives payload from /api/videos/[id]/publish)
  ↓
Get Video Details (from /api/n8n/video-details)
  ↓
Create Media Container (POST to Instagram Graph API)
  ↓
Wait for Container Status (poll until ready)
  ↓
Publish Container (POST to Instagram Graph API)
  ↓
Extract Post ID & Build URL
  ↓
Report Status Back (POST to /api/webhooks/n8n/post-status)
```

## Step-by-Step n8n Workflow

### 1. Webhook Trigger

**Node:** Webhook
- **HTTP Method:** POST
- **Path:** `postinstagram` (or use the same webhook as YouTube and branch by platform)
- **Response Mode:** Respond to Webhook
- **Options:**
  - **Allowed Origins:** `*` (or your Vercel domain)

**Expected Payload (from `/api/videos/[id]/publish`):**
```json
{
  "video_id": "uuid",
  "creator_unique_identifier": "creator-id",
  "platform": "instagram",
  "trigger_type": "immediate",
  "video_url": "https://www.dropbox.com/.../video.mp4?dl=0",
  "title": "Video Title",
  "description": "Video description",
  "thumbnail_url": "https://...",
  "callback_url": "https://airpublisher.vercel.app/api/webhooks/n8n/post-status"
}
```

**Option: Branch by Platform**
If using the same webhook for all platforms, add an **IF** node after the webhook:
- **Condition:** `{{ $json.body.platform }}` equals `instagram`
- **True:** Continue to Instagram workflow
- **False:** Route to other platform workflows

### 2. Respond to Webhook

**Node:** Respond to Webhook
- **Options:** (default)

This immediately responds to the caller, allowing n8n to process in the background.

### 3. Get Video Details

**Node:** HTTP Request
- **Method:** GET
- **URL:** `https://airpublisher.vercel.app/api/n8n/video-details?video_id={{ $('Webhook').item.json.body.video_id }}`
- **Headers:**
  - `x-n8n-api-key`: `{{ $env.N8N_API_KEY }}`

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
    "platform_target": "instagram",
    "creator_unique_identifier": "creator-id"
  },
  "platform_tokens": {
    "access_token": "IGQW...",
    "instagram_id": "17841405309211850",
    "username": "your_username"
  },
  "has_tokens": true
}
```

### 4. Create Media Container

**Node:** HTTP Request
- **Method:** POST
- **URL:** `https://graph.facebook.com/v18.0/{{ $('Get Video Details').item.json.platform_tokens.instagram_id }}/media`
- **Headers:**
  - `Authorization`: `Bearer {{ $('Get Video Details').item.json.platform_tokens.access_token }}`
    - ⚠️ **CRITICAL:** Must include "Bearer " (with space) before the token
    - ⚠️ **DO NOT** use `=` prefix in n8n (just `Bearer {{ ... }}`)
  - `Content-Type`: `application/json`
    - ⚠️ **CRITICAL:** Must be `application/json`, NOT `multipart/form-data`
- **Body:**
  - **Send Body:** ✅ Yes
  - **Specify Body:** `JSON` (NOT Form-Data or Form-Urlencoded)
  - **JSON Body:**
```json
{
  "media_type": "REELS",
  "video_url": "{{ $('Get Video Details').item.json.video.video_url.replace('&dl=0', '&dl=1') }}",
  "caption": "{{ $('Get Video Details').item.json.video.title }}\n\n{{ $('Get Video Details').item.json.video.description }}",
  "thumb_offset": 0
}
```

**Important Notes:**
- ⚠️ **Authorization header MUST have "Bearer " prefix** (space after "Bearer")
- ⚠️ **Content-Type MUST be "application/json"** (not multipart/form-data)
- ⚠️ **Body MUST be JSON format** (not Form-Data in n8n)
- Use `REELS` for reels/videos (not `VIDEO` for feed posts)
- Video URL must be publicly accessible (use `?dl=1` for Dropbox)
- Caption can include title and description
- `thumb_offset` is optional (seconds into video for thumbnail)

**Common Error:** If you get "Invalid OAuth access token - Cannot parse access token":
1. Check Authorization header has "Bearer " prefix
2. Check Content-Type is "application/json" (not multipart/form-data)
3. Check body is set to JSON (not Form-Data)

**Response:**
```json
{
  "id": "17912345678901234"
}
```

The `id` is the **container ID**, not the post ID yet.

### 5. Wait for Container Status (Optional but Recommended)

**Node:** Wait
- **Wait For:** 5 seconds

Instagram needs time to process the video. You can optionally poll the container status:

**Node:** HTTP Request (Check Status)
- **Method:** GET
- **URL:** `https://graph.facebook.com/v18.0/{{ $('Create Media Container').item.json.id }}?fields=status_code&access_token={{ $('Get Video Details').item.json.platform_tokens.access_token }}`

**Response:**
```json
{
  "status_code": "FINISHED"
}
```

**Status Codes:**
- `IN_PROGRESS` - Still processing
- `ERROR` - Processing failed
- `FINISHED` - Ready to publish

**Loop Logic:**
- If `status_code === "IN_PROGRESS"`, wait 5 seconds and check again
- If `status_code === "ERROR"`, report failure
- If `status_code === "FINISHED"`, proceed to publish

### 6. Publish Container

**Node:** HTTP Request
- **Method:** POST
- **URL:** `https://graph.facebook.com/v18.0/{{ $('Get Video Details').item.json.platform_tokens.instagram_id }}/media_publish`
- **Headers:**
  - `Authorization`: `Bearer {{ $('Get Video Details').item.json.platform_tokens.access_token }}`
  - `Content-Type`: `application/json`
- **Body (JSON):**
```json
{
  "creation_id": "{{ $('Create Media Container').item.json.id }}"
}
```

**Response:**
```json
{
  "id": "17912345678901235"
}
```

The `id` is the **Instagram post ID**.

### 7. Extract Post ID & Build URL

**Node:** Code (or Set)

**Code Node:**
```javascript
const publishResponse = $input.item.json;
const postId = publishResponse.id;
const instagramId = $('Get Video Details').item.json.platform_tokens.instagram_id;
const username = $('Get Video Details').item.json.platform_tokens.username;

// Instagram post URL format: https://www.instagram.com/p/{POST_ID}/
// Note: The post ID from media_publish is the actual post ID
const postUrl = `https://www.instagram.com/p/${postId}/`;

console.log('✅ Instagram post published!');
console.log('Post ID:', postId);
console.log('Post URL:', postUrl);

return {
  json: {
    video_id: $('Webhook').item.json.body.video_id,
    platform: 'instagram',
    status: 'posted',
    platform_post_id: postId,
    platform_url: postUrl,
    error_message: null,
  }
};
```

### 8. Report Status Back

**Node:** HTTP Request
- **Method:** POST
- **URL:** `{{ $('Webhook').item.json.body.callback_url }}`
- **Headers:**
  - `x-n8n-api-key`: `{{ $env.N8N_API_KEY }}`
  - `Content-Type`: `application/json`
- **Body (JSON):**
```json
{
  "video_id": "{{ $('Extract Post ID').item.json.video_id }}",
  "platform": "instagram",
  "status": "posted",
  "platform_post_id": "{{ $('Extract Post ID').item.json.platform_post_id }}",
  "platform_url": "{{ $('Extract Post ID').item.json.platform_url }}",
  "error_message": null
}
```

## Complete n8n Workflow JSON

```json
{
  "nodes": [
    {
      "parameters": {
        "httpMethod": "POST",
        "path": "postinstagram",
        "responseMode": "responseNode",
        "options": {
          "allowedOrigins": "*"
        }
      },
      "type": "n8n-nodes-base.webhook",
      "name": "Webhook",
      "position": [0, 0]
    },
    {
      "parameters": {
        "options": {}
      },
      "type": "n8n-nodes-base.respondToWebhook",
      "name": "Respond to Webhook",
      "position": [256, 0]
    },
    {
      "parameters": {
        "method": "GET",
        "url": "=https://airpublisher.vercel.app/api/n8n/video-details?video_id={{ $('Webhook').item.json.body.video_id }}",
        "sendHeaders": true,
        "headerParameters": {
          "parameters": [
            {
              "name": "x-n8n-api-key",
              "value": "={{ $env.N8N_API_KEY }}"
            }
          ]
        }
      },
      "type": "n8n-nodes-base.httpRequest",
      "name": "Get Video Details",
      "position": [512, 0]
    },
    {
      "parameters": {
        "method": "POST",
        "url": "=https://graph.facebook.com/v18.0/{{ $('Get Video Details').item.json.platform_tokens.instagram_id }}/media",
        "sendHeaders": true,
        "headerParameters": {
          "parameters": [
            {
              "name": "Authorization",
              "value": "=Bearer {{ $('Get Video Details').item.json.platform_tokens.access_token }}"
            },
            {
              "name": "Content-Type",
              "value": "application/json"
            }
          ]
        },
        "sendBody": true,
        "specifyBody": "json",
        "jsonBody": "={\n  \"media_type\": \"REELS\",\n  \"video_url\": \"{{ $('Get Video Details').item.json.video.video_url.replace('&dl=0', '&dl=1') }}\",\n  \"caption\": \"{{ $('Get Video Details').item.json.video.title }}\\n\\n{{ $('Get Video Details').item.json.video.description }}\",\n  \"thumb_offset\": 0\n}"
      },
      "type": "n8n-nodes-base.httpRequest",
      "name": "Create Media Container",
      "position": [768, 0]
    },
    {
      "parameters": {
        "amount": 5,
        "unit": "seconds"
      },
      "type": "n8n-nodes-base.wait",
      "name": "Wait for Processing",
      "position": [1024, 0]
    },
    {
      "parameters": {
        "method": "POST",
        "url": "=https://graph.facebook.com/v18.0/{{ $('Get Video Details').item.json.platform_tokens.instagram_id }}/media_publish",
        "sendHeaders": true,
        "headerParameters": {
          "parameters": [
            {
              "name": "Authorization",
              "value": "=Bearer {{ $('Get Video Details').item.json.platform_tokens.access_token }}"
            },
            {
              "name": "Content-Type",
              "value": "application/json"
            }
          ]
        },
        "sendBody": true,
        "specifyBody": "json",
        "jsonBody": "={\n  \"creation_id\": \"{{ $('Create Media Container').item.json.id }}\"\n}"
      },
      "type": "n8n-nodes-base.httpRequest",
      "name": "Publish Container",
      "position": [1280, 0]
    },
    {
      "parameters": {
        "jsCode": "const publishResponse = $input.item.json;\nconst postId = publishResponse.id;\nconst postUrl = `https://www.instagram.com/p/${postId}/`;\n\nreturn {\n  json: {\n    video_id: $('Webhook').item.json.body.video_id,\n    platform: 'instagram',\n    status: 'posted',\n    platform_post_id: postId,\n    platform_url: postUrl,\n    error_message: null,\n  }\n};"
      },
      "type": "n8n-nodes-base.code",
      "name": "Extract Post ID",
      "position": [1536, 0]
    },
    {
      "parameters": {
        "method": "POST",
        "url": "={{ $('Webhook').item.json.body.callback_url }}",
        "sendHeaders": true,
        "headerParameters": {
          "parameters": [
            {
              "name": "x-n8n-api-key",
              "value": "={{ $env.N8N_API_KEY }}"
            },
            {
              "name": "Content-Type",
              "value": "application/json"
            }
          ]
        },
        "sendBody": true,
        "specifyBody": "json",
        "jsonBody": "={{ $('Extract Post ID').item.json }}"
      },
      "type": "n8n-nodes-base.httpRequest",
      "name": "Report Status",
      "position": [1792, 0]
    }
  ],
  "connections": {
    "Webhook": {
      "main": [[{"node": "Respond to Webhook", "type": "main", "index": 0}]]
    },
    "Respond to Webhook": {
      "main": [[{"node": "Get Video Details", "type": "main", "index": 0}]]
    },
    "Get Video Details": {
      "main": [[{"node": "Create Media Container", "type": "main", "index": 0}]]
    },
    "Create Media Container": {
      "main": [[{"node": "Wait for Processing", "type": "main", "index": 0}]]
    },
    "Wait for Processing": {
      "main": [[{"node": "Publish Container", "type": "main", "index": 0}]]
    },
    "Publish Container": {
      "main": [[{"node": "Extract Post ID", "type": "main", "index": 0}]]
    },
    "Extract Post ID": {
      "main": [[{"node": "Report Status", "type": "main", "index": 0}]]
    }
  }
}
```

## Common Issues & Solutions

### Issue 1: "Invalid OAuth access token"

**Solution:**
- Verify the access token is valid and not expired
- Check that the token has `instagram_basic`, `instagram_content_publish`, and `pages_show_list` permissions
- Ensure you're using the correct Instagram Business Account ID

### Issue 2: "Invalid video URL"

**Solution:**
- Ensure the video URL is publicly accessible
- For Dropbox, use `?dl=1` instead of `?dl=0`
- Verify the video format is supported (MP4, MOV, etc.)
- Check video size limits (Instagram has size limits)

### Issue 3: "Container status stuck in IN_PROGRESS"

**Solution:**
- Increase wait time between status checks
- Add a timeout (e.g., 5 minutes max)
- Check video file size and format
- Verify video URL is accessible from Instagram's servers

### Issue 4: "Media type not supported"

**Solution:**
- Use `REELS` for reels/videos (not `VIDEO`)
- Ensure the Instagram account type supports the media type
- Check Instagram API version (use v18.0 or latest)

### Issue 5: "Missing instagram_id"

**Solution:**
- Verify the token record has `instagram_id` or `instagram_business_account_id`
- Check that the Instagram account is connected as a Business or Creator account
- Ensure the OAuth flow captured the Instagram Business Account ID

## Testing

1. **Test Webhook:**
   ```bash
   curl -X POST https://your-n8n-instance.com/webhook/postinstagram \
     -H "Content-Type: application/json" \
     -d '{
       "video_id": "test-uuid",
       "video_url": "https://www.dropbox.com/.../test.mp4?dl=1",
       "title": "Test Video",
       "description": "Test description",
       "callback_url": "https://airpublisher.vercel.app/api/webhooks/n8n/post-status"
     }'
   ```

2. **Check n8n Execution Logs:**
   - Look for errors in each node
   - Verify token paths are correct
   - Check Instagram API responses

3. **Verify Post:**
   - Check Instagram account for the new post
   - Verify post URL is correct
   - Confirm database was updated with post status

## Instagram API Reference

- **Create Media Container:** https://developers.facebook.com/docs/instagram-api/reference/ig-user/media#creating
- **Publish Container:** https://developers.facebook.com/docs/instagram-api/reference/ig-user/media_publish
- **Media Types:** `REELS`, `VIDEO`, `IMAGE`, `CAROUSEL`
- **API Version:** v18.0 (or latest)

## Next Steps

After Instagram posting works:
1. Test with different video formats and sizes
2. Add error handling and retry logic
3. Implement status polling for long videos
4. Add thumbnail selection support
5. Test scheduled posts

