# Fix Instagram Token: Use Facebook Access Token

## The Issue

Instagram Graph API uses **Facebook's OAuth system**, so you need a **Facebook access token** (long-lived), not just an Instagram access token.

The error "Cannot parse access token" often means:
1. Using the wrong token type (Instagram token instead of Facebook token)
2. Missing "Bearer " prefix
3. Token needs to be exchanged for a long-lived token

## Solution: Use Facebook Access Token

### Step 1: Check Your Token Type

Your token data shows:
- `facebook_access_token`: Same value as `instagram_access_token`
- Both tokens are identical in your case

**For Instagram Graph API, you should use `facebook_access_token`** (or ensure it's a long-lived Facebook token).

### Step 2: Update n8n Authorization Header

**In your "Instagram Create Media" HTTP Request node:**

**Authorization Header:**
```
Bearer {{ $json.facebook_access_token }}
```

**OR if using "Get Video Details" node:**
```
Bearer {{ $('Get Video Details').item.json.platform_tokens.access_token }}
```

The `/api/n8n/video-details` endpoint should return `facebook_access_token` in the `platform_tokens.access_token` field.

### Step 3: Verify Token is Long-Lived

Instagram requires a **long-lived access token** (60 days). Check your token:

1. **Test the token:**
   ```bash
   curl "https://graph.facebook.com/v18.0/me?access_token=YOUR_TOKEN_HERE"
   ```

2. **Check token expiration:**
   - Your token expires: `2026-03-19T09:03:01.653+00:00` (March 19, 2026)
   - This is a long-lived token ✅

3. **Verify token type:**
   ```bash
   curl "https://graph.facebook.com/v18.0/debug_token?input_token=YOUR_TOKEN_HERE&access_token=YOUR_TOKEN_HERE"
   ```

### Step 4: Ensure Token Has Required Permissions

Your token needs these permissions:
- `instagram_business_basic`
- `instagram_business_content_publish`
- `pages_show_list` (if using Facebook Page)

## Common Fixes

### Fix 1: Use Facebook Access Token in n8n

**If your data comes from "Get a row1" node:**
```
Authorization: Bearer {{ $json.facebook_access_token }}
```

**If your data comes from "Get Video Details" node:**
```
Authorization: Bearer {{ $('Get Video Details').item.json.platform_tokens.access_token }}
```

The `/api/n8n/video-details` endpoint prioritizes `facebook_access_token` over `instagram_access_token` when formatting tokens.

### Fix 2: Verify Token Format

The token should:
- Start with a long string (not "IG" prefix - that's for Instagram Basic Display API)
- Be a Facebook Graph API token
- Have "Bearer " prefix in Authorization header

**Correct Authorization header:**
```
Authorization: Bearer IGAAL49pr6sxxBZAGJ0ZAmtERjNxdjE5VVdRbU5nSVQyajRiOWwzMDkyRjFyYmcwWUVFUURLS0twdzVoMEs2eU9iZAnZARcnVYSm85c1lCd0RPbmxDbFJ4M3hmenp0TmZAVTHQ0Nk9aSVIyVW9UUkVEREowR293
```

**NOT:**
```
Authorization: IGAAL49pr6sxxBZAGJ0ZAmtERjNxdjE5VVdRbU5nSVQyajRiOWwzMDkyRjFyYmcwWUVFUURLS0twdzVoMEs2eU9iZAnZARcnVYSm85c1lCd0RPbmxDbFJ4M3hmenp0TmZAVTHQ0Nk9aSVIyVW9UUkVEREowR293
```
(Missing "Bearer " prefix)

### Fix 3: Exchange for Long-Lived Token (If Needed)

If your token is short-lived, exchange it for a long-lived token:

**HTTP Request in n8n:**
- **Method:** GET
- **URL:** `https://graph.facebook.com/v18.0/oauth/access_token?grant_type=fb_exchange_token&client_id={{ $env.META_APP_ID }}&client_secret={{ $env.META_APP_SECRET }}&fb_exchange_token={{ $json.facebook_access_token }}`

**Response:**
```json
{
  "access_token": "NEW_LONG_LIVED_TOKEN",
  "token_type": "bearer",
  "expires_in": 5184000
}
```

## Updated n8n Configuration

### Complete "Instagram Create Media" Node

**URL:**
```
https://graph.facebook.com/v18.0/{{ $json.instagram_id }}/media
```

**Headers:**
- **Authorization:** `Bearer {{ $json.facebook_access_token }}`
- **Content-Type:** `application/json`

**Body (JSON):**
```json
{
  "media_type": "REELS",
  "video_url": "{{ $json.video_url.replace('&dl=0', '&dl=1') }}",
  "caption": "{{ $json.description }}",
  "thumb_offset": 0
}
```

## Testing the Token

### Test 1: Verify Token Works

**HTTP Request Node:**
- **Method:** GET
- **URL:** `https://graph.facebook.com/v18.0/me?access_token={{ $json.facebook_access_token }}`

**Expected Response:**
```json
{
  "id": "your_facebook_user_id",
  "name": "Your Name"
}
```

### Test 2: Verify Instagram Business Account

**HTTP Request Node:**
- **Method:** GET
- **URL:** `https://graph.facebook.com/v18.0/{{ $json.instagram_id }}?fields=id,username&access_token={{ $json.facebook_access_token }}`

**Expected Response:**
```json
{
  "id": "27085892291011296",
  "username": "your_username"
}
```

## If Still Failing

1. **Check token expiration:**
   - Your token expires: March 19, 2026 ✅ (valid)
   - If expired, user needs to reconnect Instagram

2. **Verify token permissions:**
   - Go to Meta Dashboard → Your App → Permissions
   - Ensure `instagram_business_basic` and `instagram_business_content_publish` are granted

3. **Check Instagram Business Account:**
   - Ensure Instagram account is linked to a Facebook Page
   - Account type must be "Business" or "Creator"

4. **Try using the token directly:**
   - Copy the `facebook_access_token` value
   - Test in Postman/curl:
   ```bash
   curl -X POST "https://graph.facebook.com/v18.0/27085892291011296/media" \
     -H "Authorization: Bearer YOUR_FACEBOOK_ACCESS_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{
       "media_type": "REELS",
       "video_url": "https://www.dropbox.com/.../video.mp4?dl=1",
       "caption": "Test caption"
     }'
   ```

## Summary

**Use `facebook_access_token` instead of `instagram_access_token` for Instagram Graph API calls.**

Your tokens are the same value, but Instagram Graph API expects a Facebook access token format. The `/api/n8n/video-details` endpoint should handle this automatically, but if you're accessing tokens directly, use `facebook_access_token`.

