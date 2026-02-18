# Fix: TikTok Initialize Upload Body - "[object Object]" Issue

## Problem
When using `{{ $json.post_info }}` in n8n JSON body, it shows as `[object Object]` instead of the actual JSON.

## Solution 1: Use JSON.stringify() in Expression

In the HTTP Request node body, use:

```json
{
  "post_info": {{ JSON.stringify($json.post_info) }},
  "source_info": {{ JSON.stringify($json.source_info) }}
}
```

**Note:** This might not work in all n8n versions. If it doesn't, use Solution 2.

## Solution 2: Use Code Node to Format Body (Recommended)

Add a **Code node** between your "Extract File Metadata from Binary" node and the "Initialize Upload" HTTP Request node.

### Code Node: "Format TikTok Body"

```javascript
// Get the metadata from previous node
const metadata = $input.first().json;

// Return formatted body for TikTok API
return {
  json: {
    post_info: metadata.post_info,
    source_info: metadata.source_info
  }
};
```

### Then in HTTP Request Node:

**Body (JSON):**
```json
{
  "post_info": {{ $json.post_info }},
  "source_info": {{ $json.source_info }}
}
```

**OR** if that still shows `[object Object]`, use:

**Body Content Type:** `JSON`  
**JSON Body:**
```json
{{ $json }}
```

And in the Code node, return the full body:

```javascript
const metadata = $input.first().json;

return {
  json: {
    post_info: metadata.post_info,
    source_info: metadata.source_info
  }
};
```

## Solution 3: Use Raw Body with JSON.stringify (Most Reliable)

In the HTTP Request node:

**Body Content Type:** `Raw`  
**Content Type:** `application/json`  
**Body:**
```javascript
{{ JSON.stringify({
  "post_info": $json.post_info,
  "source_info": $json.source_info
}) }}
```

## Solution 4: Build Complete Body in Code Node (Best for Complex Cases)

Add a Code node that builds the entire body:

```javascript
const metadata = $input.first().json;

// Build the complete TikTok API body
const body = {
  post_info: metadata.post_info,
  source_info: metadata.source_info
};

return {
  json: body
};
```

Then in HTTP Request node:

**Body Content Type:** `JSON`  
**JSON Body:**
```json
{{ $json }}
```

## Recommended Workflow

1. **Extract File Metadata from Binary** (Code node) - Your existing node
2. **Format TikTok Body** (Code node) - NEW node with Solution 4 code
3. **Initialize Upload** (HTTP Request node) - Use `{{ $json }}` as body

This ensures the body is properly formatted as JSON.


