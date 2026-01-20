# n8n Dropbox Upload Setup

AIR Publisher now uses **n8n** to handle Dropbox uploads instead of direct Dropbox API calls. This provides better token management, automatic refresh, and folder organization.

## Architecture

```
User uploads file
    ↓
Next.js /api/videos/[id]/upload
    ↓ (sends file via FormData)
n8n Webhook (receives file)
    ↓
n8n Dropbox Node (uploads to Dropbox)
    ↓ (creates folder structure: /airpublisher/creator_{id}/)
    ↓ (gets shared link URL)
n8n HTTP Request Node
    ↓ (calls back with Dropbox URL)
Next.js /api/webhooks/n8n/upload-complete
    ↓ (updates video record)
Supabase Database (video_url updated)
```

## Environment Variables

Add to your `.env.local`:

```env
# n8n Dropbox Upload Webhook URL (REQUIRED)
N8N_WEBHOOK_URL_DROPBOX_UPLOAD=https://your-n8n-instance.com/webhook/dropbox-upload

# n8n API Key (OPTIONAL - only needed for security when n8n calls back)
# If not set, webhook callbacks will still work but without authentication
N8N_API_KEY=your_n8n_api_key
```

**Note:** `N8N_API_KEY` is optional. It's only used to verify that callbacks FROM n8n are legitimate. If you don't set it, the webhook will still work, but it won't verify the source of the callback (less secure for production).

## n8n Workflow Setup

### Step 1: Create Webhook Trigger

1. In n8n, create a new workflow
2. Add a **Webhook** node as the trigger
3. Configure:
   - **HTTP Method**: `POST`
   - **Path**: `dropbox-upload` (or your preferred path)
   - **Response Mode**: "Respond to Webhook" (if you want to return status immediately)
   - **Authentication**: Optional (can use header auth with `x-n8n-api-key`)

4. Copy the **Webhook URL** and add it to `.env.local` as `N8N_WEBHOOK_URL_DROPBOX_UPLOAD`

### Step 2: Extract FormData

Add a **Code** node or **Set** node to extract the FormData fields:

```javascript
// Extract from webhook body
const videoId = $input.item.json.body.video_id;
const creatorId = $input.item.json.body.creator_unique_identifier;
const fileName = $input.item.json.body.file_name;
const callbackUrl = $input.item.json.body.callback_url;
const file = $input.item.json.body.file; // File object from FormData

return {
  video_id: videoId,
  creator_unique_identifier: creatorId,
  file_name: fileName,
  callback_url: callbackUrl,
  file: file
};
```

### Step 3: Create Dropbox Folder Structure

Add a **Dropbox** node to create the folder:

- **Operation**: "Create Folder"
- **Path**: `/airpublisher/creator_{{ $json.creator_unique_identifier }}`
- **Auto-create Parent Folders**: Enabled

### Step 4: Upload File to Dropbox

Add another **Dropbox** node:

- **Operation**: "Upload File"
- **Path**: `/airpublisher/creator_{{ $json.creator_unique_identifier }}/{{ $json.file_name }}`
- **File Content**: Use the file from FormData
- **Auto-create Parent Folders**: Enabled

### Step 5: Create Shared Link via HTTP Request ⚠️ REQUIRED

**Important:** The n8n Dropbox node doesn't have a "Get Shared Link" operation. You MUST use an **HTTP Request node** to call Dropbox's API directly.

Add an **HTTP Request** node to create the shared link:

- **Method**: `POST`
- **URL**: `https://api.dropboxapi.com/2/sharing/create_shared_link_with_settings`
- **Authentication**: 
  - Use the same Dropbox credential from your "Upload File" node
  - OR use Header Auth: `Authorization: Bearer YOUR_DROPBOX_ACCESS_TOKEN`
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

**Expected Output:**
```json
{
  "url": "https://www.dropbox.com/s/abc123/file.mp4?dl=0",
  "name": "file.mp4",
  "path_lower": "/airpublisher/creator_xxx/file.mp4"
}
```

**Note:** This node is essential - without it, you won't have a `video_url` to send to Next.js. The Dropbox "Upload File" node only returns file metadata, not a shareable URL.

### Step 6: Call Back to Next.js

Add an **HTTP Request** node to notify Next.js:

- **Method**: `POST`
- **URL**: `{{ $json.callback_url }}` (from the initial webhook FormData)
- **Authentication**: (OPTIONAL - only if you set `N8N_API_KEY`)
  - **Type**: Header Auth
  - **Name**: `x-n8n-api-key`
  - **Value**: Your `N8N_API_KEY` (if you want to secure the callback)
- **Body Content Type**: `JSON`
- **Body** (JSON format):

```json
{
  "video_id": "{{ $json.video_id }}",
  "video_url": "{{ $('Create Shared Link').item.json[0].url.replace('?dl=0', '?dl=1') }}",
  "dropbox_path": "{{ $('Upload File').item.json.path_display }}",
  "processing_status": "completed"
}
```

