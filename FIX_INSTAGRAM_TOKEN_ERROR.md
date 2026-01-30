# Fix Instagram "Invalid OAuth access token" Error

## Error Message
```
401 - "Invalid OAuth access token - Cannot parse access token"
```

## Common Causes

### 1. Missing "Bearer " Prefix in Authorization Header

**Problem:** The Authorization header must include the word "Bearer " before the token.

**Incorrect:**
```
Authorization: IGAAL49pr6sxxBZAGJ0ZAmtERjNxdjE5VVdRbU5nSVQyajRiOWwzMDkyRjFyYmcwWUVFUURLS0twdzVoMEs2eU9iZAnZARcnVYSm85c1lCd0RPbmxDbFJ4M3hmenp0TmZAVTHQ0Nk9aSVIyVW9UUkVEREowR293
```

**Correct:**
```
Authorization: Bearer IGAAL49pr6sxxBZAGJ0ZAmtERjNxdjE5VVdRbU5nSVQyajRiOWwzMDkyRjFyYmcwWUVFUURLS0twdzVoMEs2eU9iZAnZARcnVYSm85c1lCd0RPbmxDbFJ4M3hmenp0TmZAVTHQ0Nk9aSVIyVW9UUkVEREowR293
```

### 2. Wrong Content-Type (multipart/form-data instead of application/json)

**Problem:** Instagram's create media container API expects JSON, not multipart form data.

**Incorrect:**
```
Content-Type: multipart/form-data; boundary=...
```

**Correct:**
```
Content-Type: application/json
```

### 3. Wrong Token Path in n8n

**Problem:** The token reference in n8n might be incorrect.

**Check your n8n HTTP Request node:**
- **Authorization Header Value:** `Bearer {{ $('Get Video Details').item.json.platform_tokens.access_token }}`
- **NOT:** `{{ $('Get Video Details').item.json.platform_tokens.access_token }}` (missing "Bearer ")
- **NOT:** `Bearer {{ $json.access_token }}` (wrong path)

## Step-by-Step Fix in n8n

### Step 1: Verify Token Path

Add a **Code Node** after "Get Video Details" to debug:

```javascript
const videoDetails = $input.item.json;

console.log('Full response:', JSON.stringify(videoDetails, null, 2));
console.log('Platform tokens:', videoDetails.platform_tokens);
console.log('Access token:', videoDetails.platform_tokens?.access_token);

return {
  json: {
    ...videoDetails,
    debug_token: videoDetails.platform_tokens?.access_token,
    debug_token_length: videoDetails.platform_tokens?.access_token?.length || 0,
  }
};
```

**Expected Output:**
```json
{
  "platform_tokens": {
    "access_token": "IGAAL49pr6sxxBZAGJ0ZAmtERjNxdjE5VVdRbU5nSVQyajRiOWwzMDkyRjFyYmcwWUVFUURLS0twdzVoMEs2eU9iZAnZARcnVYSm85c1lCd0RPbmxDbFJ4M3hmenp0TmZAVTHQ0Nk9aSVIyVW9UUkVEREowR293",
    "instagram_id": "27085892291011296",
    "username": "your_username"
  }
}
```

### Step 2: Fix HTTP Request Node for Create Media Container

**Node:** HTTP Request
- **Name:** Create Media Container
- **Method:** POST
- **URL:** `https://graph.facebook.com/v18.0/{{ $('Get Video Details').item.json.platform_tokens.instagram_id }}/media`

**Headers:**
- **Name:** `Authorization`
- **Value:** `Bearer {{ $('Get Video Details').item.json.platform_tokens.access_token }}`
  - ⚠️ **CRITICAL:** Must include "Bearer " (with space) before the token expression

- **Name:** `Content-Type`
- **Value:** `application/json`
  - ⚠️ **CRITICAL:** Must be `application/json`, NOT `multipart/form-data`

**Body:**
- **Send Body:** ✅ Yes
- **Specify Body:** `JSON`
- **JSON Body:**
```json
{
  "media_type": "REELS",
  "video_url": "{{ $('Get Video Details').item.json.video.video_url.replace('&dl=0', '&dl=1') }}",
  "caption": "{{ $('Get Video Details').item.json.video.title }}\n\n{{ $('Get Video Details').item.json.video.description }}",
  "thumb_offset": 0
}
```

### Step 3: Verify Token Format

