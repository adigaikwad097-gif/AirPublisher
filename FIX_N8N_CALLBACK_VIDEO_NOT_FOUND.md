# Fix: n8n Callback - Video Not Found

## Problem

The HTTP Request node is calling Next.js but getting "Video not found after update" error.

## Root Cause

The video ID `4ff7ce7e-46c1-4790-adec-9bb28d95e13d` doesn't exist in the database when n8n tries to update it.

## Possible Causes

1. **Video was never created** - The video record wasn't created before upload
2. **Video was deleted** - The video was removed from database
3. **Wrong video_id** - The ID being sent doesn't match what's in the database
4. **RLS blocking** - Row Level Security is preventing the update

## Check Your Workflow Data

In n8n, check what data is available at each node:

1. **After Webhook node**: 
   - Check `$json.body.video_id` - is it correct?
   - Check `$json.body.callback_url` - is it correct?

2. **After Upload a file node**:
   - Check `$json.path_display` - this is the Dropbox path
   - Check `$json.path_lower` - this is the lowercased path

3. **After HTTP Request1 (shared link)**:
   - Check `$json.url` - this should be the Dropbox shared link
   - The URL should have `?dl=0` - you might need to change it to `?dl=1`

## Fix the HTTP Request Node

Your HTTP Request node body should be:

```json
{
  "video_id": "{{ $('Webhook').item.json.body.video_id }}",
  "video_url": "{{ $('HTTP Request1').item.json.url.replace('?dl=0', '?dl=1') }}",
  "dropbox_path": "{{ $('Upload a file').item.json.path_display }}",
  "processing_status": "completed"
}
```

**Important changes:**
- Use `$('HTTP Request1').item.json.url` to get the shared link from the previous node
- Use `.replace('?dl=0', '?dl=1')` to make it a direct download link
- Use `$('Upload a file').item.json.path_display` for the Dropbox path

## Verify Video Exists

Before the callback, add a debug step or check in Supabase:

1. Go to Supabase Dashboard
2. Table Editor → `air_publisher_videos`
3. Search for the video_id
4. If it doesn't exist, the video was never created

## Alternative: Make Callback Optional

If the video doesn't exist, you could make the callback handle that gracefully, but it's better to ensure the video exists first.


