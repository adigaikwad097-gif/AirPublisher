# TikTok Upload and Publish Steps

## Step 1: Initialize Upload ✅ (COMPLETED)

You received:
```json
{
  "data": {
    "publish_id": "v_pub_file~v2-1.7601447475849021452",
    "upload_url": "https://open-upload-va.tiktokapis.com/upload?upload_id=7601447475849037836&upload_token=d897e4a4-eb09-848f-a343-8d245a550c85"
  }
}
```

## Step 2: Upload Video Binary

Add an **HTTP Request** node after "Initialize Upload":

### HTTP Request Node: "Upload Video to TikTok"

**Method:** PUT  
**URL:** `{{ $('Initialize Upload').item.json.data.upload_url }}`

**Headers:**
```
Content-Type: video/mp4
Content-Range: bytes 0-{{ $('Extract File Metadata from Binary').item.json.video_size - 1 }}/{{ $('Extract File Metadata from Binary').item.json.video_size }}
```

**Body:**
- **Body Content Type:** `Binary Data`
- **Binary Property Name:** `data` (or whatever your binary property is named)
- **Binary Data:** Reference the binary from "Extract File Metadata from Binary" node

**OR** if using the binary from the download node:
- **Binary Data:** `{{ $binary.data }}` or reference the node that has the binary

### Alternative: Using Binary from Previous Node

If you need to reference the binary from "HTTP Request6" (Download Video from Dropbox):

**Body Content Type:** `Binary Data`  
**Binary Property Name:** `data`  
**Binary Data:** Reference it using n8n's binary data selector

## Step 3: Publish Video

After successful upload, add another **HTTP Request** node:

### HTTP Request Node: "Publish Video"

**Method:** POST  
**URL:** `https://open.tiktokapis.com/v2/post/publish/status/fetch/`

**Headers:**
```
Authorization: Bearer {{ $('Extract File Metadata from Binary').item.json.access_token }}
Content-Type: application/json
```

**Body (JSON):**
```json
{
  "publish_id": "{{ $('Initialize Upload').item.json.data.publish_id }}"
}
```

## Complete Workflow

```
[Download Video from Dropbox] 
  ↓
[Extract File Metadata from Binary] 
  ↓
[Initialize Upload] ✅ (You're here)
  ↓
[Upload Video to TikTok] ← Next step
  ↓
[Publish Video] ← After upload
  ↓
[Update Status] (Optional - update your database)
```

## Important Notes

1. **Upload URL**: Use the `upload_url` from Initialize Upload response
2. **Binary Data**: Make sure you're passing the actual video binary data, not just metadata
3. **Content-Range Header**: For single chunk uploads, use `bytes 0-{size-1}/{size}`
4. **Publish ID**: Save the `publish_id` from Initialize Upload - you'll need it for publishing

## Troubleshooting

### If Upload Fails:
- Check that binary data is being passed correctly
- Verify Content-Range header matches your file size
- Make sure upload_url is used exactly as returned (don't modify it)

### If Publish Fails:
- Verify publish_id is correct
- Check access_token is still valid
- Make sure upload completed successfully first


