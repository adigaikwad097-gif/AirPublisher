# Get TikTok Video URL After Publishing

The TikTok publish endpoint doesn't return the video URL directly. You need to query the Video List API to get the video ID, then construct the URL.

## Step 1: Get Video List (Most Recent Video)

Add an **HTTP Request** node after "Publish Video":

### HTTP Request Node: "Get Video URL"

**Method:** POST  
**URL:** `https://open.tiktokapis.com/v2/video/list/`

**Headers:**
- `Authorization: Bearer {{ $('Code in JavaScript5').item.json.access_token }}`
- `Content-Type: application/json`

**Body (JSON):**
```json
{
  "fields": ["id", "create_time", "video_description", "share_url"],
  "max_count": 1
}
```

**Note:** TikTok API v2 uses POST method with JSON body, not GET with query parameters.

**Expected Response:**
```json
{
  "data": {
    "videos": [
      {
        "id": "7234567890123456789",
        "create_time": 1706779999,
        "video_description": "Your video title",
        "share_url": "https://www.tiktok.com/@username/video/7234567890123456789"
      }
    ],
    "cursor": 0,
    "has_more": false
  },
  "error": {
    "code": "ok",
    "message": "",
    "log_id": "..."
  }
}
```

## Step 2: Extract Video URL

The `share_url` field in the response contains the full TikTok URL! You can use it directly.

### Option A: Use share_url Directly (Easiest)

If the API returns `share_url`, use it directly:
```
{{ $('Get Video URL').item.json.data.videos[0].share_url }}
```

### Option B: Construct URL from Video ID

If `share_url` is not available, construct the URL:

**Code Node: "Extract Video URL"**

```javascript
// Get video data from "Get Video URL" node
const videoData = $('Get Video URL').item.json.data.videos[0];

// Get username from tokens (if available)
// You might need to get this from your database or user info
const openId = $('Code in JavaScript5').item.json.open_id;

// Construct TikTok URL
// Format: https://www.tiktok.com/@username/video/{video_id}
// Note: You'll need the actual username, not open_id
const videoId = videoData.id;
const tiktokUrl = `https://www.tiktok.com/video/${videoId}`;

// OR if you have username:
// const tiktokUrl = `https://www.tiktok.com/@${username}/video/${videoId}`;

return {
  json: {
    video_id: videoId,
    tiktok_url: tiktokUrl,
    share_url: videoData.share_url || tiktokUrl,
    create_time: videoData.create_time,
    video_description: videoData.video_description
  }
};
```

## Step 3: Alternative - Get User Info First

If you need the username to construct the URL, get user info first:

### HTTP Request Node: "Get User Info"

**Method:** GET  
**URL:** `https://open.tiktokapis.com/v2/user/info/`

**Headers:**
- `Authorization: Bearer {{ $('Code in JavaScript5').item.json.access_token }}`

**Query Parameters:**
- `fields: open_id,union_id,avatar_url,display_name,username`

**Response:**
```json
{
  "data": {
    "user": {
      "open_id": "...",
      "username": "your_username",
      "display_name": "Display Name"
    }
  }
}
```

Then construct URL:
```
https://www.tiktok.com/@{{ $('Get User Info').item.json.data.user.username }}/video/{{ $('Get Video URL').item.json.data.videos[0].id }}
```

## Complete Workflow

```
[Publish Video] ✅
  ↓
[Get Video URL] ← Get most recent video
  ↓
[Extract Video URL] (Optional - if share_url not available)
  ↓
[Update Database] (Save URL to your database)
```

## Quick Solution

**Simplest approach:** Use the `share_url` field from the Video List API response:

1. Add "Get Video URL" HTTP Request node
2. Use `{{ $('Get Video URL').item.json.data.videos[0].share_url }}` directly

This gives you the complete TikTok URL ready to use!

## Update Your Database

After getting the URL, update your video record:

**HTTP Request Node: "Update Video with URL"**

**Method:** POST  
**URL:** `https://airpublisher.vercel.app/api/webhooks/n8n/post-status`

**Headers:**
- `x-n8n-api-key: {{ $env.N8N_API_KEY }}`
- `Content-Type: application/json`

**Body:**
```json
{
  "video_id": "{{ $('Code in JavaScript5').item.json.video_id }}",
  "status": "posted",
  "platform_post_id": "{{ $('Get Video URL').item.json.data.videos[0].id }}",
  "platform_post_url": "{{ $('Get Video URL').item.json.data.videos[0].share_url }}",
  "platform": "tiktok",
  "published_at": "{{ $now }}"
}
```

## Troubleshooting

### If Video List Returns Empty
- Wait a few seconds - TikTok may need time to index the video
- Try increasing `max_count` to 5 or 10
- Check that the video was actually published (status was `PUBLISH_COMPLETE`)

### If share_url is Missing
- Use the video ID to construct the URL manually
- Format: `https://www.tiktok.com/video/{video_id}`
- Or get username first and use: `https://www.tiktok.com/@username/video/{video_id}`

