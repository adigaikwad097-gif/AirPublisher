# n8n: Update TikTok URL Directly in Supabase

After successfully publishing a video to TikTok, update the `tiktok_url` column directly in Supabase using n8n's Supabase node.

## Add Supabase Node After "Publish Video"

### Supabase Node: "Update TikTok URL"

**Operation:** Update  
**Table:** `air_publisher_videos`  
**Update Key:** `id`  
**Update Key Value:** `{{ $('Code in JavaScript5').item.json.video_id }}`

**Fields to Update:**
- `tiktok_url`: `{{ $('Get Video URL').item.json.data.videos[0].share_url }}`
- `status`: `posted`
- `posted_at`: `{{ $now }}`

## If You Have Video URL from Video List API

If you successfully queried the video list and got `share_url`:

**Fields:**
```json
{
  "tiktok_url": "{{ $('Get Video URL').item.json.data.videos[0].share_url }}",
  "status": "posted",
  "posted_at": "{{ $now }}"
}
```

## If You Only Have Publish ID (No Video URL Yet)

Store the publish_id for later retrieval. You can still update status:

**Fields:**
```json
{
  "status": "posted",
  "posted_at": "{{ $now }}"
}
```

Later, when you have `video.list` scope, you can update the URL in a separate workflow.

## Alternative: Using Publish Status Response

If the publish status endpoint returns `share_url`:

**Fields:**
```json
{
  "tiktok_url": "{{ $('Get Publish Status').item.json.data.share_url }}",
  "status": "posted",
  "posted_at": "{{ $now }}"
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
[Update TikTok URL in Supabase] ← Add this Supabase node
```

## Supabase Node Configuration

1. **Select Operation:** `Update`
2. **Table:** `air_publisher_videos`
3. **Update Key:** `id`
4. **Update Key Value:** Expression `{{ $('Code in JavaScript5').item.json.video_id }}`
5. **Fields to Update:** Use the JSON format above

## Error Handling

If the update fails:
- Check that `video_id` is correct
- Verify Supabase credentials are configured in n8n
- Check that the video exists in Supabase
- Verify RLS policies allow updates (should work with service role)

## Notes

- The Supabase node uses your configured Supabase credentials
- Updates are atomic - either all fields update or none
- The `updated_at` column is automatically updated by the database trigger
- You can update multiple fields in one operation


