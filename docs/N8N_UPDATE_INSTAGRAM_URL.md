# n8n: Update Instagram URL in Supabase

After successfully publishing a video to Instagram, update the `instagram_url` column in the `air_publisher_videos` table.

## Add HTTP Request Node After Instagram Upload

### HTTP Request Node: "Update Instagram URL in Supabase"

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
  "platform": "instagram",
  "platform_post_id": "{{ $('Instagram Upload').item.json.id }}",
  "instagram_url": "https://www.instagram.com/p/{{ $('Instagram Upload').item.json.shortcode }}/",
  "published_at": "{{ $now }}"
}
```

## Instagram URL Format

Instagram post URLs follow this format:
```
https://www.instagram.com/p/{shortcode}/
```

The `shortcode` is typically returned in the Instagram API response after publishing.

## Alternative: If Instagram API Returns Full URL

If the Instagram API response includes a full URL:

**Body:**
```json
{
  "video_id": "{{ $('Get Video Details').item.json.video.id }}",
  "status": "posted",
  "platform": "instagram",
  "instagram_url": "{{ $('Instagram Upload').item.json.permalink }}",
  "published_at": "{{ $now }}"
}
```

## Expected Response

```json
{
  "success": true,
  "video": {
    "id": "uuid",
    "instagram_url": "https://www.instagram.com/p/abc123/",
    "status": "posted",
    ...
  },
  "message": "Video uuid updated successfully"
}
```

## Complete Instagram Workflow

```
[Get Scheduled Posts]
  ↓
[Get Video Details]
  ↓
[Instagram Upload]
  ↓
[Update Instagram URL in Supabase] ← Add this node
```

## Error Handling

If the update fails:
- Check that `video_id` is correct
- Verify `N8N_API_KEY` is set correctly
- Check that the video exists in Supabase
- Verify RLS policies allow updates

## Notes

- The endpoint automatically updates `status` to "posted" and sets `posted_at`
- If `instagram_url` is provided, it will be saved to the `instagram_url` column
- The endpoint is idempotent - safe to call multiple times
- Instagram API may return different field names - check your API response structure


