# Fix: "Unexpected end of input" Error in n8n Code Node

## Quick Fix

The "Unexpected end of input" error usually means there's a missing closing brace, bracket, or parenthesis. Here's a **minimal working version** to test first:

### Minimal Test Version (Copy this exactly):

```javascript
// Try different ways to access binary data
let binaryData = null;
if ($binary && $binary.data) {
  binaryData = $binary.data;
} else if ($input && $input.binary && $input.binary.data) {
  binaryData = $input.binary.data;
} else {
  // Reference the previous node by name
  const prevNode = $('Download Video from Dropbox');
  if (prevNode && prevNode.binary && prevNode.binary.data) {
    binaryData = prevNode.binary.data;
  }
}

const videoSize = binaryData ? (binaryData.length || binaryData.byteLength || 0) : 0;
const chunkSize = 10000000;
const totalChunkCount = videoSize > 0 ? Math.ceil(videoSize / chunkSize) : 1;

return {
  json: {
    video_size: videoSize,
    chunk_size: chunkSize,
    total_chunk_count: totalChunkCount
  },
  binary: binaryData ? {
    data: binaryData
  } : undefined
};
```

### If the minimal version works, use this full version:

```javascript
// Get binary data from the previous HTTP Request node
let binaryData = null;
let videoSize = 0;

// Try different ways to access binary data in n8n
if ($binary && $binary.data) {
  binaryData = $binary.data;
} else if ($input && $input.binary && $input.binary.data) {
  binaryData = $input.binary.data;
} else {
  // Reference the previous node by name (replace with your actual node name)
  const prevNode = $('Download Video from Dropbox');
  if (prevNode && prevNode.binary && prevNode.binary.data) {
    binaryData = prevNode.binary.data;
  }
}

// Extract file size
if (binaryData) {
  videoSize = binaryData.length || binaryData.byteLength || 0;
}

const chunkSize = 10000000;
const totalChunkCount = videoSize > 0 ? Math.ceil(videoSize / chunkSize) : 1;

const videoDetails = $('Get Video & Tokens').item.json;
const tokens = videoDetails.platform_tokens || {};

return {
  json: {
    video_size: videoSize,
    chunk_size: chunkSize,
    total_chunk_count: totalChunkCount,
    post_info: {
      title: videoDetails.video.title || 'Untitled Video',
      privacy_level: "PUBLIC_TO_EVERYONE",
      disable_duet: false,
      disable_comment: false,
      disable_stitch: false,
      video_cover_timestamp_ms: 1000
    },
    source_info: {
      source: "FILE_UPLOAD",
      video_size: videoSize,
      chunk_size: chunkSize,
      total_chunk_count: totalChunkCount
    },
    access_token: tokens.access_token,
    open_id: tokens.open_id || tokens.tiktok_open_id,
    video_id: videoDetails.video.id,
    creator_unique_identifier: videoDetails.video.creator_unique_identifier
  },
  binary: binaryData ? {
    data: binaryData
  } : undefined
};
```

## Common Causes of "Unexpected end of input"

1. **Missing closing brace `}`** - Check all opening braces have closing braces
2. **Missing closing bracket `]`** - Check all opening brackets have closing brackets  
3. **Missing closing parenthesis `)`** - Check all opening parentheses have closing parentheses
4. **Incomplete copy-paste** - Make sure you copied the entire code block
5. **Hidden characters** - Sometimes copy-pasting from markdown adds hidden characters

## How to Debug

1. **Start with minimal code** - Use the minimal test version above
2. **Add code incrementally** - Add one section at a time to find where it breaks
3. **Check n8n execution logs** - Look at the error details in n8n's execution view
4. **Validate JSON structure** - Make sure all objects are properly closed

## Alternative: Use n8n's Expression Editor

Instead of a Code node, you can also use n8n's expression syntax in other nodes:

- `{{ $binary.data.length }}` - Get file size
- `{{ Math.ceil($binary.data.length / 10000000) }}` - Calculate chunks

However, for complex logic, the Code node is better.

## Still Getting Errors?

1. **Check the HTTP Request node** - Make sure:
   - Response Format is set to **"File"** (not "JSON" or "String")
   - The node executed successfully
   - The URL is correct and accessible

2. **Check the node name** - Make sure `'Download Video from Dropbox'` matches your actual HTTP Request node name exactly (case-sensitive)

3. **Debug binary data access** - Add this at the top of your Code node to see what's available:
   ```javascript
   console.log('$binary:', $binary);
   console.log('$input:', $input);
   console.log('Previous node:', $('Download Video from Dropbox'));
   ```

4. **Alternative: Use item index** - If referencing by name doesn't work, try:
   ```javascript
   const items = $input.all();
   const binaryData = items[0].binary && items[0].binary.data;
   ```

