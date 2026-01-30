# Fix Instagram Authorization Header in n8n

## The Problem

Even though:
- ✅ Token is valid (confirmed by Graph API Explorer)
- ✅ Instagram ID is correct (27085892291011294)
- ✅ Token has all required permissions
- ❌ Still getting "Cannot parse access token"

This means the **Authorization header format** in n8n is wrong.

## Common Issues

### Issue 1: Extra Spaces or Characters

**Wrong:**
```
Authorization: Bearer  IGAAL49pr6sxx...  (extra space after Bearer)
Authorization: BearerIGAAL49pr6sxx...    (no space after Bearer)
Authorization: "Bearer IGAAL49pr6sxx..." (quotes around value)
```

**Correct:**
```
Authorization: Bearer IGAAL49pr6sxx...
```
(Single space after "Bearer", no quotes)

### Issue 2: Token Expression Not Evaluating

**Wrong:**
```
Authorization: Bearer {{ $json.facebook_access_token }}
```
(If `$json.facebook_access_token` is undefined or empty)

**Check:** Add a Code Node before to verify token exists:
```javascript
const input = $input.item.json;
console.log('Token exists:', !!input.facebook_access_token);
console.log('Token length:', input.facebook_access_token?.length);
console.log('Token preview:', input.facebook_access_token?.substring(0, 20));

if (!input.facebook_access_token) {
  throw new Error('facebook_access_token is missing!');
}

return { json: input };
```

### Issue 3: Token Has Line Breaks or Special Characters

**Check:** The token might have hidden characters. Use `.trim()` in expression:
```
Bearer {{ $json.facebook_access_token.trim() }}
```

## Step-by-Step Fix

### Step 1: Verify Token in Code Node

**Add Code Node before "Instagram Create Media":**

```javascript
const input = $input.item.json;

// Extract token
const token = input.facebook_access_token || input.instagram_access_token || '';

// Clean token (remove any whitespace)
const cleanToken = token.trim();

// Validate
if (!cleanToken) {
  throw new Error('No access token found!');
}

if (cleanToken.length < 50) {
  throw new Error(`Token seems too short: ${cleanToken.length} characters`);
}

console.log('Token length:', cleanToken.length);
console.log('Token starts with:', cleanToken.substring(0, 10));
console.log('Token ends with:', cleanToken.substring(cleanToken.length - 10));

// Return cleaned token
return {
  json: {
    ...input,
    clean_access_token: cleanToken,
    instagram_id: input.instagram_id || '27085892291011294',
  }
};
```

### Step 2: Fix Authorization Header

**In "Instagram Create Media" node:**

**Option A: Use Clean Token from Code Node**
- **Authorization:** `Bearer {{ $json.clean_access_token }}`

**Option B: Use Direct Expression with Trim**
- **Authorization:** `Bearer {{ $json.facebook_access_token.trim() }}`

**Option C: Hardcode for Testing (temporarily)**
- **Authorization:** `Bearer IGAAL49pr6sxxBZAGJ0ZAmtERjNxdjE5VVdRbU5nSVQyajRiOWwzMDkyRjFyYmcwWUVFUURLS0twdzVoMEs2eU9iZAnZARcnVYSm85c1lCd0RPbmxDbFJ4M3hmenp0TmZAVTHQ0Nk9aSVIyVW9UUkVEREowR293`

### Step 3: Verify Header Format in n8n

**In n8n HTTP Request node:**
1. Go to **Headers** section
2. **Name:** `Authorization`
3. **Value:** `Bearer {{ $json.clean_access_token }}`
   - ⚠️ **NO quotes** around the value
   - ⚠️ **NO `=` prefix** (that's only for JSON body)
   - ⚠️ **Single space** after "Bearer"

### Step 4: Test Authorization Header

**Add HTTP Request node to test:**

**Node:** HTTP Request
**Name:** Test Authorization Header
**Method:** GET
**URL:** `https://graph.facebook.com/v18.0/me`
**Headers:**
- **Authorization:** `Bearer {{ $json.clean_access_token }}`

**Expected Response:**
```json
{
  "id": "your_facebook_user_id",
  "name": "Your Name"
}
```

**If this fails:** The Authorization header format is still wrong.

## Complete Working Configuration

### Code Node: Prepare Token

```javascript
const input = $input.item.json;

const token = (input.facebook_access_token || input.instagram_access_token || '').trim();

if (!token) {
  throw new Error('No access token found');
}

return {
  json: {
    ...input,
    access_token: token,
    instagram_id: input.instagram_id || '27085892291011294',
  }
};
```

### Instagram Create Media Node

**URL:**
```
https://graph.facebook.com/v18.0/{{ $json.instagram_id }}/media
```

**Headers:**
- **Name:** `Authorization`
- **Value:** `Bearer {{ $json.access_token }}`
  - ⚠️ No quotes
  - ⚠️ No `=` prefix
  - ⚠️ Space after "Bearer"

- **Name:** `Content-Type`
- **Value:** `application/json`

**Body:**
- **Specify Body:** `JSON`
- **JSON Body:**
```json
{
  "media_type": "REELS",
  "video_url": "{{ $json.video_url.replace('&dl=0', '&dl=1') }}",
  "caption": "{{ $json.description }}",
  "thumb_offset": 0
}
```

## Debug: See Actual Request

**Add Code Node after "Instagram Create Media" to see what was sent:**

```javascript
// This won't show the actual request, but you can check n8n execution logs
// Or add error handling to see the response

const error = $input.item.json.error || $input.item.json;

console.log('Response:', JSON.stringify(error, null, 2));

return { json: $input.item.json };
```

## Alternative: Use Query Parameter (For Testing)

**Temporarily test with token in URL (not recommended for production):**

**URL:**
```
https://graph.facebook.com/v18.0/{{ $json.instagram_id }}/media?access_token={{ $json.access_token }}
```

**Headers:**
- Remove Authorization header
- Keep Content-Type: `application/json`

**If this works:** The issue is definitely the Authorization header format.

## Most Likely Fix

**The issue is probably:**
1. Token expression not evaluating → Use Code Node to prepare token
2. Extra whitespace → Use `.trim()`
3. Wrong header format → Ensure no quotes, no `=` prefix

**Try this exact format in n8n:**
```
Authorization: Bearer {{ $json.clean_access_token }}
```

Where `clean_access_token` comes from the Code Node that trims the token.

## Quick Test

**Test the token directly in n8n:**

**HTTP Request Node:**
- **Method:** GET
- **URL:** `https://graph.facebook.com/v18.0/me?access_token={{ $json.facebook_access_token }}`
- **No Authorization header needed**

**If this works:** The token is fine, the issue is the Authorization header format.

**If this fails:** The token path is wrong or token is invalid.

