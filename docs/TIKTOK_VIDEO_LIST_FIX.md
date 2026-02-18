# Fix: TikTok Video List API "Unsupported Path" Error

## Problem

Getting "unsupported path" error when calling TikTok Video List API.

## Solution

The TikTok API v2 Video List endpoint requires:
1. **POST method** (not GET)
2. **JSON body** (not query parameters)
3. **Correct Authorization header format**

## Correct Configuration

### HTTP Request Node: "Get Video URL"

**Method:** POST  
**URL:** `https://open.tiktokapis.com/v2/video/list/`

**Headers:**
- `Authorization: Bearer {{ $('Get a row5').item.json.tiktok_access_token }}`
- `Content-Type: application/json`

**Body (JSON):**
```json
{
  "fields": ["id", "create_time", "video_description", "share_url"],
  "max_count": 1
}
```

## Fix Your Current Configuration

### Issue 1: Method
- ❌ **Current:** No method specified (defaults to GET)
- ✅ **Should be:** POST

### Issue 2: Parameters Location
- ❌ **Current:** Query parameters
- ✅ **Should be:** JSON body

### Issue 3: Authorization Header
- ❌ **Current:** `=Bearer {{ ... }}` (the `=` is wrong)
- ✅ **Should be:** `Bearer {{ ... }}` (remove the `=`)

### Issue 4: Fields Format
- ❌ **Current:** `"id,create_time,video_description,share_url"` (comma-separated string)
- ✅ **Should be:** `["id", "create_time", "video_description", "share_url"]` (array)

## Complete Correct Configuration

```json
{
  "parameters": {
    "method": "POST",
    "url": "https://open.tiktokapis.com/v2/video/list/",
    "sendHeaders": true,
    "headerParameters": {
      "parameters": [
        {
          "name": "Authorization",
          "value": "Bearer {{ $('Get a row5').item.json.tiktok_access_token }}"
        },
        {
          "name": "Content-Type",
          "value": "application/json"
        }
      ]
    },
    "sendBody": true,
    "contentType": "json",
    "specifyBody": "json",
    "jsonBody": "={\n  \"fields\": [\"id\", \"create_time\", \"video_description\", \"share_url\"],\n  \"max_count\": 1\n}",
    "options": {}
  }
}
```

## Step-by-Step Fix in n8n

1. **Change Method to POST:**
   - In HTTP Request node, set Method to `POST`

2. **Remove Query Parameters:**
   - Delete the query parameters section

3. **Add JSON Body:**
   - Set "Body Content Type" to `JSON`
   - Add body:
   ```json
   {
     "fields": ["id", "create_time", "video_description", "share_url"],
     "max_count": 1
   }
   ```

4. **Fix Authorization Header:**
   - Change from: `=Bearer {{ ... }}`
   - To: `Bearer {{ ... }}`
   - Remove the `=` at the beginning

5. **Add Content-Type Header:**
   - Add header: `Content-Type: application/json`

## Expected Response

```json
{
  "data": {
    "videos": [
      {
        "id": "7234567890123456789",
        "create_time": 1706779999,
        "video_description": "Your video title",
        "share_url": "https://www.tiktok.com/@username/video/7234567890123456789"
      }
    ],
    "cursor": 0,
    "has_more": false
  },
  "error": {
    "code": "ok",
    "message": "",
    "log_id": "..."
  }
}
```

## Quick Fix Summary

1. ✅ Method: **POST** (not GET)
2. ✅ Body: **JSON** with `fields` array and `max_count`
3. ✅ Authorization: **Bearer** (no `=` prefix)
4. ✅ Content-Type: **application/json** header

This should resolve the "unsupported path" error!


