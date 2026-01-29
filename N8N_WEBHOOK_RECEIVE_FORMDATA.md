# n8n Webhook: Receiving FormData (File Upload)

## Problem

The n8n webhook is not receiving any payload when Next.js sends FormData with a file.

## Solution: Configure Webhook Node for File Uploads

n8n webhooks need special configuration to receive FormData/multipart data.

### Step 1: Webhook Node Settings

In your n8n webhook node:

1. **HTTP Method**: `POST` ✅
2. **Response Mode**: 
   - Choose **"Last Node"** (not "Respond to Webhook")
   - OR **"When Last Node Finishes"**
   - This allows the workflow to process the file before responding

3. **Options** → **Response Data**:
   - Set to **"All Incoming Data"** or **"First Entry JSON"**

4. **Options** → **Binary Data**:
   - ✅ **Enable**: "Binary Data"
   - This is **critical** for receiving files

### Step 2: Extract FormData Fields

After the webhook node, add a **"Code"** node or **"Set"** node to extract FormData:

**Option A: Using Code Node**

```javascript
// n8n webhook receives FormData
// Access the file and form fields
const file = $input.item.binary?.data;
const videoId = $input.item.json.body?.video_id || $input.item.json.video_id;
const creatorId = $input.item.json.body?.creator_unique_identifier || $input.item.json.creator_unique_identifier;
const fileName = $input.item.json.body?.file_name || $input.item.json.file_name;
const callbackUrl = $input.item.json.body?.callback_url || $input.item.json.callback_url;

return {
  file: file,
  video_id: videoId,
  creator_unique_identifier: creatorId,
  file_name: fileName,
  callback_url: callbackUrl
};
```

**Option B: Using Set Node**

If n8n auto-parses FormData, you might be able to access fields directly:
- `video_id`: `{{ $json.body.video_id }}` or `{{ $json.video_id }}`
- `file`: Use binary data node or `{{ $binary.data }}`

### Step 3: Access the File

The file will be in **binary data**, not JSON. In n8n:

1. **Check Binary Data**: Click on the webhook node output
2. **Look for**: Binary data section (not JSON)
3. **File name**: Usually in `$binary.data.fileName` or similar

### Step 4: Pass File to Dropbox Node

When uploading to Dropbox, use the binary data:

- **File Content**: `{{ $binary.data }}` or `{{ $json.binary.data }}`
- **File Name**: `{{ $json.file_name }}`

## Common Issues

### Issue 1: Webhook Shows Empty Body

**Symptom**: Webhook receives request but `$json` is empty `{}`

**Fix**: 
1. Enable **"Binary Data"** in webhook options
2. Check **"Response Mode"** - should be "Last Node" not "Respond to Webhook"
3. Add a **"Code"** node after webhook to inspect what's received:
   ```javascript
   return {
     json: $input.item.json,
     binary: $input.item.binary,
     all: $input.all()
   };
   ```

### Issue 2: File Not Accessible

**Symptom**: FormData fields are there but file is missing

**Fix**:
- File is in **binary data**, not JSON
- Access via `$binary.data` or `$input.item.binary.data`
- Make sure "Binary Data" is enabled in webhook options

### Issue 3: Fields Are Nested

**Symptom**: Fields are in `body.video_id` instead of `video_id`

**Fix**: Use a **"Set"** node to extract:
```
video_id: {{ $json.body.video_id }}
file_name: {{ $json.body.file_name }}
```

## Testing: Inspect What n8n Receives

Add a **"Code"** node right after the webhook to see everything:

```javascript
// Log everything received
const allData = {
  json: $input.item.json,
  binary: $input.item.binary,
  headers: $input.item.headers,
  params: $input.item.params,
};

console.log('Received data:', JSON.stringify(allData, null, 2));

return allData;
```

Run the workflow and check the execution output to see what n8n actually received.

## Alternative: Send JSON Instead of FormData

If FormData is too complex, you could modify Next.js to send the file as base64:

**In Next.js** (modify upload route):
```typescript
// Convert file to base64
const arrayBuffer = await file.arrayBuffer()
const buffer = Buffer.from(arrayBuffer)
const base64File = buffer.toString('base64')

// Send as JSON instead of FormData
const response = await fetch(n8nWebhookUrl, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    file_data: base64File,
    file_name: fileName,
    file_mime_type: file.type,
    video_id: videoId,
    creator_unique_identifier: video.creator_unique_identifier,
    callback_url: callbackUrl,
  }),
})
```

**In n8n**: Then decode base64 back to file in a Code node before uploading to Dropbox.

But FormData should work - the issue is likely webhook configuration.

## Quick Checklist

- [ ] Webhook HTTP Method: `POST`
- [ ] Binary Data: **Enabled** ✅
- [ ] Response Mode: "Last Node" (not "Respond to Webhook")
- [ ] Webhook is **Active** (green status)
- [ ] Workflow is **Activated** (toggle in top right)
- [ ] Test by running workflow and checking execution output


