# TikTok Publish Video - Final Step

## ✅ Upload Complete!

An empty response `[{}]` from the upload endpoint means **success**! TikTok's upload API returns minimal output when the upload completes successfully.

## Step 3: Publish Video

Now add the final HTTP Request node to publish the video:

### HTTP Request Node: "Publish Video"

**Method:** POST  
**URL:** `https://open.tiktokapis.com/v2/post/publish/status/fetch/`

**Headers:**
- `Authorization: Bearer {{ $('Code in JavaScript5').item.json.access_token }}`
- `Content-Type: application/json`

**Body (JSON):**
```json
{
  "publish_id": "{{ $('HTTP Request5').item.json.data.publish_id }}"
}
```

**Note:** Replace `HTTP Request5` with your actual "Initialize Upload" node name if different.

## Expected Response

On success, you'll get:
```json
{
  "data": {
    "publish_id": "v_pub_file~v2-1.7601447475849021452",
    "status": "processing" | "published" | "failed"
  },
  "error": {
    "code": "ok",
    "message": "",
    "log_id": "..."
  }
}
```

**Status values:**
- `"processing"` - Video is being processed by TikTok
- `"published"` - Video is live on TikTok
- `"failed"` - Upload/publish failed

## Complete Workflow

```
[Get a row4] → Get video URL
  ↓
[Get a row5] → Get tokens
  ↓
[HTTP Request6] → Download video (binary)
  ↓
[Code in JavaScript5] → Extract metadata + pass binary
  ↓
[HTTP Request5] → Initialize Upload ✅
  ↓
[HTTP Request7] → Upload Video ✅ (You're here - empty response = success!)
  ↓
[Publish Video] ← Next step
  ↓
[Update Status] (Optional - update your database)
```

## After Publishing

### Option 1: Check Publish Status (Polling)

TikTok videos may take time to process. You can poll the status:

**HTTP Request Node: "Check Publish Status"**

**Method:** POST  
**URL:** `https://open.tiktokapis.com/v2/post/publish/status/fetch/`

**Headers:**
- `Authorization: Bearer {{ $('Code in JavaScript5').item.json.access_token }}`
- `Content-Type: application/json`

**Body:**
```json
{
  "publish_id": "{{ $('HTTP Request5').item.json.data.publish_id }}"
}
```

Repeat this every few seconds until status is `"published"` or `"failed"`.

### Option 2: Update Your Database

After successful publish, update your video status:

**HTTP Request Node: "Update Video Status"**

**Method:** POST  
**URL:** `https://your-app-url.com/api/webhooks/n8n/post-status`

**Headers:**
- `x-n8n-api-key: {{ $env.N8N_API_KEY }}`

**Body:**
```json
{
  "video_id": "{{ $('Code in JavaScript5').item.json.video_id }}",
  "status": "posted",
  "platform_post_id": "{{ $('Publish Video').item.json.data.publish_id }}",
  "platform": "tiktok"
}
```

## Troubleshooting

### If Publish Returns "processing"
- This is normal - TikTok needs time to process the video
- Poll the status endpoint every 5-10 seconds
- Usually takes 30 seconds to a few minutes

### If Publish Returns "failed"
- Check the error message in the response
- Verify video format is supported by TikTok
- Check file size limits
- Verify access token is still valid

## Success!

Once you get `"status": "published"`, your video is live on TikTok! 🎉


