# Instagram Container Created - Next Steps

## ✅ Step 1 Complete: Container Created

You received:
```json
{
  "id": "17850902622667194"
}
```

This is your **container ID**. Now you need to:
1. Wait for container to process (optional but recommended)
2. Publish the container
3. Extract post ID and URL
4. Report status back

## Step 2: Wait for Container Processing (Optional)

Instagram needs time to process the video. You can check the status:

**HTTP Request Node:**
- **Name:** Check Container Status
- **Method:** GET
- **URL:** `https://graph.instagram.com/v18.0/{{ $json.id }}?fields=status_code&access_token={{ $json.access_token }}`

**Response:**
```json
{
  "status_code": "FINISHED",
  "id": "17850902622667194"
}
```

**Status Codes:**
- `IN_PROGRESS` - Still processing (wait and check again)
- `ERROR` - Processing failed
- `FINISHED` - Ready to publish ✅
- `EXPIRED` - Container expired (not published within 24 hours)

**Optional Wait Node:**
- Add a **Wait** node for 5-10 seconds before checking status
- Or loop until status is `FINISHED` or `ERROR`

## Step 3: Publish Container

**HTTP Request Node:**
- **Name:** Publish Container
- **Method:** POST
- **URL:** `https://graph.instagram.com/v18.0/{{ $json.instagram_id }}/media_publish`
- **Headers:**
  - **Authorization:** `Bearer {{ $json.access_token }}`
  - **Content-Type:** `application/json`
- **Body (JSON):**
```json
{
  "creation_id": "{{ $('Create Media Container').item.json.id }}"
}
```

**Response:**
```json
{
  "id": "17850902622667195"
}
```

This `id` is your **Instagram post ID**!

## Step 4: Extract Post ID and Build URL

**Code Node:**
```javascript
const publishResponse = $input.item.json;
const postId = publishResponse.id;
const instagramId = $('Get Video Details').item.json.platform_tokens.instagram_id;

// Instagram post URL format
const postUrl = `https://www.instagram.com/p/${postId}/`;

console.log('✅ Instagram post published!');
console.log('Post ID:', postId);
console.log('Post URL:', postUrl);

return {
  json: {
    video_id: $('Webhook').item.json.body.video_id,
    platform: 'instagram',
    status: 'posted',
    platform_post_id: postId,
    platform_url: postUrl,
    error_message: null,
  }
};
```

## Step 5: Report Status Back

**HTTP Request Node:**
- **Name:** Report Status
- **Method:** POST
- **URL:** `{{ $('Webhook').item.json.body.callback_url }}`
- **Headers:**
  - **x-n8n-api-key:** `{{ $env.N8N_API_KEY }}`
  - **Content-Type:** `application/json`
- **Body (JSON):**
```json
{
  "video_id": "{{ $('Extract Post ID').item.json.video_id }}",
  "platform": "instagram",
  "status": "posted",
  "platform_post_id": "{{ $('Extract Post ID').item.json.platform_post_id }}",
  "platform_url": "{{ $('Extract Post ID').item.json.platform_url }}",
  "error_message": null
}
```

## Complete Workflow Structure

```
Webhook
  ↓
Respond to Webhook
  ↓
Get Video Details
  ↓
Create Media Container (✅ DONE - got container ID)
  ↓
[Optional] Wait 5 seconds
  ↓
[Optional] Check Container Status
  ↓
Publish Container (POST to /media_publish)
  ↓
Extract Post ID & Build URL
  ↓
Report Status Back
```

## Quick Implementation

### Node 1: Publish Container

**HTTP Request Node:**
- **Method:** POST
- **URL:** `https://graph.instagram.com/v18.0/27085892291011294/media_publish`
- **Headers:**
  - **Authorization:** `Bearer {{ $json.facebook_access_token }}`
  - **Content-Type:** `application/json`
- **Body (JSON):**
```json
{
  "creation_id": "17850902622667194"
}
```

### Node 2: Extract Post ID

**Code Node:**
```javascript
const response = $input.item.json;
const postId = response.id;
const postUrl = `https://www.instagram.com/p/${postId}/`;

return {
  json: {
    video_id: $('Webhook').item.json.body.video_id,
    platform: 'instagram',
    status: 'posted',
    platform_post_id: postId,
    platform_url: postUrl,
  }
};
```

### Node 3: Report Status

**HTTP Request Node:**
- **Method:** POST
- **URL:** `{{ $('Webhook').item.json.body.callback_url }}`
- **Headers:**
  - **x-n8n-api-key:** `{{ $env.N8N_API_KEY }}`
- **Body:** `={{ $json }}`

## Your Container ID

**Container ID:** `17850902622667194`

Use this in the `creation_id` field when publishing.

## Next Steps

1. **Add "Publish Container" node** using the container ID
2. **Add "Extract Post ID" node** to get the post ID from publish response
3. **Add "Report Status" node** to update your database

Your Instagram posting workflow is almost complete! 🎉

