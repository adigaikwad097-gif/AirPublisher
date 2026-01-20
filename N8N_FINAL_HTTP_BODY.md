# Final HTTP Request Body - Based on Actual Dropbox Response

## ✅ Correct HTTP Request Body

Based on your actual Dropbox shared link response, use this:

```json
{
  "video_id": "{{ $json.video_id }}",
  "video_url": "{{ $('Create Shared Link').item.json[0].url.replace('?dl=0', '?dl=1') }}",
  "dropbox_path": "{{ $('Upload File').item.json.path_display }}",
  "processing_status": "completed"
}
```

## 🔍 Why This Format?

### Your Dropbox Response Structure:
```json
[
  {
    ".tag": "file",
    "url": "https://www.dropbox.com/scl/fi/.../file.mp4?rlkey=...&dl=0",
    "path_lower": "/airpublisher/creator_xxx/file.mp4",
    ...
  }
]
```

### Key Points:
1. **Array Response**: Dropbox returns an array `[...]`, so use `[0]` to access the first item
2. **URL Field**: The URL is in `url` field (not nested)
3. **Direct Download**: Replace `?dl=0` with `?dl=1` for video playback
4. **Node Name**: Replace `'Create Shared Link'` with your actual HTTP Request node name

## Alternative Formats

### If n8n Auto-Extracts Array:
If n8n automatically extracts the first array item, you might be able to use:
```json
{
  "video_id": "{{ $json.video_id }}",
  "video_url": "{{ $('Create Shared Link').item.json.url.replace('?dl=0', '?dl=1') }}",
  "dropbox_path": "{{ $('Upload File').item.json.path_display }}",
  "processing_status": "completed"
}
```

### Without URL Replacement:
If you want to keep the original URL format:
```json
{
  "video_id": "{{ $json.video_id }}",
  "video_url": "{{ $('Create Shared Link').item.json[0].url }}",
  "dropbox_path": "{{ $('Upload File').item.json.path_display }}",
  "processing_status": "completed"
}
```

**Note:** The URL will have `?dl=0` which shows a preview page. For direct video playback, use `?dl=1`.

## Complete Example

### HTTP Request Node: Create Shared Link
- **Name**: "Create Shared Link"
- **Method**: `POST`
- **URL**: `https://api.dropboxapi.com/2/sharing/create_shared_link_with_settings`
- **Body**:
```json
{
  "path": "{{ $json.path_display }}",
  "settings": {
    "requested_visibility": "public"
  }
}
```

### HTTP Request Node: Callback to Next.js
- **Name**: "Callback to Next.js"
- **Method**: `POST`
- **URL**: `{{ $json.callback_url }}`
- **Body**:
```json
{
  "video_id": "{{ $json.video_id }}",
  "video_url": "{{ $('Create Shared Link').item.json[0].url.replace('?dl=0', '?dl=1') }}",
  "dropbox_path": "{{ $('Upload File').item.json.path_display }}",
  "processing_status": "completed"
}
```

## Testing

1. Run your workflow
2. Check "Create Shared Link" node output - should see the array with URL
3. Check "Callback to Next.js" node - should see the complete body
4. Verify Next.js receives:
   ```json
   {
     "video_id": "4630c60c-0430-4584-8dbf-02c9d0cace77",
     "video_url": "https://www.dropbox.com/scl/fi/.../file.mp4?rlkey=...&dl=1",
     "dropbox_path": "/airpublisher/creator_xxx/file.mp4",
     "processing_status": "completed"
   }
   ```

## Troubleshooting

### If `[0]` doesn't work:
Try without the array index first:
```json
"video_url": "{{ $('Create Shared Link').item.json.url.replace('?dl=0', '?dl=1') }}"
```

### If node name is different:
Replace `'Create Shared Link'` with your actual node name, e.g.:
- `'HTTP Request'`
- `'Dropbox Shared Link'`
- Whatever you named it

### If URL is still `?dl=0`:
The replace function might not work. You can manually construct:
```json
"video_url": "{{ $('Create Shared Link').item.json[0].url }}&dl=1"
```

But this might cause issues if the URL already has parameters. The `.replace()` method is safer.