**Note:** 
- Dropbox returns an array, so use `[0]` to access the first item
- The URL has `?dl=0` - we replace it with `?dl=1` for direct download
- Replace `'Create Shared Link'` with whatever you named your HTTP Request node

**Important Notes:**
- `video_id` comes from the initial webhook data (first node) - use `{{ $json.video_id }}` or `{{ $json.body.video_id }}` depending on how n8n parses FormData
- `video_url` comes from the Dropbox "Get Shared Link" node response - **NOT** from the upload node (that only has paths, not URLs)
- `dropbox_path` comes from the Dropbox "Upload File" node response - use `path_display` field
- The Dropbox upload returns an array, but n8n usually extracts the first item automatically
- Make sure the shared link URL has `?dl=1` for direct download (n8n might add this automatically)

**⚠️ Common Mistakes:**
- ❌ `{{ $json.id }}` - This is the Dropbox file ID, not your video_id
- ❌ `{{ $json.path_display }}` for video_url - This is just a path, not a URL
- ✅ Use `{{ $json.video_id }}` from the webhook for video_id
- ✅ Use `{{ $('Get Shared Link').item.json.url }}` for video_url

**If Dropbox returns an array and you need to access it explicitly:**
```json
{
  "video_id": "{{ $json.video_id }}",
  "video_url": "{{ $('Get Shared Link').item.json.url }}",
  "dropbox_path": "{{ $('Upload File').item.json[0].path_display }}",
  "processing_status": "completed"
}
```

**Alternative if Dropbox returns URL differently:**

If the Dropbox shared link node returns the URL in a different format, you might need to extract it like:
- `{{ $('Get Shared Link').item.json.result.url }}` (if nested in `result`)
- `{{ $('Get Shared Link').item.json.link }}` (if it's called `link`)
- `{{ $('Get Shared Link').item.json.url.replace('?dl=0', '?dl=1') }}` (to ensure direct download)

**For Error Handling:**

If upload fails, send:
```json
{
  "video_id": "{{ $json.video_id }}",
  "processing_status": "failed",
  "error_message": "{{ $json.error || 'Upload failed' }}"
}
```

## Complete n8n Workflow Example

```
1. Webhook Trigger
   ↓
2. Code/Set Node (extract FormData)
   ↓
3. Dropbox: Create Folder (/airpublisher/creator_{id})
   ↓
4. Dropbox: Upload File
   ↓
5. Dropbox: Get/Create Shared Link
   ↓
6. HTTP Request: POST to callback_url
   (with video_id, video_url, processing_status)
```

## Expected Webhook Payload from Next.js

When Next.js sends the file to n8n, it includes:

```javascript
FormData {
  file: File,                    // The video file
  video_id: "uuid",             // Video ID from database
  creator_unique_identifier: "creator-id",
  file_name: "video-id.mp4",
  callback_url: "https://your-app.com/api/webhooks/n8n/upload-complete"
}
```

## Expected Callback Payload to Next.js

When n8n calls back, it should send:

```json
{
  "video_id": "uuid",
  "video_url": "https://www.dropbox.com/s/...?dl=1",
  "dropbox_path": "/airpublisher/creator_xxx/video-id.mp4",
  "processing_status": "completed"
}
```

Or if failed:

```json
{
  "video_id": "uuid",
  "processing_status": "failed",
  "error_message": "Error description"
}
```

## Dropbox Connection in n8n

1. In n8n, go to **Credentials**
2. Add **Dropbox** credential
3. Connect your Dropbox account (OAuth)
4. n8n will handle token refresh automatically

## Testing

1. Upload a video through the Next.js app
2. Check n8n execution logs to see the workflow run
3. Verify the file appears in Dropbox at `/airpublisher/creator_{id}/`
4. Check the video record in Supabase - `video_url` should be updated with the Dropbox URL

## Troubleshooting

### File not uploading
- Check n8n execution logs
- Verify Dropbox credential is connected in n8n
- Check folder permissions in Dropbox

### Callback not working
- Verify `callback_url` is correct in the webhook payload
- Check `N8N_API_KEY` is set and matches in both places
- Verify the callback endpoint `/api/webhooks/n8n/upload-complete` is accessible

### Video URL not updating
- Check n8n execution logs for the callback HTTP request
- Verify the callback payload format matches expected schema
- Check Next.js server logs for webhook errors

## Benefits of n8n Approach

1. **Automatic Token Refresh**: n8n handles Dropbox OAuth token refresh
2. **Better Error Handling**: n8n can retry failed uploads
3. **Folder Management**: Easy to organize files by creator
4. **Scalability**: n8n can handle multiple uploads concurrently
5. **Monitoring**: n8n provides execution logs and monitoring

