# Correct Configuration for TikTok Upload Video Node

## Issues Found in Your Configuration

1. ❌ **URL is wrong**: Set to `video/mp4` (should be the `upload_url`)
2. ❌ **Binary reference syntax is wrong**: `$('Code in JavaScript.binary.data')` is invalid
3. ✅ **Content-Range header is correct**

## Correct Configuration

### HTTP Request Node: "Upload Video to TikTok"

#### 1. URL Field (Top of Node)

**Should be:**
```
{{ $('Initialize Upload').item.json.data.upload_url }}
```

**NOT:** `video/mp4`

#### 2. Method

**Set to:** `PUT`

#### 3. Headers (Parameters Section)

**Add Header:**
- **Name:** `Content-Type`
- **Value:** `video/mp4`

**Add Header:**
- **Name:** `Content-Range`
- **Value:** `bytes 0-{{ $('Code in JavaScript5').item.json.video_size - 1 }}/{{ $('Code in JavaScript5').item.json.video_size }}`
  - ✅ This is already correct!

#### 4. Send Body Section

**Body Content Type:** `n8n Binary File`

**Input Data Field Name:** Use one of these options:

### Option 1: Reference Binary from Code Node (If Binary is Passed Through)

```
{{ $('Code in JavaScript5').binary.data }}
```

**OR** if the binary property has a different name:

```
{{ $('Code in JavaScript5').binary }}
```

### Option 2: Use Binary Selector (Recommended)

Instead of typing an expression, use n8n's binary selector:

1. Click the **"Add Binary Data"** button (or similar)
2. Select from dropdown: **"Code in JavaScript5"**
3. Select property: **"data"**

This will automatically generate the correct reference.

### Option 3: Reference Directly from Download Node

If binary isn't passed through Code node, reference the download node:

```
{{ $('HTTP Request6').binary.data }}
```

## Complete Correct Configuration

### HTTP Request7 Node Settings:

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
- **Input Data Field Name:** `{{ $('Code in JavaScript5').binary.data }}`

**OR** use the binary selector to pick from "Code in JavaScript5" node.

## Common Syntax Errors

❌ **Wrong:** `{{ $('Code in JavaScript.binary.data') }}`  
✅ **Correct:** `{{ $('Code in JavaScript5').binary.data }}`

❌ **Wrong:** `{{ $Code in JavaScript5.binary.data }}`  
✅ **Correct:** `{{ $('Code in JavaScript5').binary.data }}`

## If Binary Still Not Found

If `$('Code in JavaScript5').binary.data` doesn't work, try:

1. **Check node name exactly** - Make sure it matches: `'Code in JavaScript5'`
2. **Use binary selector** - Click "Add Binary Data" and select from dropdown
3. **Reference download node directly:**
   ```
   {{ $('HTTP Request6').binary.data }}
   ```

## Quick Fix Steps

1. **Change URL** from `video/mp4` to `{{ $('Initialize Upload').item.json.data.upload_url }}`
2. **Fix binary reference** to `{{ $('Code in JavaScript5').binary.data }}`
3. **Add Content-Type header:** `video/mp4`
4. **Keep Content-Range header** as is (it's correct)