The token should:
- Start with `IG` (Instagram token prefix)
- Be a long string (typically 200+ characters)
- Not have any spaces or line breaks
- Not be wrapped in quotes in the header

**Example Valid Token:**
```
IGAAL49pr6sxxBZAGJ0ZAmtERjNxdjE5VVdRbU5nSVQyajRiOWwzMDkyRjFyYmcwWUVFUURLS0twdzVoMEs2eU9iZAnZARcnVYSm85c1lCd0RPbmxDbFJ4M3hmenp0TmZAVTHQ0Nk9aSVIyVW9UUkVEREowR293
```

## Common n8n Mistakes

### Mistake 1: Using "=" in Header Value

**Wrong:**
```
Authorization: =Bearer {{ $json.access_token }}
```

**Correct:**
```
Authorization: Bearer {{ $('Get Video Details').item.json.platform_tokens.access_token }}
```

### Mistake 2: Missing Space After "Bearer"

**Wrong:**
```
Authorization: Bearer{{ $json.access_token }}
```

**Correct:**
```
Authorization: Bearer {{ $json.access_token }}
```

### Mistake 3: Using Wrong Node Reference

**Wrong:**
```
Authorization: Bearer {{ $json.access_token }}
```
(If you're not in the "Get Video Details" node context)

**Correct:**
```
Authorization: Bearer {{ $('Get Video Details').item.json.platform_tokens.access_token }}
```

### Mistake 4: Using Form Data Instead of JSON

**Wrong:**
- **Send Body:** ✅ Yes
- **Specify Body:** `Form-Data` or `Form-Urlencoded`

**Correct:**
- **Send Body:** ✅ Yes
- **Specify Body:** `JSON`
- **Content-Type Header:** `application/json`

## Testing the Token

### Test 1: Verify Token is Valid

**HTTP Request Node:**
- **Method:** GET
- **URL:** `https://graph.instagram.com/me?fields=id,username&access_token={{ $('Get Video Details').item.json.platform_tokens.access_token }}`

**Expected Response:**
```json
{
  "id": "27085892291011296",
  "username": "your_username"
}
```

If this fails, the token is invalid or expired.

### Test 2: Check Token Expiration

Your token expires on: `2026-03-19T09:03:01.653+00:00`

Check if it's expired:
- Current time: Check n8n execution logs
- Token expires: March 19, 2026

If expired, you need to refresh it using the token refresh endpoint.

## Complete Correct n8n Configuration

**HTTP Request Node: "Create Media Container"**

```
Method: POST
URL: https://graph.facebook.com/v18.0/{{ $('Get Video Details').item.json.platform_tokens.instagram_id }}/media

Headers:
  Authorization: Bearer {{ $('Get Video Details').item.json.platform_tokens.access_token }}
  Content-Type: application/json

Body (JSON):
{
  "media_type": "REELS",
  "video_url": "{{ $('Get Video Details').item.json.video.video_url.replace('&dl=0', '&dl=1') }}",
  "caption": "{{ $('Get Video Details').item.json.video.title }}\n\n{{ $('Get Video Details').item.json.video.description }}",
  "thumb_offset": 0
}
```

## Quick Checklist

- [ ] Authorization header has "Bearer " prefix (with space)
- [ ] Content-Type is `application/json` (not multipart/form-data)
- [ ] Token path is correct: `{{ $('Get Video Details').item.json.platform_tokens.access_token }}`
- [ ] Body is set to JSON format (not Form-Data)
- [ ] Token is not expired (check `expires_at` field)
- [ ] Instagram ID is correct: `{{ $('Get Video Details').item.json.platform_tokens.instagram_id }}`

## If Still Failing

1. **Check token expiration:**
   - Your token expires: `2026-03-19T09:03:01.653+00:00`
   - If expired, the `/api/n8n/video-details` endpoint should auto-refresh it
   - If refresh fails, user needs to reconnect Instagram

2. **Verify token in database:**
   - Check `airpublisher_instagram_tokens` table
   - Ensure `instagram_access_token` field has the token
   - Ensure `expires_at` is in the future

3. **Test token directly:**
   ```bash
   curl "https://graph.instagram.com/me?fields=id,username&access_token=YOUR_TOKEN_HERE"
   ```

4. **Check Instagram App permissions:**
   - Ensure `instagram_business_basic` scope is granted
   - Ensure `instagram_business_content_publish` scope is granted
   - Verify in Meta Dashboard → Instagram → Permissions

