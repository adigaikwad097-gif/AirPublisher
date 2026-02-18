# Fix: TikTok Scope Not Authorized Error

## Problem

Error: `"scope_not_authorized"` - The user did not authorize the scope required for completing this request.

This means your TikTok access token doesn't have the `video.list` scope needed to query videos.

## Solution 1: Add Required Scope (Recommended)

### Step 1: Update TikTok App Scopes

1. Go to [TikTok Developer Portal](https://developer.tiktok.com/)
2. Navigate to your app
3. Go to **"Basic Information"** or **"Permissions"** section
4. Add the following scopes:
   - ✅ `video.list` - **Required** for querying videos
   - ✅ `user.info.basic` - Optional, for user info

### Step 2: Re-authenticate

After updating scopes, you need to re-authenticate:

1. **In your app:** Have the user re-authorize TikTok
2. **In n8n:** If using OAuth, trigger a new authorization flow
3. **Update tokens:** Save the new access token with updated scopes

### Step 3: Check Current Scopes

You can check what scopes your token has by looking at the token data. In your "Get a row5" node output, check the `scope` field:

```json
{
  "scope": "user.info.basic,video.upload,video.publish"
}
```

If `video.list` is missing, you need to re-authenticate.

## Solution 2: Alternative - Construct URL from Publish ID (Workaround)

If you can't add the scope right now, you can construct the TikTok URL using the `publish_id`:

### Option A: Use Publish ID to Get Video Info

The `publish_id` from the Initialize Upload response might be usable, but TikTok doesn't provide a direct endpoint to convert `publish_id` to video URL without `video.list` scope.

### Option B: Store Publish ID and Construct URL Later

1. **Store the publish_id** from Initialize Upload:
   ```
   {{ $('HTTP Request5').item.json.data.publish_id }}
   ```

2. **Update your database** with the publish_id:
   ```json
   {
     "video_id": "{{ $('Code in JavaScript5').item.json.video_id }}",
     "platform_post_id": "{{ $('HTTP Request5').item.json.data.publish_id }}",
     "status": "posted"
   }
   ```

3. **Later, when you have video.list scope**, query the video list and match by publish_id or get the most recent video.

### Option C: Manual URL Construction (Limited)

If you know the username, you can construct:
```
https://www.tiktok.com/@username/video/{video_id}
```

But you need the actual TikTok video ID (not publish_id), which requires the video.list API.

## Solution 3: Use Publish Status Endpoint (Check if it returns URL)

Try checking if the publish status endpoint returns more info:

**HTTP Request: "Get Publish Status"**

**Method:** POST  
**URL:** `https://open.tiktokapis.com/v2/post/publish/status/fetch/`

**Headers:**
- `Authorization: Bearer {{ $('Get a row5').item.json.tiktok_access_token }}`
- `Content-Type: application/json`

**Body:**
```json
{
  "publish_id": "{{ $('HTTP Request5').item.json.data.publish_id }}"
}
```

Check if the response includes a `video_id` or `share_url` field. If it does, you can use that!

## Recommended Approach

**Best solution:** Add `video.list` scope and re-authenticate. This is the proper way to get video URLs.

**Quick workaround:** Store the `publish_id` in your database and retrieve the URL later when you have the proper scopes, or manually check the TikTok account for the video URL.

## Check Your Current Scopes

Add a Code node to check what scopes you have:

```javascript
const tokenData = $('Get a row5').item.json;

return {
  json: {
    scopes: tokenData.scope || 'unknown',
    has_video_list: (tokenData.scope || '').includes('video.list'),
    all_scopes: (tokenData.scope || '').split(',')
  }
};
```

This will show you what scopes are currently authorized.

## Next Steps

1. **Immediate:** Store `publish_id` in your database for now
2. **Proper fix:** Add `video.list` scope in TikTok Developer Portal
3. **Re-authenticate:** Get new tokens with updated scopes
4. **Retry:** Use Video List API to get the URL


