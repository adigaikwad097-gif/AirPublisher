# n8n: Update YouTube URL Directly in Supabase

After successfully publishing a video to YouTube, update the `youtube_url` column directly in Supabase using n8n's Supabase node.

## Add Supabase Node After YouTube Upload

### Supabase Node: "Update YouTube URL"

**Operation:** Update  
**Table:** `air_publisher_videos`  
**Update Key:** `id`  
**Update Key Value:** `{{ $('Get Video Details').item.json.video.id }}`

**Fields to Update:**
- `youtube_url`: `https://www.youtube.com/watch?v={{ $('YouTube Upload').item.json.id }}`
- `status`: `posted`
- `posted_at`: `{{ $now }}`

## YouTube URL Format

YouTube video URLs follow this format:
```
https://www.youtube.com/watch?v={video_id}
```

Or short format:
```
https://youtu.be/{video_id}
```

## Fields Configuration

**Fields:**
```json
{
  "youtube_url": "https://www.youtube.com/watch?v={{ $('YouTube Upload').item.json.id }}",
  "status": "posted",
  "posted_at": "{{ $now }}"
}
```

## Alternative: If YouTube API Returns Full URL

If the YouTube API response includes a full URL:

**Fields:**
```json
{
  "youtube_url": "{{ $('YouTube Upload').item.json.url }}",
  "status": "posted",
  "posted_at": "{{ $now }}"
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
[Update YouTube URL in Supabase] ← Add this Supabase node
```

## Supabase Node Configuration

1. **Select Operation:** `Update`
2. **Table:** `air_publisher_videos`
3. **Update Key:** `id`
4. **Update Key Value:** Expression `{{ $('Get Video Details').item.json.video.id }}`
5. **Fields to Update:** Use the JSON format above

## Error Handling

If the update fails:
- Check that `video_id` is correct
- Verify Supabase credentials are configured in n8n
- Check that the video exists in Supabase
- Verify RLS policies allow updates

## Notes

- The Supabase node uses your configured Supabase credentials
- Updates are atomic - either all fields update or none
- The `updated_at` column is automatically updated by the database trigger
- You can update multiple fields in one operation


