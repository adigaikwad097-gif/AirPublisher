# n8n TikTok Posting Workflow

Complete guide for posting videos to TikTok using n8n.

## TikTok API Overview

TikTok uses a **two-step process** for posting:
1. **Initialize Upload** - Get upload URL and upload video file
2. **Publish Video** - Publish the uploaded video with metadata

## Prerequisites

- TikTok Developer account
- TikTok App with video upload permissions
- Valid TikTok access token
- TikTok Open ID (`tiktok_open_id`)
- Video URL accessible to TikTok (public Dropbox link)

## Workflow Structure

```
Webhook (receives payload from /api/videos/[id]/publish)
  ↓
Get Video Details (from /api/n8n/video-details)
  ↓
Initialize Upload (POST to TikTok API)
  ↓
Upload Video (PUT binary data to upload URL)
  ↓
Publish Video (POST to TikTok API)
  ↓
Extract Post ID & Build URL
  ↓
Report Status Back (POST to /api/webhooks/n8n/post-status)
```

## Step-by-Step n8n Workflow

### 1. Webhook Trigger

**Node:** Webhook
- **HTTP Method:** POST
- **Path:** `posttiktok`
- **Response Mode:** Respond to Webhook
- **Options:**
  - **Allowed Origins:** `*` (or your Vercel domain)

**Expected Payload:**
```json
{
  "video_id": "uuid",
  "video_url": "https://www.dropbox.com/.../video.mp4?dl=1",
  "title": "Video Title",
  "description": "Video description",
  "thumbnail_url": "https://...",
  "callback_url": "https://airpublisher.vercel.app/api/webhooks/n8n/post-status"
}
```

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
    "platform_target": "tiktok",
    "creator_unique_identifier": "creator-id"
  },
  "platform_tokens": {
    "access_token": "tiktok_access_token_here",
    "open_id": "tiktok_open_id_here",
    "refresh_token": "tiktok_refresh_token_here"
  },
  "has_tokens": true
}
```

### 4. Initialize Upload

**Node:** HTTP Request
- **Method:** POST
- **URL:** `https://open.tiktokapis.com/v2/post/publish/video/init/`
- **Headers:**
  - **Authorization:** `Bearer {{ $('Get Video Details').item.json.platform_tokens.access_token }}`
  - **Content-Type:** `application/json`
- **Body (JSON):**
```json
{
  "post_info": {
    "title": "{{ $('Get Video Details').item.json.video.title }}",
    "privacy_level": "PUBLIC_TO_EVERYONE",
    "disable_duet": false,
    "disable_comment": false,
    "disable_stitch": false,
    "video_cover_timestamp_ms": 1000
  },
  "source_info": {
    "source": "FILE_UPLOAD",
    "video_size": 0,
    "chunk_size": 10000000,
    "total_chunk_count": 1
  }
}
```

**Response:**
```json
{
  "data": {
    "upload_url": "https://us.tiktok.com/api/v1/video/upload/...",
    "publish_id": "publish_id_here"
  }
}
```

**Important Notes:**
- `privacy_level`: `PUBLIC_TO_EVERYONE`, `MUTUAL_FOLLOW_FRIENDS`, or `SELF_ONLY`
- `video_size`: Size of video in bytes (optional, can be 0)
- `chunk_size`: Size of each chunk (10MB = 10000000 bytes)
- `total_chunk_count`: Number of chunks (1 for single upload)

### 5. Download Video from Dropbox

**Node:** HTTP Request
- **Method:** GET
- **URL:** `{{ $('Get Video Details').item.json.video.video_url.replace('&dl=0', '&dl=1') }}`
- **Options:**
  - **Response Format:** `File`
  - **Binary Property Name:** `data`

**Important:**
- Change `&dl=0` to `&dl=1` for binary download
- Set **Response Format: File** to get binary data
- Set **Binary Property Name: data** for next node

### 6. Upload Video to TikTok

**Node:** HTTP Request
- **Method:** PUT
- **URL:** `{{ $('Initialize Upload').item.json.data.upload_url }}`
- **Headers:**
  - **Authorization:** `Bearer {{ $('Get Video Details').item.json.platform_tokens.access_token }}`
  - **Content-Type:** `video/mp4` (or appropriate video type)
- **Body:**
  - **Send Body:** ✅ Yes
  - **Specify Body:** `Binary Data`
  - **Binary Property:** `data` (from previous node)

**Response:**
```json
{
  "data": {
    "uploaded_bytes": 1234567
  }
}
```

### 7. Publish Video

**Node:** HTTP Request
- **Method:** POST
- **URL:** `https://open.tiktokapis.com/v2/post/publish/`
- **Headers:**
  - **Authorization:** `Bearer {{ $('Get Video Details').item.json.platform_tokens.access_token }}`
  - **Content-Type:** `application/json`
