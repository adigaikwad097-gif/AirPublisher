# n8n: Update Instagram URL Directly in Supabase

After successfully publishing a video to Instagram, update the `instagram_url` column directly in Supabase using n8n's Supabase node.

## Add Supabase Node After Instagram Upload

### Supabase Node: "Update Instagram URL"

**Operation:** Update  
**Table:** `air_publisher_videos`  
**Update Key:** `id`  
**Update Key Value:** `{{ $('Get Video Details').item.json.video.id }}`

**Fields to Update:**
- `instagram_url`: `https://www.instagram.com/p/{{ $('Instagram Upload').item.json.shortcode }}/`
- `status`: `posted`
- `posted_at`: `{{ $now }}`

## Instagram URL Format

Instagram post URLs follow this format:
```
https://www.instagram.com/p/{shortcode}/
```

The `shortcode` is typically returned in the Instagram API response after publishing.

## Fields Configuration

**Fields:**
```json
{
  "instagram_url": "https://www.instagram.com/p/{{ $('Instagram Upload').item.json.shortcode }}/",
  "status": "posted",
  "posted_at": "{{ $now }}"
}
```

## Alternative: If Instagram API Returns Full URL

If the Instagram API response includes a full URL (e.g., `permalink`):

**Fields:**
```json
{
  "instagram_url": "{{ $('Instagram Upload').item.json.permalink }}",
  "status": "posted",
  "posted_at": "{{ $now }}"
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
[Update Instagram URL in Supabase] ← Add this Supabase node
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
- Check Instagram API response structure - field names may vary

## Notes

- The Supabase node uses your configured Supabase credentials
- Updates are atomic - either all fields update or none
- The `updated_at` column is automatically updated by the database trigger
- You can update multiple fields in one operation
- Instagram API may return different field names - check your API response structure