5. **Check n8n version** - Different n8n versions may access binary data differently. Check your n8n documentation for the correct syntax.

---

## Best Approach: Get Size from HTTP Response Headers

Based on the actual n8n data format, the HTTP Request node with Response Format "File" includes the `content-length` header in the response. This is the most reliable way to get the file size:

### Code Node (Using Content-Length Header)

```javascript
// Get file size from HTTP response headers
let videoSize = 0;
let binaryData = null;

// Try to get size from content-length header
const httpResponse = $input.first();
if (httpResponse && httpResponse.json && httpResponse.json.headers) {
  const contentLength = httpResponse.json.headers['content-length'];
  if (contentLength) {
    videoSize = parseInt(contentLength, 10) || 0;
  }
}

// Also try to access binary data (for passing it through)
if ($binary && $binary.data) {
  binaryData = $binary.data;
} else if ($input && $input.first() && $input.first().binary && $input.first().binary.data) {
  binaryData = $input.first().binary.data;
} else {
  // Reference the previous node by name
  const prevNode = $('Download Video from Dropbox');
  if (prevNode && prevNode.item && prevNode.item.binary && prevNode.item.binary.data) {
    binaryData = prevNode.item.binary.data;
  }
}

const chunkSize = 10000000;
const totalChunkCount = videoSize > 0 ? Math.ceil(videoSize / chunkSize) : 1;

const videoDetails = $('Get Video & Tokens').item.json;
const tokens = videoDetails.platform_tokens || {};

return {
  json: {
    video_size: videoSize,
    chunk_size: chunkSize,
    total_chunk_count: totalChunkCount,
    post_info: {
      title: videoDetails.video.title || 'Untitled Video',
      privacy_level: "PUBLIC_TO_EVERYONE",
      disable_duet: false,
      disable_comment: false,
      disable_stitch: false,
      video_cover_timestamp_ms: 1000
    },
    source_info: {
      source: "FILE_UPLOAD",
      video_size: videoSize,
      chunk_size: chunkSize,
      total_chunk_count: totalChunkCount
    },
    access_token: tokens.access_token,
    open_id: tokens.open_id || tokens.tiktok_open_id,
    video_id: videoDetails.video.id,
    creator_unique_identifier: videoDetails.video.creator_unique_identifier
  },
  binary: binaryData ? {
    data: binaryData
  } : undefined
};
```

**This approach uses the `content-length` header which is always available in the HTTP response!**

---

## Alternative Approach: Get Size from Dropbox API Instead

If accessing binary data is problematic, you can get the file size from Dropbox API **before** downloading the file:

### Step 1: Get File Size from Dropbox API

**HTTP Request** node:
- **Method:** POST
- **URL:** `https://api.dropboxapi.com/2/sharing/get_shared_link_metadata`
- **Headers:**
  ```
  Authorization: Bearer {{ $env.DROPBOX_ACCESS_TOKEN }}
  Content-Type: application/json
  ```
- **Body:**
  ```json
  {
    "url": "{{ $('Get Video & Tokens').item.json.video.video_url }}"
  }
  ```
- **Response:** Contains `size` field

### Step 2: Code Node (No Binary Data Needed)

```javascript
// Get size from Dropbox API response
const dropboxMetadata = $('Get Video File Size from Dropbox API').item.json;
const videoSize = dropboxMetadata.size || 0;

const chunkSize = 10000000;
const totalChunkCount = videoSize > 0 ? Math.ceil(videoSize / chunkSize) : 1;

const videoDetails = $('Get Video & Tokens').item.json;
const tokens = videoDetails.platform_tokens || {};

return {
  json: {
    video_size: videoSize,
    chunk_size: chunkSize,
    total_chunk_count: totalChunkCount,
    post_info: {
      title: videoDetails.video.title || 'Untitled Video',
      privacy_level: "PUBLIC_TO_EVERYONE",
      disable_duet: false,
      disable_comment: false,
      disable_stitch: false,
      video_cover_timestamp_ms: 1000
    },
    source_info: {
      source: "FILE_UPLOAD",
      video_size: videoSize,
      chunk_size: chunkSize,
      total_chunk_count: totalChunkCount
    },
    access_token: tokens.access_token,
    open_id: tokens.open_id || tokens.tiktok_open_id,
    video_id: videoDetails.video.id,
    creator_unique_identifier: videoDetails.video.creator_unique_identifier
  }
};
```

### Step 3: Download Video (After Getting Size)

Then download the video in a separate HTTP Request node, and the binary data will be available for upload.

**This approach avoids the binary data access issue entirely!**

---

**Tip:** In n8n, you can also use the "Execute Workflow" button to test the Code node with sample data before running the full workflow.

