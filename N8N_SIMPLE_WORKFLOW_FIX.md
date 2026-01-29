# Simple n8n Workflow Fix

## The Problem

Your HTTP Request body is trying to reference nodes that don't exist or have different names. Let's fix this step by step.

## Step 1: Check Your Node Names

In n8n, each node has a name. You need to use the **exact names** when referencing them.

1. Look at your workflow nodes
2. Note the exact names (hover over them or click to see)
3. Common names might be:
   - "Webhook" or "Webhook1"
   - "Dropbox" or "Upload File" or "Dropbox1"
   - "HTTP Request" or "Create Shared Link" or "HTTP Request1"

## Step 2: Pass video_id Through the Workflow

The `video_id` needs to be preserved through each node. Here's how:

### Option A: Use a "Set" Node After Webhook

After your Webhook node, add a **"Set"** node:

**Set Node Configuration:**
- **Keep Only Set Fields**: OFF (keep all fields)
- **Fields to Set**:
  - **Name**: `video_id`
  - **Value**: `{{ $json.body.video_id }}` or `{{ $json.video_id }}`
  
  - **Name**: `callback_url`
  - **Value**: `{{ $json.body.callback_url }}` or `{{ $json.callback_url }}`

This preserves the `video_id` for later use.

### Option B: Use $json Directly (Simpler)

Instead of referencing node names, use `$json` which refers to the current node's output.

## Step 3: Simple HTTP Request Body

Use this simpler format that doesn't require node names:

```json
{
  "video_id": "{{ $json.video_id }}",
  "video_url": "{{ $json.url }}",
  "dropbox_path": "{{ $json.path_display }}",
  "processing_status": "completed"
}
```

**But wait** - this only works if all data is in the current node. We need to combine data from multiple nodes.

## Step 4: Combine Data with "Merge" Node

The best approach is to use a **"Merge"** node to combine data from multiple nodes:

### Workflow Structure:
```
1. Webhook
   ↓
2. Set (preserve video_id, callback_url)
   ↓
3. Dropbox: Upload File
   ↓
4. HTTP Request: Create Shared Link
   ↓
5. Merge (combine all data)
   ↓
6. HTTP Request: Callback to Next.js
```

### Merge Node Configuration:
- **Mode**: "Merge By Index" or "Append"
- **Combine**: All outputs

This combines data from all previous nodes into one object.

### Then in Final HTTP Request:
```json
{
  "video_id": "{{ $json.video_id }}",
  "video_url": "{{ $json[0].url.replace('?dl=0', '?dl=1') }}",
  "dropbox_path": "{{ $json.path_display }}",
  "processing_status": "completed"
}
```

## Step 5: Even Simpler - Use "Set" to Build Final Object

After all your nodes, add a **"Set"** node to build the final object:

**Set Node (before final HTTP Request):**
- **Fields to Set**:
  - **Name**: `video_id`
  - **Value**: `{{ $('Set').item.json.video_id }}` (from your Set node)
  
  - **Name**: `video_url`
  - **Value**: `{{ $('HTTP Request').item.json[0].url.replace('?dl=0', '?dl=1') }}` (from Create Shared Link)
  
  - **Name**: `dropbox_path`
  - **Value**: `{{ $('Dropbox').item.json.path_display }}` (from Upload File)
  
  - **Name**: `processing_status`
  - **Value**: `completed`

**Then in HTTP Request, use simple JSON:**
```json
{
  "video_id": "{{ $json.video_id }}",
  "video_url": "{{ $json.video_url }}",
  "dropbox_path": "{{ $json.dropbox_path }}",
  "processing_status": "{{ $json.processing_status }}"
}
```

## Quick Fix: Test What Works

1. **Run your workflow** with a test file
2. **Click on each node** to see its output
3. **Note the exact field names** in each output
4. **Use those exact names** in your HTTP Request body

For example, if your Webhook node shows:
```json
{
  "body": {
    "video_id": "123",
    "file": "..."
  }
}
```

Then use: `{{ $json.body.video_id }}`

## Most Reliable Approach

Use **"Set" nodes** to explicitly pass data through:

1. **After Webhook**: Set node to extract `video_id`, `callback_url`
2. **After Upload**: Set node to preserve `path_display` and `video_id`
3. **After Shared Link**: Set node to add `url` and preserve everything
4. **Final HTTP Request**: Use simple `{{ $json.field_name }}` references

This way, you don't need to reference node names - just use `$json` from the current node.


