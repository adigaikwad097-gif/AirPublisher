# n8n HTTP Request Body - Exact Format

## Final HTTP Request Node Configuration

This is the **exact body format** for the HTTP Request node that calls back to Next.js after Dropbox upload.

### Node Settings

**HTTP Request Node:**
- **Method**: `POST`
- **URL**: `{{ $json.callback_url }}`
- **Authentication**: Header Auth (if using API key)
  - **Name**: `x-n8n-api-key`
  - **Value**: `{{ $env.N8N_API_KEY }}` or your API key
- **Body Content Type**: `JSON`

### Success Response Body (JSON)

Based on the actual Dropbox upload response structure:

```json
{
  "video_id": "{{ $json.video_id }}",
  "video_url": "{{ $('Get Shared Link').item.json.url }}",
  "dropbox_path": "{{ $('Upload File').item.json.path_display }}",
  "processing_status": "completed"
}
```

**Note:** If Dropbox returns an array, you might need:
- `{{ $('Upload File').item.json[0].path_display }}` (if it's an array)
- Or `{{ $('Upload File').item.json.path_display }}` (if n8n automatically extracts the first item)

**Actual Dropbox Upload Response Structure:**
```json
[
  {
    "name": "filename.mp4",
    "path_display": "/airpublisher/creator_xxx/filename.mp4",
    "path_lower": "/airpublisher/creator_xxx/filename.mp4",
    "id": "id:...",
    "size": 10315842,
    "is_downloadable": true
  }
]
```

So use `path_display` from the upload response.

### Alternative Formats (depending on Dropbox response structure)

If Dropbox returns the URL in a different structure, try these:

**Option 1: URL nested in result**
```json
{
  "video_id": "{{ $json.video_id }}",
  "video_url": "{{ $('Get Shared Link').item.json.result.url }}",
  "dropbox_path": "{{ $('Upload File').item.json.path_display }}",
  "processing_status": "completed"
}
```

**Option 2: URL as 'link' field**
```json
{
  "video_id": "{{ $json.video_id }}",
  "video_url": "{{ $('Get Shared Link').item.json.link }}",
  "dropbox_path": "{{ $('Upload File').item.json.path_display }}",
  "processing_status": "completed"
}
```

**Option 3: Ensure direct download URL**
```json
{
  "video_id": "{{ $json.video_id }}",
  "video_url": "{{ $('Get Shared Link').item.json.url.replace('?dl=0', '?dl=1') }}",
  "dropbox_path": "{{ $('Upload File').item.json.path_display }}",
  "processing_status": "completed"
}
```

### Error Response Body (JSON)

If upload fails:

```json
{
  "video_id": "{{ $json.video_id }}",
  "processing_status": "failed",
  "error_message": "{{ $json.error || 'Upload to Dropbox failed' }}"
}
```

## How to Find the Correct Field Names

1. **Test your workflow** - Run it once and check the output of each node
2. **Inspect Dropbox node outputs:**
   - Click on the "Upload File" node → see what fields it returns
   - Click on the "Get Shared Link" node → see what fields it returns
3. **Use the field names** from the actual response

## Example: Finding the URL Field

1. Run your workflow with a test file
2. Click on the "Get Shared Link" node
3. Look at the output JSON structure
4. Find where the URL is stored (could be `url`, `result.url`, `link`, etc.)
5. Use that exact path in your HTTP Request body

## Complete Example with All Fields

If you want to include all available data:

```json
{
  "video_id": "{{ $json.video_id }}",
  "video_url": "{{ $('Get Shared Link').item.json.url }}",
  "dropbox_path": "{{ $('Upload File').item.json.path_display }}",
  "dropbox_id": "{{ $('Upload File').item.json.id }}",
  "file_size": "{{ $('Upload File').item.json.size }}",
  "processing_status": "completed"
}
```

**Note:** Only `video_id` and `processing_status` are required. The rest are optional but helpful.

## Testing the Body

You can test the HTTP Request node by:
1. Adding a "Set" node before it to manually set the body
2. Running the workflow
3. Checking the Next.js server logs to see what was received
4. Adjusting the field paths based on what you see

