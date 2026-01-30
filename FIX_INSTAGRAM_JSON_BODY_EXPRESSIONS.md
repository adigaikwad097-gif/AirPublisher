# Fix Instagram JSON Body Expressions Not Evaluating

## Problem

Your JSON body has expressions like:
```json
{
  "video_url": "{{ $('Get a row1').item.json.video_url.replace('&dl=0', '&dl=1')}}",
  "caption": "{{ $('Get a row1').item.json.description }}"
}
```

But n8n might not be evaluating these expressions correctly in the JSON body.

## Solution 1: Use Code Node to Build JSON Body (Recommended)

**Add a Code Node before "Instagram Create Media":**

**Node:** Code
**Name:** Build Instagram Payload
**Code:**
```javascript
// Get data from previous node
const input = $input.item.json;

// Extract values
const videoUrl = (input.video_url || '').replace('&dl=0', '&dl=1');
const description = input.description || '';
const title = input.title || '';

// Build the JSON payload
const payload = {
  media_type: "REELS",
  video_url: videoUrl,
  caption: description || title,
  thumb_offset: 0
};

// Validate required fields
if (!payload.video_url) {
  throw new Error('video_url is required but not found');
}

console.log('Instagram payload:', JSON.stringify(payload, null, 2));

return {
  json: {
    ...input,
    instagram_payload: payload,
    // Also keep individual fields for direct use
    video_url_processed: videoUrl,
    caption_text: description || title,
  }
};
```

**Then in "Instagram Create Media" node:**
- **JSON Body:** `={{ $json.instagram_payload }}`

**OR use individual fields:**
```json
{
  "media_type": "REELS",
  "video_url": "{{ $json.video_url_processed }}",
  "caption": "{{ $json.caption_text }}",
  "thumb_offset": 0
}
```

## Solution 2: Fix JSON Body Expression Syntax

**In n8n, the JSON body should use `=` prefix for expressions:**

**Current (WRONG):**
```json
{
  "video_url": "{{ $('Get a row1').item.json.video_url.replace('&dl=0', '&dl=1')}}"
}
```

**Correct (with = prefix):**
```json
={
  "media_type": "REELS",
  "video_url": "{{ $('Get a row1').item.json.video_url.replace('&dl=0', '&dl=1') }}",
  "caption": "{{ $('Get a row1').item.json.description }}",
  "thumb_offset": 0
}
```

**In n8n UI:**
1. Select **"Specify Body"** → **"JSON"**
2. In the JSON Body field, start with `=` then paste your JSON
3. Make sure there's a space after the closing `}}` in expressions

## Solution 3: Use Simple References (If Using Code Node)

**If you added the Code Node from Solution 1, use simple references:**

```json
{
  "media_type": "REELS",
  "video_url": "{{ $json.video_url_processed }}",
  "caption": "{{ $json.caption_text }}",
  "thumb_offset": 0
}
```

## Solution 4: Verify Node Name

**Make sure "Get a row1" is the exact node name:**

1. Check your workflow
2. Find the node that has your video data
3. Use the EXACT node name (case-sensitive, including spaces)

**If your node is named differently, update the reference:**
- If it's "Get Video Details": `$('Get Video Details').item.json.video.video_url`
- If it's "Supabase Query": `$('Supabase Query').item.json.video_url`
- If it's "HTTP Request": `$('HTTP Request').item.json.video_url`

## Complete Working Configuration

### Option A: With Code Node (Recommended)

**1. Code Node: "Build Instagram Payload"**
```javascript
const input = $input.item.json;
const videoUrl = (input.video_url || input.video?.video_url || '').replace('&dl=0', '&dl=1');
const description = input.description || input.video?.description || '';

return {
  json: {
    instagram_payload: {
      media_type: "REELS",
      video_url: videoUrl,
      caption: description,
      thumb_offset: 0
    },
    instagram_id: input.instagram_id || input.platform_tokens?.instagram_id,
    access_token: input.facebook_access_token || input.instagram_access_token || input.platform_tokens?.access_token,
  }
};
```

**2. Instagram Create Media Node:**
- **URL:** `https://graph.facebook.com/v18.0/{{ $json.instagram_id }}/media`
- **Authorization:** `Bearer {{ $json.access_token }}`
- **JSON Body:** `={{ $json.instagram_payload }}`

### Option B: Direct JSON Body (If Node References Work)

**JSON Body (with = prefix):**
```
={
  "media_type": "REELS",
  "video_url": "{{ $('Get a row1').item.json.video_url.replace('&dl=0', '&dl=1') }}",
  "caption": "{{ $('Get a row1').item.json.description }}",
  "thumb_offset": 0
}
```

**Important:** 
- Start with `=`
- Space after `}}` in expressions
- Node name must match exactly

## Testing

**Add a Code Node after "Build Instagram Payload" to verify:**
```javascript
const payload = $input.item.json.instagram_payload;

console.log('Payload:', JSON.stringify(payload, null, 2));
console.log('Video URL:', payload.video_url);
console.log('Caption:', payload.caption);

// Validate
if (!payload.video_url) {
  throw new Error('video_url is missing');
}

if (!payload.video_url.includes('?dl=1')) {
  console.warn('⚠️ Video URL might not have ?dl=1');
}

return { json: $input.item.json };
```

## Common Issues

### Issue 1: Expressions Not Evaluating

**Symptom:** JSON body shows literal `{{ ... }}` instead of values

**Fix:** 
- Add `=` prefix at the start of JSON body
- Or use Code Node to build the payload

### Issue 2: Node Not Found

**Symptom:** `[Referenced node doesn't exist]`

**Fix:**
- Check exact node name (case-sensitive)
- Use Code Node to normalize data first

### Issue 3: Undefined Values

**Symptom:** `video_url` or `description` is undefined

**Fix:**
- Use Code Node to handle missing values
- Add fallbacks: `input.video_url || input.video?.video_url || ''`

## Recommended Workflow Structure

```
Get a row1 (or Get Video Details)
  ↓
Code Node: Build Instagram Payload
  - Normalize data
  - Build JSON payload
  - Validate required fields
  ↓
Instagram Create Media
  - Use $json.instagram_payload
  - Use $json.access_token
  - Use $json.instagram_id
```

This approach is more reliable than trying to evaluate complex expressions in the JSON body field.

