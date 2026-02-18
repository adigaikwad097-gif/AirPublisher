# Fix: Circular/Invalid Error with Binary Reference

## Problem

When using `{{ $('HTTP Request6').item.binary.data }}`, you see:
```
[Object: {"mimeType": "application/binary", "data": "filesystem-v2", ...}]
```

This is n8n's filesystem reference, not the actual binary data. Using it directly causes circular/invalid errors.

## Solution: Use Binary Selector (Recommended)

Instead of typing an expression, use n8n's built-in binary selector:

### In HTTP Request Node:

1. **Body Content Type:** `n8n Binary File`
2. **Click "Add Binary Data"** or use the binary selector dropdown
3. **Select from:** "HTTP Request6"
4. **Select property:** `data`

This will automatically generate the correct reference that n8n understands.

## Alternative: Correct Expression Syntax

If you must use an expression, use this format:

### For "n8n Binary File" Body Type:

**Input Data Field Name:**
```
data
```

**Then in "Specify Binary Data" or similar section:**
- Select from: `HTTP Request6`
- Property: `data`

### OR use this expression format:

```
{{ $binary.data }}
```

This references the binary from the **previous node** (the one directly before this HTTP Request node).

## Solution: Reference from Previous Node

If "HTTP Request6" is directly before your "Upload Video" node:

**Input Data Field Name:**
```
{{ $binary.data }}
```

This automatically gets binary from the previous node.

## Solution: Use Binary Property Name

In the HTTP Request node:

**Body Content Type:** `n8n Binary File`

**Input Data Field Name:** Just use:
```
data
```

**Then use the binary selector** to pick from "HTTP Request6" node.

## Complete Correct Setup

### HTTP Request7 Node: "Upload Video to TikTok"

**Method:** `PUT`

**URL:**
```
{{ $('Initialize Upload').item.json.data.upload_url }}
```

**Headers:**
- `Content-Type: video/mp4`
- `Content-Range: bytes 0-{{ $('Code in JavaScript5').item.json.video_size - 1 }}/{{ $('Code in JavaScript5').item.json.video_size }}`

**Body:**
- **Body Content Type:** `n8n Binary File`
- **Input Data Field Name:** `data` (just the property name)
- **Use Binary Selector:** Click to select from "HTTP Request6" → property "data"

**OR** if HTTP Request6 is directly before this node:

- **Input Data Field Name:** `{{ $binary.data }}`

## Why the Error Happens

The `data: "filesystem-v2"` you see is n8n's internal reference. When you try to use it in an expression, n8n can't resolve it properly, causing circular/invalid errors.

**Solution:** Use n8n's binary selector UI instead of typing expressions for binary data.

## Quick Fix

1. **Remove the expression** from "Input Data Field Name"
2. **Use the binary selector dropdown** to pick from "HTTP Request6"
3. **Select property:** `data`

This will work correctly!


