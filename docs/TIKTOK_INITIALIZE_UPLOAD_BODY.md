# TikTok Initialize Upload - Request Body

## HTTP Request Node Configuration

**Method:** POST  
**URL:** `https://open.tiktokapis.com/v2/post/publish/inbox/video/init/`

**Headers:**
```
Authorization: Bearer {{ $('Extract File Metadata from Binary').item.json.access_token }}
Content-Type: application/json
```

## Body (JSON)

### Option 1: Using n8n Expression (Recommended)

In n8n, set the body to **JSON** and use:

```json
{
  "post_info": {{ $('Extract File Metadata from Binary').item.json.post_info }},
  "source_info": {{ $('Extract File Metadata from Binary').item.json.source_info }}
}
```

**Note:** In n8n, when using expressions in JSON body, you need to use the expression syntax. If the above doesn't work, try:

```json
{
  "post_info": {{ JSON.stringify($('Extract File Metadata from Binary').item.json.post_info) }},
  "source_info": {{ JSON.stringify($('Extract File Metadata from Binary').item.json.source_info) }}
}
```

### Option 2: Manual JSON Structure

If you need to build it manually, here's the structure:

```json
{
  "post_info": {
    "title": "{{ $('Extract File Metadata from Binary').item.json.post_info.title }}",
    "privacy_level": "PUBLIC_TO_EVERYONE",
    "disable_duet": false,
    "disable_comment": false,
    "disable_stitch": false,
    "video_cover_timestamp_ms": 1000
  },
  "source_info": {
    "source": "FILE_UPLOAD",
    "video_size": {{ $('Extract File Metadata from Binary').item.json.video_size }},
    "chunk_size": {{ $('Extract File Metadata from Binary').item.json.chunk_size }},
    "total_chunk_count": {{ $('Extract File Metadata from Binary').item.json.total_chunk_count }}
  }
}
```

### Option 3: Using Code Node to Build Body

If expressions don't work, you can use a Code node before the Initialize Upload node:

```javascript
const metadata = $('Extract File Metadata from Binary').item.json;

return {
  json: {
    post_info: metadata.post_info,
    source_info: metadata.source_info
  }
};
```

Then in the HTTP Request node, use:
```json
{
  "post_info": {{ $json.post_info }},
  "source_info": {{ $json.source_info }}
}
```

## Expected Response

```json
{
  "data": {
    "upload_url": "https://open-api.tiktok.com/video/upload/...",
    "publish_id": "publish-id-here"
  }
}
```

## Example Complete Body (for reference)

```json
{
  "post_info": {
    "title": "video 01",
    "privacy_level": "PUBLIC_TO_EVERYONE",
    "disable_duet": false,
    "disable_comment": false,
    "disable_stitch": false,
    "video_cover_timestamp_ms": 1000
  },
  "source_info": {
    "source": "FILE_UPLOAD",
    "video_size": 10315842,
    "chunk_size": 10000000,
    "total_chunk_count": 2
  }
}
```

## n8n Setup Steps

1. **Add HTTP Request Node** after your "Extract File Metadata from Binary" Code node
2. **Set Method:** POST
3. **Set URL:** `https://open.tiktokapis.com/v2/post/publish/inbox/video/init/`
4. **Add Header:**
   - Name: `Authorization`
   - Value: `Bearer {{ $('Extract File Metadata from Binary').item.json.access_token }}`
5. **Add Header:**
   - Name: `Content-Type`
   - Value: `application/json`
6. **Set Body:**
   - Body Content Type: `JSON`
   - JSON Body: Use Option 1 above (the expression syntax)

## Troubleshooting

If you get errors:
- Make sure the node name `'Extract File Metadata from Binary'` matches exactly (case-sensitive)
- Try using `$json` if the Code node is directly before the HTTP Request node
- Check that `access_token` is not empty
- Verify `video_size`, `chunk_size`, and `total_chunk_count` are numbers, not strings


