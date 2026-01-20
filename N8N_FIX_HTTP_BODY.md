# Fix: HTTP Request Body - Correct Format

## ❌ Your Current Body (Has Errors)

```json
{
  "video_id": {{ $json.id }}"",
  "video_url": "{{ $json.path_display }}",
  "dropbox_path": "{{ $json.path_lower }}",
  "processing_status": "completed"
}
```

**Problems:**
1. `{{ $json.id }}` - This gets the Dropbox file ID (`id:MZkNMAInpEQ...`), not your video UUID
2. `video_url` uses `path_display` - This is just a path (`/airpublisher/...`), not a URL
3. Syntax error: `{{ $json.id }}""` has extra quotes
4. Missing the shared link URL from the "Get Shared Link" node

## ✅ Correct HTTP Request Body

Based on the actual Dropbox response (which is an array), use this:

```json
{
  "video_id": "{{ $json.video_id }}",
  "video_url": "{{ $('Create Shared Link').item.json[0].url.replace('?dl=0', '?dl=1') }}",
  "dropbox_path": "{{ $('Upload File').item.json.path_display }}",
  "processing_status": "completed"
}
```

**Important:**
- Dropbox returns an **array**, so use `[0]` to access the first item
- The URL has `?dl=0` - replace with `?dl=1` for direct download
- Replace `'Create Shared Link'` with your actual HTTP Request node name

## 🔍 Where Each Field Comes From

### 1. `video_id`
- **Source**: Initial webhook (first node) that received the file
- **Access**: `{{ $json.video_id }}` or `{{ $json.body.video_id }}`
- **Why**: This is the UUID from your Next.js database (like `4630c60c-0430-4584-8dbf-02c9d0cace77`)
- **NOT**: `{{ $json.id }}` (that's the Dropbox file ID)

### 2. `video_url`
- **Source**: Dropbox "Get Shared Link" node output
- **Access**: `{{ $('Get Shared Link').item.json.url }}`
- **Why**: This is the actual shareable URL (like `https://www.dropbox.com/s/abc123/...?dl=1`)
- **NOT**: `{{ $json.path_display }}` (that's just a path, not a URL)

### 3. `dropbox_path`
- **Source**: Dropbox "Upload File" node output
- **Access**: `{{ $('Upload File').item.json.path_display }}`
- **Why**: This is the file path in Dropbox (like `/airpublisher/creator_xxx/file.mp4`)
- **Alternative**: `{{ $('Upload File').item.json.path_lower }}` (same thing)

## 📋 Complete Workflow Structure

Your n8n workflow should look like this:

```
1. Webhook (receives file + video_id)
   ↓ Output: { body: { video_id, file, ... } }
   
2. Extract/Set (preserve video_id)
   ↓ Output: { video_id, file, ... }
   
3. Dropbox: Upload File
   ↓ Output: { path_display, id, ... }
   
4. Dropbox: Get Shared Link
   ↓ Output: { url: "https://www.dropbox.com/..." }
   
5. HTTP Request (calls back)
   ↓ Uses: video_id from step 2, url from step 4, path_display from step 3
```

## 🔧 If `video_id` is Not Available

If `{{ $json.video_id }}` doesn't work, the webhook might have parsed FormData differently:

**Option 1: Access from body**
```json
{
  "video_id": "{{ $json.body.video_id }}",
  "video_url": "{{ $('Get Shared Link').item.json.url }}",
  "dropbox_path": "{{ $('Upload File').item.json.path_display }}",
  "processing_status": "completed"
}
```

**Option 2: Add a "Set" node after webhook**
After the webhook node, add a "Set" node to extract FormData fields:

```json
{
  "video_id": "{{ $json.body.video_id }}",
  "creator_unique_identifier": "{{ $json.body.creator_unique_identifier }}",
  "file_name": "{{ $json.body.file_name }}",
  "callback_url": "{{ $json.body.callback_url }}",
  "file": "{{ $json.body.file }}"
}
```

Then in HTTP Request, use:
```json
{
  "video_id": "{{ $json.video_id }}",
  "video_url": "{{ $('Get Shared Link').item.json.url }}",
  "dropbox_path": "{{ $('Upload File').item.json.path_display }}",
  "processing_status": "completed"
}
```

## ✅ Expected Output to Next.js

When correct, Next.js receives:

```json
{
  "video_id": "4630c60c-0430-4584-8dbf-02c9d0cace77",
  "video_url": "https://www.dropbox.com/s/abc123def456/file.mp4?dl=1",
  "dropbox_path": "/airpublisher/creator_xxx/file.mp4",
  "processing_status": "completed"
}
```

**Key differences:**
- ✅ `video_id` is a UUID (not Dropbox file ID)
- ✅ `video_url` is a full HTTPS URL (not just a path)
- ✅ `dropbox_path` is the file path (this one was correct)

## 🧪 Testing

1. Run your workflow with a test file
2. Click on each node to see its output:
   - Webhook node → Check if `video_id` is in `$json.body.video_id` or `$json.video_id`
   - Upload File node → Check `path_display` field
   - Get Shared Link node → Check `url` field
3. Use the exact field paths in your HTTP Request body