- **Body (JSON):**
```json
{
  "post_info": {
    "title": "{{ $('Get Video Details').item.json.video.title }}",
    "privacy_level": "PUBLIC_TO_EVERYONE",
    "disable_duet": false,
    "disable_comment": false,
    "disable_stitch": false,
    "video_cover_timestamp_ms": 1000
  },
  "source_info": {
    "source": "FILE_UPLOAD",
    "publish_id": "{{ $('Initialize Upload').item.json.data.publish_id }}"
  }
}
```

**Response:**
```json
{
  "data": {
    "publish_id": "publish_id_here",
    "upload_status": "PROCESSING"
  }
}
```

### 8. Extract Post ID & Build URL

**Node:** Code

```javascript
const publishResponse = $input.first().json;
const publishId = publishResponse.data?.publish_id;
const openId = $('Get Video Details').item.json.platform_tokens.open_id;

if (!publishId) {
  throw new Error('No publish_id in response');
}

// TikTok post URL format: https://www.tiktok.com/@username/video/{publish_id}
// Note: We might need to get username from user info, or use open_id
// For now, we'll use a generic format or get username from API

// Get video_id from webhook
let videoId = '';
try {
  videoId = $('Webhook').item.json.body.video_id;
} catch (e) {
  console.warn('Could not get video_id from webhook');
}

// TikTok post URL - we'll use publish_id in the URL
// Actual URL format depends on TikTok's response
const postUrl = `https://www.tiktok.com/video/${publishId}`;

console.log('✅ TikTok video published!');
console.log('Publish ID:', publishId);
console.log('Post URL:', postUrl);

return {
  json: {
    video_id: videoId,
    platform: 'tiktok',
    status: 'posted',
    platform_post_id: publishId,
    platform_url: postUrl,
    error_message: null,
  }
};
```

### 9. Report Status Back

**Node:** HTTP Request
- **Method:** POST
- **URL:** `{{ $('Webhook').item.json.body.callback_url }}`
- **Headers:**
  - **x-n8n-api-key:** `{{ $env.N8N_API_KEY }}`
  - **Content-Type:** `application/json`
- **Body (JSON):**
```json
{
  "video_id": "{{ $('Extract Post ID').item.json.video_id }}",
  "platform": "tiktok",
  "status": "posted",
  "platform_post_id": "{{ $('Extract Post ID').item.json.platform_post_id }}",
  "platform_url": "{{ $('Extract Post ID').item.json.platform_url }}",
  "error_message": null
}
```

## TikTok API Endpoints

### Initialize Upload
- **URL:** `https://open.tiktokapis.com/v2/post/publish/video/init/`
- **Method:** POST
- **Returns:** `upload_url` and `publish_id`

### Upload Video
- **URL:** `{{ upload_url }}` (from init response)
- **Method:** PUT
- **Body:** Binary video data

### Publish Video
- **URL:** `https://open.tiktokapis.com/v2/post/publish/`
- **Method:** POST
- **Body:** Post info with `publish_id`

## Common Issues & Solutions

### Issue 1: "Invalid access token"

**Solution:**
- Verify token is valid and not expired
- Check token has `video.upload` and `video.publish` permissions
- Ensure `Authorization: Bearer` header format is correct

### Issue 2: "Invalid video URL"

**Solution:**
- Ensure video URL is publicly accessible
- For Dropbox, use `?dl=1` instead of `?dl=0`
- Verify video format is supported (MP4, MOV, etc.)
- Check video size limits (TikTok has size limits)

### Issue 3: "Upload failed"

**Solution:**
- Verify binary data is correctly formatted
- Check Content-Type header matches video type
- Ensure upload URL is from the init response
- Verify video file is not corrupted

### Issue 4: "Publish failed"

**Solution:**
- Ensure `publish_id` matches the one from init
- Check video upload completed successfully
- Verify post_info matches init request
- Wait for upload to complete before publishing

## Testing

1. **Test Token:**
   ```bash
   curl -X GET "https://open.tiktokapis.com/v2/user/info/?fields=open_id,union_id,avatar_url,display_name" \
     -H "Authorization: Bearer YOUR_TOKEN"
   ```

2. **Test Initialize Upload:**
   - Should return `upload_url` and `publish_id`

3. **Test Upload:**
   - Should upload binary data successfully

4. **Test Publish:**
   - Should return `publish_id` and `upload_status`

## TikTok API Reference

- **API Base URL:** `https://open.tiktokapis.com/v2/`
- **Required Scopes:** `video.upload`, `video.publish`, `user.info.basic`
- **Video Formats:** MP4, MOV, AVI
- **Max Video Size:** Check TikTok API documentation for current limits

## Next Steps

After TikTok posting works:
1. Test with different video formats and sizes
2. Add error handling and retry logic
3. Implement status polling for upload progress
4. Add thumbnail selection support
5. Test scheduled posts

