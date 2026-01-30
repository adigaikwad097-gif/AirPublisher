# Fix Instagram Create Media Container Node

## Your Current Configuration (WRONG)

```json
{
  "contentType": "multipart-form-data",  // ❌ WRONG
  "bodyParameters": {                    // ❌ WRONG - This is for form data
    "parameters": [...]
  }
}
```

## Corrected Configuration

### Option 1: Using JSON Body (Recommended)

```json
{
  "parameters": {
    "method": "POST",
    "url": "=https://graph.facebook.com/v18.0/{{ $('Get Video Details').item.json.platform_tokens.instagram_id }}/media",
    "sendHeaders": true,
    "headerParameters": {
      "parameters": [
        {
          "name": "Authorization",
          "value": "=Bearer {{ $('Get Video Details').item.json.platform_tokens.access_token }}"
        },
        {
          "name": "Content-Type",
          "value": "application/json"
        }
      ]
    },
    "sendBody": true,
    "specifyBody": "json",
    "jsonBody": "={\n  \"media_type\": \"REELS\",\n  \"video_url\": \"{{ $('Get Video Details').item.json.video.video_url.replace('&dl=0', '&dl=1') }}\",\n  \"caption\": \"{{ $('Get Video Details').item.json.video.title }}\\n\\n{{ $('Get Video Details').item.json.video.description }}\",\n  \"thumb_offset\": 0\n}",
    "options": {}
  }
}
```

### Step-by-Step Fix in n8n UI

1. **Open your "Instagram Create Media" HTTP Request node**

2. **Fix the URL:**
   - **URL:** `https://graph.facebook.com/v18.0/{{ $('Get Video Details').item.json.platform_tokens.instagram_id }}/media`
   - Replace `$json.instagram_id` with the correct path from "Get Video Details" node

3. **Fix the Authorization Header:**
   - **Name:** `Authorization`
   - **Value:** `Bearer {{ $('Get Video Details').item.json.platform_tokens.access_token }}`
   - Make sure "Bearer " (with space) is included
   - Use the token from "Get Video Details" node, not `$json.instagram_access_token`

4. **Add Content-Type Header:**
   - **Name:** `Content-Type`
   - **Value:** `application/json`

5. **Fix the Body:**
   - **Send Body:** ✅ Yes
   - **Specify Body:** Select `JSON` (NOT "Form-Data" or "Form-Urlencoded")
   - **JSON Body:** 
   ```json
   {
     "media_type": "REELS",
     "video_url": "{{ $('Get Video Details').item.json.video.video_url.replace('&dl=0', '&dl=1') }}",
     "caption": "{{ $('Get Video Details').item.json.video.title }}\n\n{{ $('Get Video Details').item.json.video.description }}",
     "thumb_offset": 0
   }
   ```

6. **Remove/Delete:**
   - ❌ Remove `contentType: "multipart-form-data"`
   - ❌ Remove `bodyParameters` section

## Complete Corrected Node JSON

```json
{
  "parameters": {
    "method": "POST",
    "url": "=https://graph.facebook.com/v18.0/{{ $('Get Video Details').item.json.platform_tokens.instagram_id }}/media",
    "sendHeaders": true,
    "headerParameters": {
      "parameters": [
        {
          "name": "Authorization",
          "value": "=Bearer {{ $('Get Video Details').item.json.platform_tokens.access_token }}"
        },
        {
          "name": "Content-Type",
          "value": "application/json"
        }
      ]
    },
    "sendBody": true,
    "specifyBody": "json",
    "jsonBody": "={\n  \"media_type\": \"REELS\",\n  \"video_url\": \"{{ $('Get Video Details').item.json.video.video_url.replace('&dl=0', '&dl=1') }}\",\n  \"caption\": \"{{ $('Get Video Details').item.json.video.title }}\\n\\n{{ $('Get Video Details').item.json.video.description }}\",\n  \"thumb_offset\": 0\n}",
    "options": {}
  },
  "type": "n8n-nodes-base.httpRequest",
  "typeVersion": 4.3,
  "name": "Instagram Create Media"
}
```

## Key Changes

### ❌ What to Remove:
- `"contentType": "multipart-form-data"`
- `"bodyParameters": { ... }`

### ✅ What to Add:
- `"specifyBody": "json"`
- `"jsonBody": "={ ... }"`
- `"Content-Type": "application/json"` header

## If You're Not Using "Get Video Details" Node

If your token data comes from a different node (like "Get a row1"), adjust the paths:

**For URL:**
```
https://graph.facebook.com/v18.0/{{ $('Get a row1').item.json.instagram_id }}/media
```

**For Authorization:**
```
Bearer {{ $('Get a row1').item.json.instagram_access_token }}
```

**For Video URL:**
```
{{ $('Get a row1').item.json.video_url.replace('&dl=0', '&dl=1') }}
```

**For Caption:**
```
{{ $('Switch').item.json.body.description }}
```

## Testing

After fixing, test the node:
1. Execute the workflow
2. Check the response - should be:
   ```json
   {
     "id": "17912345678901234"
   }
   ```
3. If you still get 401 error, verify:
   - Authorization header has "Bearer " prefix
   - Token is not expired
   - Token path is correct

