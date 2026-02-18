# n8n: Update TikTok URL in Supabase

After successfully publishing a video to TikTok, update the `tiktok_url` column in the `air_publisher_videos` table.

## Add HTTP Request Node After "Publish Video"

### HTTP Request Node: "Update TikTok URL in Supabase"

**Method:** POST  
**URL:** `https://airpublisher.vercel.app/api/webhooks/n8n/post-status`  
(Replace with your actual app URL)

**Headers:**
- `x-n8n-api-key: {{ $env.N8N_API_KEY }}`
- `Content-Type: application/json`

**Body (JSON):**
```json
{
  "video_id": "{{ $('Code in JavaScript5').item.json.video_id }}",
  "status": "posted",
  "platform": "tiktok",
  "platform_post_id": "{{ $('HTTP Request5').item.json.data.publish_id }}",
  "tiktok_url": "{{ $('Get Publish Status').item.json.data.share_url }}",
  "published_at": "{{ $now }}"
}
```

## If You Have Video URL from Video List API

If you successfully queried the video list and got `share_url`:

**Body:**
```json
{
  "video_id": "{{ $('Code in JavaScript5').item.json.video_id }}",
  "status": "posted",
  "platform": "tiktok",
  "tiktok_url": "{{ $('Get Video URL').item.json.data.videos[0].share_url }}",
  "published_at": "{{ $now }}"
}
```

## If You Only Have Publish ID (No Video URL Yet)

Store the publish_id for later retrieval:

**Body:**
```json
{
  "video_id": "{{ $('Code in JavaScript5').item.json.video_id }}",
  "status": "posted",
  "platform": "tiktok",
  "platform_post_id": "{{ $('HTTP Request5').item.json.data.publish_id }}",
  "published_at": "{{ $now }}"
}
```

Later, when you have `video.list` scope, you can update the URL.

## Expected Response

```json
{
  "success": true,
  "video": {
    "id": "uuid",
    "tiktok_url": "https://www.tiktok.com/@username/video/1234567890",
    "status": "posted",
    ...
  },
  "message": "Video uuid updated successfully"
}
```

## Complete TikTok Workflow

```
[Get Video from Supabase]
  ↓
[Get Tokens from Supabase]
  ↓
[Download Video from Dropbox]
  ↓
[Extract Metadata]
  ↓
[Initialize Upload]
  ↓
[Upload Video]
  ↓
[Publish Video]
  ↓
[Get Video URL] (if you have video.list scope)
  ↓
[Update TikTok URL in Supabase] ← Add this node
```

## Error Handling

If the update fails:
- Check that `video_id` is correct
- Verify `N8N_API_KEY` is set correctly
- Check that the video exists in Supabase
- Verify RLS policies allow updates

## Notes

- The endpoint automatically updates `status` to "posted" and sets `posted_at`
- If `tiktok_url` is provided, it will be saved to the `tiktok_url` column
- The endpoint is idempotent - safe to call multiple times


