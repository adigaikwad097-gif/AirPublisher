# Creating Dropbox Shared Link via API (n8n)

Since n8n's Dropbox node doesn't have a "Get Shared Link" operation, we need to use the **HTTP Request node** to call Dropbox's API directly.

## Workflow Structure

```
1. Webhook (receives file)
   ↓
2. Dropbox: Upload File
   ↓ Returns: { path_display, id, ... }
   ↓
3. HTTP Request: Create Shared Link (Dropbox API)
   ↓ Returns: { url: "https://www.dropbox.com/s/..." }
   ↓
4. HTTP Request: Call back to Next.js
```

## Step: Add HTTP Request Node for Shared Link

After your "Upload File" node, add an **HTTP Request** node:

### HTTP Request Node Settings

- **Method**: `POST`
- **URL**: `https://api.dropboxapi.com/2/sharing/create_shared_link_with_settings`
- **Authentication**: 
  - **Type**: Header Auth
  - **Name**: `Authorization`
  - **Value**: `Bearer YOUR_DROPBOX_ACCESS_TOKEN`
  
  **OR** if you're using n8n's Dropbox credential:
  - Use the same credential from your "Upload File" node
  - n8n should handle the token automatically

- **Headers**:
  - `Content-Type`: `application/json`

- **Body** (JSON):
```json
{
  "path": "{{ $json.path_display }}",
  "settings": {
    "requested_visibility": "public",
    "audience": "public",
    "access": "viewer"
  }
}
```

### Alternative: Get Existing Shared Link

If a shared link might already exist, use:

- **URL**: `https://api.dropboxapi.com/2/sharing/list_shared_links`
- **Method**: `POST`
- **Body**:
```json
{
  "path": "{{ $json.path_display }}",
  "direct_only": false
}
```

This returns existing links, or you can use the create endpoint which will return existing if one exists.

## Expected Response

The Dropbox API will return:

```json
{
  "url": "https://www.dropbox.com/s/abc123def456/file.mp4?dl=0",
  "name": "file.mp4",
  "path_lower": "/airpublisher/creator_xxx/file.mp4",
  "link_permissions": { ... }
}
```

## Using the URL in Final HTTP Request

In your final HTTP Request node (calling back to Next.js):

```json
{
  "video_id": "{{ $json.video_id }}",
  "video_url": "{{ $('Create Shared Link').item.json.url }}",
  "dropbox_path": "{{ $('Upload File').item.json.path_display }}",
  "processing_status": "completed"
}
```

**Note:** Replace `'Create Shared Link'` with whatever you named your HTTP Request node.

## Ensure Direct Download URL

For video playback, you might want to ensure `?dl=1`:

```json
{
  "video_id": "{{ $json.video_id }}",
  "video_url": "{{ $('Create Shared Link').item.json.url.replace('?dl=0', '?dl=1') }}",
  "dropbox_path": "{{ $('Upload File').item.json.path_display }}",
  "processing_status": "completed"
}
```

## Getting Dropbox Access Token

You have a few options:

### Option 1: Use n8n Dropbox Credential
If you already have a Dropbox credential set up in n8n:
- The HTTP Request node can use the same credential
- n8n will handle the OAuth token automatically

### Option 2: Use Dropbox Access Token Directly
1. Get your Dropbox access token (from Dropbox App Console or OAuth flow)
2. Add it as a header: `Authorization: Bearer YOUR_TOKEN`

### Option 3: Use Environment Variable
In n8n, you can store the token as an environment variable:
- `{{ $env.DROPBOX_ACCESS_TOKEN }}`

## Complete Example

### HTTP Request Node: Create Shared Link

**Settings:**
- **Name**: "Create Shared Link"
- **Method**: `POST`
- **URL**: `https://api.dropboxapi.com/2/sharing/create_shared_link_with_settings`
- **Authentication**: Use your Dropbox credential (same as Upload File node)
- **Body**:
```json
{
  "path": "{{ $json.path_display }}",
  "settings": {
    "requested_visibility": "public"
  }
}
```

### Final HTTP Request Node: Callback

**Settings:**
- **Method**: `POST`
- **URL**: `{{ $json.callback_url }}`
- **Body**:
```json
{
  "video_id": "{{ $json.video_id }}",
  "video_url": "{{ $('Create Shared Link').item.json.url.replace('?dl=0', '?dl=1') }}",
  "dropbox_path": "{{ $('Upload File').item.json.path_display }}",
  "processing_status": "completed"
}
```

## Troubleshooting

### Error: "invalid_access_token"
- Make sure your Dropbox credential is properly connected in n8n
- Or verify your access token is valid

### Error: "path/not_found"
- The file might not be uploaded yet
- Make sure the "Upload File" node completes before the shared link node runs

### URL is null or missing
- Check the HTTP Request node output
- The response structure might be different - inspect the actual response

