# n8n Workflow: Step-by-Step Setup

## Complete Workflow with Exact Node Configuration

### Node 1: Webhook
- **Name**: "Webhook" (or whatever n8n names it)
- **Method**: POST
- **Output**: Receives FormData with `video_id`, `file`, `callback_url`, etc.

### Node 2: Set (Extract FormData)
- **Name**: "Extract Data"
- **Keep Only Set Fields**: OFF
- **Fields**:
  ```
  video_id: {{ $json.body.video_id }}
  callback_url: {{ $json.body.callback_url }}
  creator_id: {{ $json.body.creator_unique_identifier }}
  file_name: {{ $json.body.file_name }}
  file: {{ $json.body.file }}
  ```

### Node 3: Dropbox - Upload File
- **Name**: "Upload File"
- **Operation**: Upload a file
- **Path**: `/airpublisher/creator_{{ $json.creator_id }}/{{ $json.file_name }}`
- **File Content**: `{{ $json.file }}`
- **Output**: `{ path_display: "...", id: "...", ... }`

### Node 4: Set (Preserve Upload Data)
- **Name**: "Preserve Upload"
- **Fields**:
  ```
  video_id: {{ $json.video_id }}
  callback_url: {{ $json.callback_url }}
  path_display: {{ $('Upload File').item.json.path_display }}
  ```

### Node 5: HTTP Request - Create Shared Link
- **Name**: "Create Shared Link"
- **Method**: POST
- **URL**: `https://api.dropboxapi.com/2/sharing/create_shared_link_with_settings`
- **Authentication**: Use Dropbox credential
- **Body**:
  ```json
  {
    "path": "{{ $json.path_display }}",
    "settings": {
      "requested_visibility": "public"
    }
  }
  ```
- **Output**: `[{ url: "https://...", ... }]`

### Node 6: Set (Build Final Object)
- **Name**: "Build Response"
- **Fields**:
  ```
  video_id: {{ $json.video_id }}
  video_url: {{ $('Create Shared Link').item.json[0].url.replace('?dl=0', '?dl=1') }}
  dropbox_path: {{ $json.path_display }}
  processing_status: completed
  ```

### Node 7: HTTP Request - Callback
- **Name**: "Callback to Next.js"
- **Method**: POST
- **URL**: `{{ $json.callback_url }}`
- **Authentication**: Header `x-n8n-api-key` (if using)
- **Body** (JSON):
  ```json
  {
    "video_id": "{{ $json.video_id }}",
    "video_url": "{{ $json.video_url }}",
    "dropbox_path": "{{ $json.dropbox_path }}",
    "processing_status": "{{ $json.processing_status }}"
  }
  ```

## Alternative: Simpler Approach (No Node References)

If node references are causing issues, use this simpler approach:

### After Node 5 (Create Shared Link), add a Set node:

**Set Node:**
```
video_id: {{ $('Extract Data').item.json.video_id }}
video_url: {{ $json[0].url.replace('?dl=0', '?dl=1') }}
dropbox_path: {{ $('Preserve Upload').item.json.path_display }}
processing_status: completed
callback_url: {{ $('Extract Data').item.json.callback_url }}
```

**Then in HTTP Request:**
```json
{
  "video_id": "{{ $json.video_id }}",
  "video_url": "{{ $json.video_url }}",
  "dropbox_path": "{{ $json.dropbox_path }}",
  "processing_status": "{{ $json.processing_status }}"
}
```

## Debugging: Find Your Node Names

1. Click on each node in your workflow
2. Look at the node title/name at the top
3. Use those exact names when referencing

Or, use node IDs:
- Click on a node
- Look for its ID in the URL or node properties
- Reference as: `{{ $('node-id-here').item.json.field }}`

## Quick Test

1. Run your workflow
2. Click on each node to see its output
3. Write down:
   - What fields are available
   - What the node is named
4. Use those exact names in your HTTP Request body


