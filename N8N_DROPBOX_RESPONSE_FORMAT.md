# Dropbox Upload Response Format

## Actual Dropbox "Upload File" Node Output

When you upload a file to Dropbox in n8n, you get this response structure:

```json
[
  {
    "name": "023578a5-1a51-424a-b107-9ca8e9c2c815.mp4",
    "path_lower": "/airpublisher/creator_creator_735175e5_1768726539_f7262d3a/023578a5-1a51-424a-b107-9ca8e9c2c815.mp4",
    "path_display": "/airpublisher/creator_creator_735175e5_1768726539_f7262d3a/023578a5-1a51-424a-b107-9ca8e9c2c815.mp4",
    "id": "id:MZkNMAInpEQAAAAAAAAACw",
    "client_modified": "2026-01-20T07:43:44Z",
    "server_modified": "2026-01-20T07:43:44Z",
    "rev": "01648ccf7992b5a00000003244cd143",
    "size": 10315842,
    "is_downloadable": true,
    "content_hash": "e96f4283703ecb714da016d6080eaf8b41f479db07ea1ca40730834a1cc752ba"
  }
]
```

## Key Fields for HTTP Request Body

### For the callback to Next.js:

- **`path_display`** - Full file path (use this for `dropbox_path`)
- **`name`** - Filename
- **`id`** - Dropbox file ID
- **`size`** - File size in bytes

## HTTP Request Body Format

In your n8n HTTP Request node (final step), use:

```json
{
  "video_id": "{{ $json.video_id }}",
  "video_url": "{{ $('Get Shared Link').item.json.url }}",
  "dropbox_path": "{{ $('Upload File').item.json.path_display }}",
  "processing_status": "completed"
}
```

## Accessing Array Response

Since Dropbox returns an **array**, n8n usually handles this automatically. But if you need to access it explicitly:

**Option 1: n8n auto-extracts (most common)**
```json
{
  "dropbox_path": "{{ $('Upload File').item.json.path_display }}"
}
```

**Option 2: Explicit array access**
```json
{
  "dropbox_path": "{{ $('Upload File').item.json[0].path_display }}"
}
```

**Option 3: Using Split In Batches (if needed)**
If n8n doesn't auto-extract, add a "Split In Batches" node after the Upload File node, then reference:
```json
{
  "dropbox_path": "{{ $json.path_display }}"
}
```

## Testing

To verify the correct field path:

1. Run your workflow with a test file
2. Click on the "Upload File" node output
3. Check the JSON structure
4. Use the exact field path in your HTTP Request body

## Complete Example

If you want to include additional metadata:

```json
{
  "video_id": "{{ $json.video_id }}",
  "video_url": "{{ $('Get Shared Link').item.json.url }}",
  "dropbox_path": "{{ $('Upload File').item.json.path_display }}",
  "dropbox_file_id": "{{ $('Upload File').item.json.id }}",
  "file_size": "{{ $('Upload File').item.json.size }}",
  "file_name": "{{ $('Upload File').item.json.name }}",
  "processing_status": "completed"
}
```

**Note:** Only `video_id`, `video_url`, and `processing_status` are required by Next.js. The rest are optional.

