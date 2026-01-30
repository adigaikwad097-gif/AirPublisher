# Fix "No output data returned" Error in n8n

## Problem

n8n shows: "No output data returned" and stops executing the workflow.

## Common Causes

1. **Previous node has no output** - The node before "Instagram Create Media" isn't returning data
2. **Node references are wrong** - The expressions reference nodes that don't exist or have no data
3. **HTTP request failed silently** - The request failed but n8n didn't show an error
4. **Data path is incorrect** - The JSON path doesn't match the actual data structure

## Step-by-Step Debugging

### Step 1: Check Previous Node Output

**Before "Instagram Create Media" node, add a Code Node to debug:**

**Node:** Code
**Name:** Debug Data
**Code:**
```javascript
// Get data from previous node
const inputData = $input.all();

console.log('Number of items:', inputData.length);
console.log('First item:', JSON.stringify(inputData[0]?.json, null, 2));

// Check if we have the required data
const firstItem = inputData[0]?.json || {};

// Log what we're looking for
console.log('Looking for:');
console.log('- video_url:', firstItem.video_url || firstItem.video?.video_url || 'NOT FOUND');
console.log('- instagram_id:', firstItem.instagram_id || firstItem.platform_tokens?.instagram_id || 'NOT FOUND');
console.log('- access_token:', firstItem.instagram_access_token || firstItem.platform_tokens?.access_token || 'NOT FOUND');

// Return the data so next node can use it
return inputData.map(item => ({
  json: {
    ...item.json,
    // Normalize the data structure
    video_url: item.json.video_url || item.json.video?.video_url,
    instagram_id: item.json.instagram_id || item.json.platform_tokens?.instagram_id,
    access_token: item.json.instagram_access_token || item.json.platform_tokens?.access_token || item.json.facebook_access_token,
    description: item.json.description || item.json.video?.description || item.json.body?.description,
    title: item.json.title || item.json.video?.title,
  }
}));
```

### Step 2: Verify Node Connections

**Check your workflow connections:**
1. Make sure "Get Video Details" (or "Get a row1") is connected to "Instagram Create Media"
2. The connection arrow should go from the previous node TO "Instagram Create Media"
3. If there's a "Switch" or "IF" node, make sure the correct branch is connected

### Step 3: Test Each Node Individually

**Execute nodes one by one:**

1. **Execute "Get Video Details" (or "Get a row1")**
   - Click the node
   - Click "Execute Node"
   - Check if it returns data
   - Look at the output panel

2. **If it returns data, check the structure:**
   - What fields are available?
   - Is `video_url` at `json.video_url` or `json.video.video_url`?
   - Is `instagram_id` at `json.instagram_id` or `json.platform_tokens.instagram_id`?

### Step 4: Fix Node References

**Based on your actual data structure, update "Instagram Create Media":**

**If data comes from "Get a row1" and structure is flat:**
```json
{
  "media_type": "REELS",
  "video_url": "{{ $json.video_url.replace('&dl=0', '&dl=1') }}",
  "caption": "{{ $json.description }}",
  "thumb_offset": 0
}
```

**If data comes from "Get Video Details" and structure is nested:**
```json
{
  "media_type": "REELS",
  "video_url": "{{ $json.video.video_url.replace('&dl=0', '&dl=1') }}",
  "caption": "{{ $json.video.title }}\n\n{{ $json.video.description }}",
  "thumb_offset": 0
}
```

**If using the Debug Code Node output:**
```json
{
  "media_type": "REELS",
  "video_url": "{{ $json.video_url.replace('&dl=0', '&dl=1') }}",
  "caption": "{{ $json.description }}",
  "thumb_offset": 0
}
```

### Step 5: Enable "Always Output Data"

**In n8n Settings:**
1. Go to **Settings** → **Workflows**
2. Enable **"Always Output Data"**
3. This will prevent n8n from stopping when a node has no output

**Or per-node:**
1. Click on "Instagram Create Media" node
2. Go to **Options** tab
3. Enable **"Always Output Data"**

## Common Scenarios

### Scenario 1: "Get Video Details" Returns Empty

**Problem:** The API call to `/api/n8n/video-details` returns no data.

**Solution:**
- Check if `video_id` is being passed correctly
- Verify the API endpoint is accessible
- Check if authentication header (`x-n8n-api-key`) is set
- Look at n8n execution logs for API errors

### Scenario 2: Data Structure Mismatch

**Problem:** The JSON path doesn't match the actual data structure.

**Solution:**
- Use the Debug Code Node to see actual structure
- Update JSON body to match actual paths
- Or use the Code Node to normalize the data first

### Scenario 3: Switch/IF Node Filtering Out Data

**Problem:** A Switch or IF node is filtering out all items.

**Solution:**
- Check Switch node conditions
- Make sure at least one branch allows data through
- Add a default/fallback branch

### Scenario 4: HTTP Request Failing Silently

**Problem:** The Instagram API request fails but n8n doesn't show error.

**Solution:**
1. In "Instagram Create Media" node:
   - Go to **Options** tab
   - Enable **"Continue On Fail"**
   - Enable **"Always Output Data"**
2. Check the node output for error details
3. Look at the response status code and body

## Quick Fix: Use Code Node to Normalize Data

**Add this Code Node before "Instagram Create Media":**

```javascript
// Normalize data from previous node
const input = $input.item.json;

// Try different possible paths
const videoUrl = input.video_url 
  || input.video?.video_url 
  || input.body?.video_url
  || '';

const instagramId = input.instagram_id 
  || input.platform_tokens?.instagram_id
  || '';

const accessToken = input.instagram_access_token
  || input.platform_tokens?.access_token
  || input.facebook_access_token
  || '';

const description = input.description
  || input.video?.description
  || input.body?.description
  || '';

const title = input.title
  || input.video?.title
  || input.body?.title
  || '';

// Validate required fields
if (!videoUrl) {
  throw new Error('video_url not found in input data');
}

if (!instagramId) {
  throw new Error('instagram_id not found in input data');
}

if (!accessToken) {
  throw new Error('access_token not found in input data');
}

// Return normalized data
return {
  json: {
    video_url: videoUrl,
    instagram_id: instagramId,
    access_token: accessToken,
    description: description,
    title: title,
    caption: `${title}\n\n${description}`.trim(),
  }
};
```

**Then in "Instagram Create Media" node, use:**
```json
{
  "media_type": "REELS",
  "video_url": "{{ $json.video_url.replace('&dl=0', '&dl=1') }}",
  "caption": "{{ $json.caption }}",
  "thumb_offset": 0
}
```

**And for Authorization header:**
```
Bearer {{ $json.access_token }}
```

**And for URL:**
```
https://graph.facebook.com/v18.0/{{ $json.instagram_id }}/media
```

## Checklist

- [ ] Previous node outputs data (check execution)
- [ ] Node connections are correct (arrows point in right direction)
- [ ] JSON paths match actual data structure
- [ ] "Always Output Data" is enabled (Settings or node options)
- [ ] HTTP request has proper error handling enabled
- [ ] Debug Code Node shows what data is available

