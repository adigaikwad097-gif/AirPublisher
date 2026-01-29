# Fixed HTTP Request Body for n8n

## ❌ What's Wrong

Your current body has these issues:
1. `{{ $json.id }}` - This is the Dropbox file ID, not your video_id
2. `video_url` is using `path_display` - This is just a path, not a URL
3. Syntax error with extra quotes: `{{ $json.id }}""`
4. Missing the shared link URL from the "Get Shared Link" node

## ✅ Correct HTTP Request Body

Use this **exact** JSON in your HTTP Request node:

```json
{
  "video_id": "{{ $json.video_id }}",
  "video_url": "{{ $('Get Shared Link').item.json.url }}",
  "dropbox_path": "{{ $('Upload File').item.json.path_display }}",
  "processing_status": "completed"
}
```

## 🔍 Data Source Explanation

### `video_id`
- **Source**: Initial webhook data (first node)
- **Why**: This is the UUID from your Next.js database, not the Dropbox file ID
- **Access**: `{{ $json.video_id }}` (from the webhook that received the file)

### `video_url`
- **Source**: Dropbox "Get Shared Link" node output
- **Why**: This is the actual shareable URL (like `https://www.dropbox.com/s/...?dl=1`)
- **Access**: `{{ $('Get Shared Link').item.json.url }}`
- **NOT**: `path_display` (that's just a path, not a URL)

### `dropbox_path`
- **Source**: Dropbox "Upload File" node output
- **Why**: This is the file path in Dropbox
- **Access**: `{{ $('Upload File').item.json.path_display }}`
- **Alternative**: `{{ $('Upload File').item.json.path_lower }}` (same thing, lowercase)

## 📋 Step-by-Step Setup

1. **Make sure you have these nodes in order:**
   ```
   Webhook (receives file)
     ↓
   Dropbox: Upload File
     ↓
   Dropbox: Get Shared Link
     ↓
   HTTP Request (calls back to Next.js)
   ```

2. **In the HTTP Request node:**
   - **Method**: `POST`
   - **URL**: `{{ $json.callback_url }}`
   - **Body Content Type**: `JSON`
   - **Body**: Copy the JSON above exactly

3. **Verify data flow:**
   - Run your workflow
   - Click on each node to see its output
   - Make sure `video_id` is available from the webhook node
   - Make sure `url` is available from the "Get Shared Link" node

## 🐛 If `video_id` is Not Available

If `{{ $json.video_id }}` doesn't work, you might need to pass it through the workflow:

1. **After Webhook node**, add a "Set" node to preserve `video_id`:
   ```json
   {
     "video_id": "{{ $json.body.video_id }}",
     "creator_unique_identifier": "{{ $json.body.creator_unique_identifier }}",
     "file_name": "{{ $json.body.file_name }}",
     "callback_url": "{{ $json.body.callback_url }}",
     "file": "{{ $json.body.file }}"
   }
   ```

2. **Then in HTTP Request**, use:
   ```json
   {
     "video_id": "{{ $json.video_id }}",
     "video_url": "{{ $('Get Shared Link').item.json.url }}",
     "dropbox_path": "{{ $('Upload File').item.json.path_display }}",
     "processing_status": "completed"
   }
   ```

## ✅ Expected Final Output

When it works correctly, Next.js should receive:

```json
{
  "video_id": "4630c60c-0430-4584-8dbf-02c9d0cace77",
  "video_url": "https://www.dropbox.com/s/abc123/...?dl=1",
  "dropbox_path": "/airpublisher/creator_xxx/filename.mp4",
  "processing_status": "completed"
}
```

Notice:
- `video_id` is a UUID (from your database)
- `video_url` is a full HTTPS URL (from Dropbox shared link)
- `dropbox_path` is just the path (from upload response)


