# Construct TikTok URL from Video ID

## The Problem

The `publish_id` from the publish response is **NOT** the same as the TikTok `video_id`. 

- `publish_id`: Internal TikTok upload/publish identifier (e.g., `v_pub_file~v2-1.7601447475849021452`)
- `video_id`: The actual TikTok video ID used in URLs (e.g., `7234567890123456789`)

## Solution: Check if Publish Status Returns Video ID

First, let's check if the publish status endpoint returns the actual video ID:

### HTTP Request: "Get Publish Status (Check for Video ID)"

**Method:** POST  
**URL:** `https://open.tiktokapis.com/v2/post/publish/status/fetch/`

**Headers:**
- `Authorization: Bearer {{ $('Get a row5').item.json.tiktok_access_token }}`
- `Content-Type: application/json`

**Body:**
```json
{
  "publish_id": "{{ $('HTTP Request5').item.json.data.publish_id }}"
}
```

**Check the response** - it might include:
- `video_id` - The actual TikTok video ID
- `share_url` - The complete TikTok URL
- Other fields that might help

## If Video ID is Available

If the publish status response includes `video_id`, you can construct the URL:

### Option 1: Full URL with Username
```
https://www.tiktok.com/@{{ username }}/video/{{ video_id }}
```

### Option 2: Direct Video URL (Works without username)
```
https://www.tiktok.com/video/{{ video_id }}
```

This format works even without the username!

## Code Node: "Construct TikTok URL"

If you get `video_id` from the publish status:

```javascript
const publishStatus = $('Get Publish Status').item.json.data;

// Check if video_id exists
if (publishStatus.video_id) {
  const videoId = publishStatus.video_id;
  
  // Option 1: Direct video URL (works without username)
  const tiktokUrl = `https://www.tiktok.com/video/${videoId}`;
  
  // Option 2: If you have username
  // const username = $('Get User Info').item.json.data.user.username;
  // const tiktokUrl = `https://www.tiktok.com/@${username}/video/${videoId}`;
  
  return {
    json: {
      video_id: videoId,
      tiktok_url: tiktokUrl,
      publish_id: $('HTTP Request5').item.json.data.publish_id
    }
  };
} else {
  // Fallback: store publish_id for later
  return {
    json: {
      publish_id: $('HTTP Request5').item.json.data.publish_id,
      note: "video_id not available, need video.list scope to query"
    }
  };
}
```

## Alternative: Extract from Publish ID (Unlikely to Work)

The `publish_id` format is: `v_pub_file~v2-1.7601447475849021452`

The number at the end (`7601447475849021452`) might be related to the video ID, but it's not guaranteed to be the same. **Don't rely on this** - it's not documented.

## Best Approach

1. **Check publish status response** for `video_id` or `share_url`
2. **If found:** Construct URL directly
3. **If not found:** You'll need `video.list` scope to query the video list API

## Quick Test

Add this Code node after "Publish Video" to check what data is available:

```javascript
const publishResponse = $('Publish Video').item.json;
const initializeResponse = $('HTTP Request5').item.json;

return {
  json: {
    publish_response: publishResponse,
    publish_id: initializeResponse.data.publish_id,
    note: "Check if publish_response.data contains video_id or share_url"
  }
};
```

This will show you exactly what fields are available in the publish response!


