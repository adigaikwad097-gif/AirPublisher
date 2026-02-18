# TikTok Binary Data Pass-Through Guide

## Workflow Flow

```
[HTTP Request6 - Download Video] 
  ↓ (has binary data)
[Extract File Metadata from Binary - Code Node]
  ↓ (should pass binary through)
[Initialize Upload]
  ↓
[Upload Video] ← Needs binary here
```

## Step 1: Verify Code Node Passes Binary

Your Code node (`N8N_CODE_NODE_FIXED_CODE.js`) should already be passing the binary. Check that it returns:

```javascript
return {
  json: { ... },
  binary: binaryData ? {
    data: binaryData
  } : undefined
};
```

**✅ This is already in your code** - the binary should be passed through.

## Step 2: Upload Video Node Configuration

In your **"Upload Video to TikTok"** HTTP Request node:

### Option 1: Use Binary from Code Node (Recommended)

**Method:** PUT  
**URL:** `{{ $('Initialize Upload').item.json.data.upload_url }}`

**Headers:**
```
Content-Type: video/mp4
Content-Range: bytes 0-{{ $('Extract File Metadata from Binary').item.json.video_size - 1 }}/{{ $('Extract File Metadata from Binary').item.json.video_size }}
```

**Body:**
- **Body Content Type:** `Binary Data`
- **Binary Property Name:** `data`
- **Select Binary Data:** Click the dropdown and select from "Extract File Metadata from Binary" node

**In n8n UI:**
1. Set Body Content Type to "Binary Data"
2. Click "Add Binary Data"
3. Select the binary property from "Extract File Metadata from Binary" node
4. Choose the `data` property

### Option 2: Reference Binary Directly from Download Node

If the binary isn't being passed through the Code node, reference it directly:

**Body:**
- **Body Content Type:** `Binary Data`
- **Select Binary Data:** From "HTTP Request6" (Download Video) node
- **Binary Property:** `data`

## Step 3: Verify Binary is Available

Add a **Code node** before "Upload Video" to verify binary exists:

```javascript
// Debug: Check if binary is available
const input = $input.first();

console.log('Has binary:', !!input.binary);
console.log('Binary keys:', input.binary ? Object.keys(input.binary) : 'none');
console.log('Binary data size:', input.binary?.data?.length || 0);

return {
  json: {
    has_binary: !!input.binary,
    binary_size: input.binary?.data?.length || 0,
    message: input.binary ? 'Binary is available!' : 'Binary is missing!'
  },
  binary: input.binary // Pass through
};
```

## Troubleshooting

### Binary Not Available in Upload Node

**Solution 1:** Make sure Code node returns binary:
```javascript
return {
  json: { ... },
  binary: binaryData ? { data: binaryData } : undefined
};
```

**Solution 2:** If Code node doesn't pass binary, reference directly from download node:
- In Upload Video node, select binary from "HTTP Request6" instead of Code node

**Solution 3:** Add a "Pass Through" node between Code and Upload:
- Use a simple Code node that just passes everything:
```javascript
return $input.all();
```

### Binary Size Mismatch

If you get size errors:
- Make sure `video_size` in Content-Range matches actual binary size
- Use binary data size, not header content-length

## Complete Upload Video Node Setup

**HTTP Request Node: "Upload Video to TikTok"**

1. **Method:** PUT
2. **URL:** `{{ $('Initialize Upload').item.json.data.upload_url }}`
3. **Headers:**
   - `Content-Type: video/mp4`
   - `Content-Range: bytes 0-{{ $('Extract File Metadata from Binary').item.json.video_size - 1 }}/{{ $('Extract File Metadata from Binary').item.json.video_size }}`
4. **Body:**
   - **Body Content Type:** `Binary Data`
   - **Add Binary Data** → Select from "Extract File Metadata from Binary" → Property: `data`

## Quick Test

Before the Upload node, add a Code node to verify:

```javascript
const input = $input.first();
return {
  json: {
    binary_available: !!input.binary,
    binary_size: input.binary?.data?.length || 0,
    upload_url: $('Initialize Upload').item.json.data.upload_url
  }
};
```

This will show you if binary is available and the upload URL.


