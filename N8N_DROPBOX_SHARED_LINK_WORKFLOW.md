# n8n Dropbox Workflow: Getting Shared Link URL

## The Problem

The Dropbox "Upload File" node **only** returns file metadata:
- ✅ File path (`path_display`)
- ✅ File ID (`id`)
- ✅ File size, etc.
- ❌ **NO shared link URL**

You need a **separate Dropbox node** to get/create the shared link URL.

## Complete Workflow Structure

```
1. Webhook (receives file)
   ↓
2. Dropbox: Upload File
   ↓ Output: { path_display, id, name, ... } (NO URL)
   ↓
3. Dropbox: Get Shared Link (or Create Shared Link)
   ↓ Output: { url: "https://www.dropbox.com/s/..." }
   ↓
4. HTTP Request (calls back to Next.js)
   ↓ Uses: video_id from webhook, url from step 3, path_display from step 2
```

## Step-by-Step: Add Shared Link Node

### After "Upload File" Node

1. **Add a new Dropbox node** (after "Upload File")
2. **Operation**: Choose one of:
   - **"Get Shared Link"** - Gets existing shared link if one exists
   - **"Create Shared Link"** - Creates a new shared link
   - **"Create Shared Link With Settings"** - More control over link settings

3. **Path**: Use the path from the upload node
   ```
   {{ $json.path_display }}
   ```
   Or:
   ```
   {{ $json.path_lower }}
   ```

4. **Settings** (if using "Create Shared Link With Settings"):
   - **Requested Visibility**: `public`
   - **Link Type**: `direct` (for video playback)

5. **Run the workflow** and check the output - you should see:
   ```json
   {
     "url": "https://www.dropbox.com/s/abc123def456/file.mp4?dl=0"
   }
   ```

## HTTP Request Body (Final Step)

Now you can use the shared link URL:

```json
{
  "video_id": "{{ $json.video_id }}",
  "video_url": "{{ $('Get Shared Link').item.json.url }}",
  "dropbox_path": "{{ $('Upload File').item.json.path_display }}",
  "processing_status": "completed"
}
```

**Important:**
- `video_id` comes from the initial webhook
- `video_url` comes from the **"Get Shared Link"** node (step 3)
- `dropbox_path` comes from the **"Upload File"** node (step 2)

## Node Reference Names

Make sure your nodes are named clearly:
- "Upload File" (or "Dropbox Upload")
- "Get Shared Link" (or "Dropbox Get Link")

Then reference them in HTTP Request:
- `{{ $('Upload File').item.json.path_display }}`
- `{{ $('Get Shared Link').item.json.url }}`

## If Shared Link Returns Different Structure

If the shared link node returns the URL differently, check the output:

**Option 1: URL directly**
```json
{
  "url": "https://www.dropbox.com/s/..."
}
```
Use: `{{ $('Get Shared Link').item.json.url }}`

**Option 2: Nested in result**
```json
{
  "result": {
    "url": "https://www.dropbox.com/s/..."
  }
}
```
Use: `{{ $('Get Shared Link').item.json.result.url }}`

**Option 3: As 'link' field**
```json
{
  "link": "https://www.dropbox.com/s/..."
}
```
Use: `{{ $('Get Shared Link').item.json.link }}`

## Ensure Direct Download URL

For video playback, you might want to ensure `?dl=1`:

```json
{
  "video_id": "{{ $json.video_id }}",
  "video_url": "{{ $('Get Shared Link').item.json.url.replace('?dl=0', '?dl=1') }}",
  "dropbox_path": "{{ $('Upload File').item.json.path_display }}",
  "processing_status": "completed"
}
```

## Complete Example Workflow

1. **Webhook** node
   - Receives: `file`, `video_id`, `creator_unique_identifier`, `file_name`, `callback_url`

2. **Dropbox: Upload File** node
   - Path: `/airpublisher/creator_{{ $json.creator_unique_identifier }}/{{ $json.file_name }}`
   - Output: `{ path_display: "/airpublisher/...", id: "...", ... }`

3. **Dropbox: Get Shared Link** node
   - Path: `{{ $json.path_display }}`
   - Output: `{ url: "https://www.dropbox.com/s/..." }`

4. **HTTP Request** node
   - URL: `{{ $json.callback_url }}`
   - Body:
   ```json
   {
     "video_id": "{{ $json.video_id }}",
     "video_url": "{{ $('Get Shared Link').item.json.url }}",
     "dropbox_path": "{{ $('Upload File').item.json.path_display }}",
     "processing_status": "completed"
   }
   ```

## Testing

1. Run your workflow
2. Click on "Upload File" node → Should see file metadata (no URL)
3. Click on "Get Shared Link" node → Should see `{ url: "https://..." }`
4. Click on HTTP Request node → Should see the complete body with all fields

If you don't see the URL in step 3, the shared link node isn't working correctly - check its configuration.


