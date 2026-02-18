# Extracting Metadata from Binary Files in n8n

This guide shows how to extract file metadata (size, etc.) from binary files downloaded in n8n workflows.

## Problem

When you download a file using n8n's HTTP Request node with "File" response format, you get binary data. To use this file with APIs like TikTok's upload API, you need to extract metadata like:
- File size (in bytes)
- Chunk size
- Total chunk count

## Solution: Code Node

After downloading the binary file, add a **Code** node to extract metadata.

### Step 1: Download Binary File

**HTTP Request** node:
- **Method:** GET
- **URL:** `{{ $json.video_url }}` (your Dropbox URL with `?dl=1`)
- **Response Format:** File
- **Output:** Binary data stored in `$binary`

### Step 2: Extract Metadata with Code Node

**Code** node (JavaScript):

```javascript
// Get binary data from the previous HTTP Request node
// In n8n, binary data is available in $binary object
const binaryData = $binary.data;

// Extract file size from binary data
// Binary data in n8n is a Buffer, so we can use .length
const videoSize = binaryData.length || binaryData.byteLength || 0;

// Calculate chunk size (10MB = 10,000,000 bytes)
// TikTok recommends 10MB chunks for large files
const chunkSize = 10000000;

// Calculate total number of chunks needed
const totalChunkCount = Math.ceil(videoSize / chunkSize);

// Get any additional data from previous nodes
const videoDetails = $('Get Video & Tokens').item.json;
const tokens = videoDetails.platform_tokens;

// Return both JSON data and binary data
return {
  json: {
    // File metadata
    video_size: videoSize,
    chunk_size: chunkSize,
    total_chunk_count: totalChunkCount,
    
    // Formatted sizes for logging
    video_size_mb: (videoSize / (1024 * 1024)).toFixed(2),
    video_size_gb: (videoSize / (1024 * 1024 * 1024)).toFixed(2),
    
    // TikTok API required fields
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
    
    // Tokens and IDs
    access_token: tokens.access_token,
    open_id: tokens.open_id || tokens.tiktok_open_id,
    
    // Video reference
    video_id: videoDetails.video.id,
    creator_unique_identifier: videoDetails.video.creator_unique_identifier
  },
  
  // IMPORTANT: Pass through the binary data so it's available in next nodes
  binary: {
    data: binaryData
  }
};
```

### Step 3: Use the Metadata

The Code node output can now be used in subsequent nodes:

**Example - TikTok Initialize Upload:**
```json
{
  "post_info": {{ $('Extract File Metadata').item.json.post_info }},
  "source_info": {{ $('Extract File Metadata').item.json.source_info }}
}
```

**Example - Access Binary Data:**
- In HTTP Request node for upload, use `$binary.data` from the Code node output
- Or reference: `{{ $('Extract File Metadata').binary.data }}`

## Key Points

1. **Binary Data Access:**
   - Binary data from HTTP Request is in `$binary.data`
   - It's a Buffer object in Node.js
   - Use `.length` or `.byteLength` to get size

2. **Passing Binary Data:**
   - When returning from Code node, include `binary: { data: binaryData }`
   - This makes the binary data available to subsequent nodes

3. **File Size:**
   - Size is in bytes
   - For MB: `size / (1024 * 1024)`
   - For GB: `size / (1024 * 1024 * 1024)`

4. **Chunked Uploads:**
   - TikTok recommends 10MB chunks
   - Calculate chunks: `Math.ceil(fileSize / chunkSize)`
   - Upload chunks sequentially with proper `Content-Range` headers

## Alternative: Get Size from HTTP Headers

If you don't need the full file downloaded yet, you can get the size from HTTP HEAD request:

**HTTP Request** node:
- **Method:** HEAD
- **URL:** `{{ $json.video_url }}`
- **Response:** Headers only (no body)

**Code** node to extract `Content-Length`:
```javascript
const contentLength = $input.item.headers['content-length'] || 
                      $input.item.headers['Content-Length'] || 
                      0;

return {
  json: {
    video_size: parseInt(contentLength, 10),
    chunk_size: 10000000,
    total_chunk_count: Math.ceil(parseInt(contentLength, 10) / 10000000)
  }
};
```

**Note:** This only works if the server returns `Content-Length` header. Dropbox shared links may not always include this.

## Troubleshooting

### "Cannot read property 'length' of undefined"
- Make sure the HTTP Request node is set to "File" response format
- Check that the download was successful
- Verify the binary data exists: `console.log($binary)`

### "Binary data not available in next node"
- Make sure you return `binary: { data: binaryData }` in the Code node
- Check that you're referencing the correct node name

### "File size is 0"
- The download might have failed
- Check the HTTP Request node response
- Verify the URL is correct and accessible

## Example Workflow

```
[Webhook] 
  ↓
[Get Video & Tokens] → HTTP POST to /api/n8n/post-now
  ↓
[Download Video from Dropbox] → HTTP GET (Response: File)
  ↓
[Extract File Metadata] → Code node (extract size, calculate chunks)
  ↓
[Initialize TikTok Upload] → HTTP POST with metadata
  ↓
[Upload Video to TikTok] → HTTP PUT with binary data
  ↓
[Publish Video] → HTTP POST to publish endpoint
```

---

**Need more help?** Check n8n's execution logs to see the actual binary data structure and size values.


