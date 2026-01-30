# Fix "[Referenced node doesn't exist]" Error in Instagram JSON Body

## Problem

Your JSON body shows:
```
"[Referenced node doesn't exist]"
```

This means the node names in your expressions don't match the actual node names in your workflow.

## Solution: Use Correct Node Names

Based on your original configuration, you were using:
- `$('Get a row1')` for video data
- `$('Switch')` for description

### Corrected JSON Body

**If using "Get a row1" and "Switch" nodes:**

```json
{
  "media_type": "REELS",
  "video_url": "{{ $('Get a row1').item.json.video_url.replace('&dl=0', '&dl=1') }}",
  "caption": "{{ $('Switch').item.json.body.description }}",
  "thumb_offset": 0
}
```

**If using "Get Video Details" node (recommended):**

```json
{
  "media_type": "REELS",
  "video_url": "{{ $('Get Video Details').item.json.video.video_url.replace('&dl=0', '&dl=1') }}",
  "caption": "{{ $('Get Video Details').item.json.video.title }}\n\n{{ $('Get Video Details').item.json.video.description }}",
  "thumb_offset": 0
}
```

## How to Find Correct Node Names

1. **Check your workflow nodes:**
   - Look at the node names in your n8n workflow
   - Common names: "Get Video Details", "Get a row1", "Switch", "Webhook", etc.

2. **Test node references:**
   - Add a **Code Node** before "Instagram Create Media"
   - Log the data to see what's available:
   ```javascript
   // Test what data is available
   const previousNode = $input.item.json;
   console.log('Available data:', JSON.stringify(previousNode, null, 2));
   
   return {
     json: {
       ...previousNode,
       debug: 'Check console for available fields'
     }
   };
   ```

3. **Use the correct node name:**
   - The node name must match EXACTLY (case-sensitive)
   - If your node is named "Get a row1", use `$('Get a row1')`
   - If your node is named "Get Video Details", use `$('Get Video Details')`

## Step-by-Step Fix

### Step 1: Identify Your Node Names

Look at your workflow and note:
- Which node has the video URL? (e.g., "Get a row1", "Get Video Details")
- Which node has the description? (e.g., "Switch", "Webhook", "Get Video Details")

### Step 2: Update JSON Body in n8n

1. Open "Instagram Create Media" node
2. Go to **Body** section
3. Select **JSON** format
4. Paste the corrected JSON (using your actual node names):

**Example if your nodes are "Get a row1" and "Switch":**
```json
{
  "media_type": "REELS",
  "video_url": "{{ $('Get a row1').item.json.video_url.replace('&dl=0', '&dl=1') }}",
  "caption": "{{ $('Switch').item.json.body.description }}",
  "thumb_offset": 0
}
```

**Example if your node is "Get Video Details":**
```json
{
  "media_type": "REELS",
  "video_url": "{{ $('Get Video Details').item.json.video.video_url.replace('&dl=0', '&dl=1') }}",
  "caption": "{{ $('Get Video Details').item.json.video.title }}\n\n{{ $('Get Video Details').item.json.video.description }}",
  "thumb_offset": 0
}
```

### Step 3: Verify Node References

After updating, n8n should show:
- ✅ Green checkmarks if nodes exist
- ❌ Red "[Referenced node doesn't exist]" if nodes don't exist

## Common Node Name Patterns

### If you're using Supabase query:
- Node name might be: "Get a row1", "Get Row", "Supabase Query"
- Data path: `$('Get a row1').item.json.video_url`

### If you're using API call:
- Node name might be: "Get Video Details", "HTTP Request", "Get Video"
- Data path: `$('Get Video Details').item.json.video.video_url`

### If you're using webhook:
- Node name might be: "Webhook", "Switch", "IF"
- Data path: `$('Webhook').item.json.body.description`

## Quick Test

Add a **Code Node** right before "Instagram Create Media" to debug:

```javascript
// Try different node references to see what works
const node1 = $('Get a row1')?.item?.json;
const node2 = $('Get Video Details')?.item?.json;
const node3 = $('Switch')?.item?.json;

console.log('Get a row1:', node1);
console.log('Get Video Details:', node2);
console.log('Switch:', node3);

// Return the one that has data
const data = node2 || node1 || node3;

return {
  json: {
    video_url: data?.video?.video_url || data?.video_url,
    description: data?.video?.description || data?.body?.description || data?.description,
    instagram_id: data?.platform_tokens?.instagram_id || data?.instagram_id,
    access_token: data?.platform_tokens?.access_token || data?.instagram_access_token,
  }
};
```

Then in "Instagram Create Media", use:
```json
{
  "media_type": "REELS",
  "video_url": "{{ $json.video_url.replace('&dl=0', '&dl=1') }}",
  "caption": "{{ $json.description }}",
  "thumb_offset": 0
}
```

## Final Corrected Configuration

Based on your original setup, here's the corrected JSON body:

```json
{
  "media_type": "REELS",
  "video_url": "{{ $('Get a row1').item.json.video_url.replace('&dl=0', '&dl=1') }}",
  "caption": "{{ $('Switch').item.json.body.description }}",
  "thumb_offset": 0
}
```

**Make sure:**
1. Node "Get a row1" exists in your workflow
2. Node "Switch" exists in your workflow
3. The node names match EXACTLY (case-sensitive, including spaces)

