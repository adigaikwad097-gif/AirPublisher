# Fix Instagram Extract Post ID Code Node

## Your Current Code (Has Issues)

```javascript
const publishResponse = $input.first().json.id;  // ❌ Wrong - getting id, not response
const postId = $input.first().json.id;           // ✅ Correct
const instagramId = $('Get Video Details').item.json.platform_tokens.instagram_id; // ⚠️ Might not be available
```

## Fixed Code

### Option 1: Simple (Recommended)

```javascript
// Get post ID from publish response
const publishResponse = $input.first().json;
const postId = publishResponse.id;

if (!postId) {
  throw new Error('No post ID in publish response');
}

// Instagram post URL format
const postUrl = `https://www.instagram.com/p/${postId}/`;

console.log('✅ Instagram post published!');
console.log('Post ID:', postId);
console.log('Post URL:', postUrl);

// Get video_id from previous nodes - try different paths
const videoId = $('Webhook')?.item?.json?.body?.video_id 
  || $('Get Video Details')?.item?.json?.video?.id
  || $input.first().json.video_id
  || '';

return {
  json: {
    video_id: videoId,
    platform: 'instagram',
    status: 'posted',
    platform_post_id: postId,
    platform_url: postUrl,
    error_message: null,
  }
};
```

### Option 2: Using Data from Previous Node

If you pass data through nodes, use this:

```javascript
// Get post ID from current input (publish response)
const publishResponse = $input.first().json;
const postId = publishResponse.id;

// Get data from previous node (if you passed it through)
const previousData = $input.first().json;
const videoId = previousData.video_id || '';

// Instagram post URL
const postUrl = `https://www.instagram.com/p/${postId}/`;

console.log('✅ Instagram post published!');
console.log('Post ID:', postId);
console.log('Post URL:', postUrl);

return {
  json: {
    video_id: videoId,
    platform: 'instagram',
    status: 'posted',
    platform_post_id: postId,
    platform_url: postUrl,
    error_message: null,
  }
};
```

### Option 3: Pass Video ID Through Nodes

**In "Publish Container" node, add video_id to the request or use a Set node before:**

**Set Node (before Publish Container):**
- **Fields to Set:**
  - **Name:** `video_id`
  - **Value:** `{{ $('Webhook').item.json.body.video_id }}`

**Then in Code Node:**
```javascript
// Get post ID from publish response
const publishResponse = $input.first().json;
const postId = publishResponse.id;

// Get video_id from input (passed through Set node)
const videoId = $input.first().json.video_id || '';

// Instagram post URL
const postUrl = `https://www.instagram.com/p/${postId}/`;

return {
  json: {
    video_id: videoId,
    platform: 'instagram',
    status: 'posted',
    platform_post_id: postId,
    platform_url: postUrl,
    error_message: null,
  }
};
```

## Complete Workflow with Data Passing

### Node 1: Create Media Container
- Output: `{ "id": "17850902622667194" }`

### Node 2: Set Node (Pass Video ID)
- **Fields:**
  - `video_id`: `{{ $('Webhook').item.json.body.video_id }}`
  - `container_id`: `{{ $('Create Media Container').item.json.id }}`

### Node 3: Publish Container
- **Body:**
```json
{
  "creation_id": "{{ $json.container_id }}"
}
```
- Output: `{ "id": "17850902622667195" }` (post ID)

### Node 4: Extract Post ID (Code Node)
```javascript
const publishResponse = $input.first().json;
const postId = publishResponse.id;
const videoId = $input.first().json.video_id; // From Set node

const postUrl = `https://www.instagram.com/p/${postId}/`;

return {
  json: {
    video_id: videoId,
    platform: 'instagram',
    status: 'posted',
    platform_post_id: postId,
    platform_url: postUrl,
    error_message: null,
  }
};
```

## Quick Fix for Your Code

**Replace your code with:**

```javascript
// Get post ID from publish response
const publishResponse = $input.first().json;
const postId = publishResponse.id;

if (!postId) {
  throw new Error('No post ID found in publish response');
}

// Instagram post URL
const postUrl = `https://www.instagram.com/p/${postId}/`;

// Try to get video_id from various sources
let videoId = '';
try {
  videoId = $('Webhook').item.json.body.video_id;
} catch (e) {
  try {
    videoId = $('Get Video Details').item.json.video.id;
  } catch (e2) {
    console.warn('Could not get video_id from previous nodes');
  }
}

console.log('✅ Instagram post published!');
console.log('Post ID:', postId);
console.log('Post URL:', postUrl);
console.log('Video ID:', videoId);

return {
  json: {
    video_id: videoId,
    platform: 'instagram',
    status: 'posted',
    platform_post_id: postId,
    platform_url: postUrl,
    error_message: null,
  }
};
```

## If Video ID is Not Available

If you can't get `video_id` from previous nodes, you can:

1. **Hardcode for testing** (temporarily):
```javascript
video_id: 'test-video-id', // Replace with actual video ID
```

2. **Pass it through Set node** before this Code Node

3. **Get it from the original webhook payload** if it's still accessible

## Test the Code

After fixing, the output should be:
```json
{
  "video_id": "your-video-id",
  "platform": "instagram",
  "status": "posted",
  "platform_post_id": "17850902622667195",
  "platform_url": "https://www.instagram.com/p/17850902622667195/",
  "error_message": null
}
```

