# n8n: Update YouTube URL in Supabase

After successfully publishing a video to YouTube, update the `youtube_url` column in the `air_publisher_videos` table.

## Add HTTP Request Node After YouTube Upload

### HTTP Request Node: "Update YouTube URL in Supabase"

**Method:** POST  
**URL:** `https://airpublisher.vercel.app/api/webhooks/n8n/post-status`  
(Replace with your actual app URL)

**Headers:**
- `x-n8n-api-key: {{ $env.N8N_API_KEY }}`
- `Content-Type: application/json`

**Body (JSON):**
```json
{
  "video_id": "{{ $('Get Video Details').item.json.video.id }}",
  "status": "posted",
  "platform": "youtube",
  "platform_post_id": "{{ $('YouTube Upload').item.json.id }}",
  "youtube_url": "https://www.youtube.com/watch?v={{ $('YouTube Upload').item.json.id }}",
  "published_at": "{{ $now }}"
}
```

## YouTube URL Format

YouTube video URLs follow this format:
```
https://www.youtube.com/watch?v={video_id}
```

Or short format:
```
https://youtu.be/{video_id}
```

## Alternative: If YouTube API Returns Full URL

If the YouTube API response includes a full URL:

**Body:**
```json
{
  "video_id": "{{ $('Get Video Details').item.json.video.id }}",
  "status": "posted",
  "platform": "youtube",
  "youtube_url": "{{ $('YouTube Upload').item.json.url }}",
  "published_at": "{{ $now }}"
}
```

## Expected Response

```json
{
  "success": true,
  "video": {
    "id": "uuid",
    "youtube_url": "https://www.youtube.com/watch?v=abc123",
    "status": "posted",
    ...
  },
  "message": "Video uuid updated successfully"
}
```

## Complete YouTube Workflow

```
[Get Scheduled Posts]
  ↓
[Get Video Details]
  ↓
[YouTube Upload]
  ↓
[Update YouTube URL in Supabase] ← Add this node
```

## Error Handling

If the update fails:
- Check that `video_id` is correct
- Verify `N8N_API_KEY` is set correctly
- Check that the video exists in Supabase
- Verify RLS policies allow updates

## Notes

- The endpoint automatically updates `status` to "posted" and sets `posted_at`
- If `youtube_url` is provided, it will be saved to the `youtube_url` column
- The endpoint is idempotent - safe to call multiple times


