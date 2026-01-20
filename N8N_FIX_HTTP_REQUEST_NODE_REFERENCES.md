# Fix n8n HTTP Request Node References

## Problem

Your HTTP Request node is using wrong references. The `{{ $json.url }}` is trying to get data from the current node, but it should get it from the previous node (HTTP Request1 - shared link).

## Current (Wrong) Configuration

```json
{
  "video_id": "{{ $('Webhook').item.json.body.video_id }}",
  "video_url": "{{ $json.url }}",  // ❌ Wrong - this is from current node
  "dropbox_path": "{{ $json.path_lower }}",  // ❌ Wrong - this is from current node
  "processing_status": "completed"
}
```

## Fixed Configuration

```json
{
  "video_id": "{{ $('Webhook').item.json.body.video_id }}",
  "video_url": "{{ $('HTTP Request1').item.json.url.replace('?dl=0', '?dl=1') }}",
  "dropbox_path": "{{ $('Upload a file').item.json.path_display }}",
  "processing_status": "completed"
}
```

## Changes Explained

1. **video_url**: 
   - Changed from `{{ $json.url }}` 
   - To `{{ $('HTTP Request1').item.json.url.replace('?dl=0', '?dl=1') }}`
   - Gets URL from HTTP Request1 node (shared link)
   - Changes `?dl=0` to `?dl=1` for direct download

2. **dropbox_path**:
   - Changed from `{{ $json.path_lower }}`
   - To `{{ $('Upload a file').item.json.path_display }}`
   - Gets path from Upload a file node

## How to Fix in n8n

1. Open your HTTP Request node (the one that calls Next.js)
2. Go to **Body** → **JSON**
3. Replace the JSON body with:

```json
{
  "video_id": "{{ $('Webhook').item.json.body.video_id }}",
  "video_url": "{{ $('HTTP Request1').item.json.url.replace('?dl=0', '?dl=1') }}",
  "dropbox_path": "{{ $('Upload a file').item.json.path_display }}",
  "processing_status": "completed"
}
```

4. Save and test

## Also Check: Video Exists

The "Video not found" error means the video doesn't exist in your database. 

**To check:**
1. Go to Supabase Dashboard
2. Table Editor → `air_publisher_videos`
3. Search for video_id: `4ff7ce7e-46c1-4790-adec-9bb28d95e13d`

**If it doesn't exist:**
- The video was never created before upload
- Or it was deleted
- Upload a NEW video (don't retry old ones)

## Test with New Upload

After fixing the node references:
1. Upload a **new** video (don't retry old ones)
2. The video should be created in database first
3. Then n8n processes it
4. Then callback should work

