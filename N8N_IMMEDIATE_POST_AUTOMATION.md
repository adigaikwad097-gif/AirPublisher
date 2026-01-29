# n8n Immediate Post Automation (Post Now)

This workflow lets you trigger AirPublisher's “post now” flow manually via a webhook. Once the webhook runs it calls `/api/n8n/post-now`, passes the video data and tokens to n8n, posts to the chosen platform, and then reports status back to `/api/webhooks/n8n/post-status`.

## 1. Trigger
- **Node:** Webhook
- **Method:** POST
- **URL:** `https://support-team.app.n8n.cloud/webhook/15ec8f2d-a77c-4407-8ab8-cd505284bb42`
- **Headers:** none (unless you want to add basic auth)
- **Payload:** the JSON that your app would normally send to `/api/n8n/post-now` (see section 4)

## 2. Fetch Video Details
- **Node:** HTTP Request
- **Method:** GET
- **URL:** `https://airpublisher.vercel.app/api/n8n/video-details?video_id={{$json.video_id}}`
- **Headers:**
  - `x-n8n-api-key: {{$env.N8N_API_KEY}}`
- **Purpose:** Refresh tokens, fetch creator, video metadata, Dropbox URL, and platform tokens.

## 3. Route by Platform
- **Node:** SplitInBatches or Router/IF
- **Condition:** `{{$json.platform}}`
- Branch into three paths: `youtube`, `instagram`, `tiktok`. Each path is responsible for calling the platform API.

## 4. Platform Posting Nodes
Use the data returned from `/api/n8n/video-details` (`video`, `tokens`, `creator`, etc.).

### YouTube
- Build request to `https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status`.
- Use `tokens.google_access_token`.
- Send video metadata (`title`, `description`, `categoryId`, `privacyStatus`).
- Upload the actual file using the Dropbox/`video_url`.

### Instagram
- Call `https://graph.facebook.com/v18.0/{{creator.instagram_business_account}}/media`.
- Use `tokens.instagram_access_token`.
- Create media container with `video_url`, `caption`, `thumbnail_url`.
- Publish container.

### TikTok
- Use TikTok’s `POST https://open.tiktokapis.com/v2/post/publish/video` endpoint.
- Use `tokens.access_token`. Include PKCE data if required.

## 5. Report Status
- **Node:** HTTP Request
- **Method:** POST
- **URL:** `https://airpublisher.vercel.app/api/webhooks/n8n/post-status`
- **Headers:**
  - `x-n8n-api-key: {{$env.N8N_API_KEY}}`
- **Body:** include `video_id`, `status`, `platform`, `platform_post_id`, `platform_url`, `error_message`
- This keeps the Supabase record updated (`status`, `posted_at`, `platform_post_id`, `platform_url`).

## 6. Example Payload
```json
{
  "video_id": "48a3528d-c20f-4b72-98fb-82dfbacdb7cd",
  "platform": "instagram",
  "title": "Test 001",
  "description": "this is to test saving functionality",
  "video_url": "https://www.dropbox.com/scl/fi/2drkj...cd.mp4?rlkey=...&dl=1",
  "thumbnail_url": null,
  "creator_unique_identifier": "creator_735175e5_1768726539_f7262d3a",
  "callback_url": "https://airpublisher.vercel.app/api/webhooks/n8n/post-status"
}
```

## 7. Environment Variables
- `N8N_API_KEY` – same key you add to all authenticated AirPublisher endpoints
- `NEXT_PUBLIC_APP_URL` – ensures redirect/callback URLs match production

## 8. Testing Instructions
1. Trigger the webhook above (e.g., via `curl` or Postman with the payload above).
2. Check n8n execution history: you should see the HTTP request to `/api/n8n/video-details` and a platform branch.
3. Confirm `/api/webhooks/n8n/post-status` received a POST with status/result.
4. Look at Supabase `air_publisher_videos` to ensure `status` moved to `posted`.

## 9. Troubleshooting
- **Token missing:** Verify creator has connection tokens; `/api/n8n/video-details` will log errors.
- **Platform errors:** Inspect the platform node’s response (e.g., Instagram Graph API error “Invalid Redirect URI”).
- **Webhook auth:** If you protect the webhook, include the same header/value in the HTTP Request nodes.

## 10. Next steps
- Once this workflow is stable, copy the same pattern to the scheduled workflow and metrics workflow described in `N8N_POSTING_AUTOMATIONS.md`.


