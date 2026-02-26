# Cloudflare R2 Direct-to-Storage Upload Architecture

Migrating AirPublisher from the broken n8n webhook + Dropbox pipeline to an industry-standard **Presigned URL → Direct Browser Upload → Cloudflare R2** architecture.

---

## Prerequisites (User Action Required)

You need a Cloudflare R2 bucket and API credentials before execution:
- `R2_ACCOUNT_ID` — Your Cloudflare account ID
- `R2_ACCESS_KEY_ID` — R2 API token Access Key
- `R2_SECRET_ACCESS_KEY` — R2 API token Secret Key
- `R2_BUCKET_NAME` — e.g. `creatorjoy-videos`
- `R2_PUBLIC_URL` — The public domain for the bucket (e.g. `https://pub-xxx.r2.dev`)

R2 Bucket CORS config (set in Cloudflare Dashboard → R2 → Bucket → Settings → CORS):
```json
[
  {
    "AllowedOrigins": ["http://localhost:8000", "https://your-production-domain.com"],
    "AllowedMethods": ["GET", "PUT", "HEAD"],
    "AllowedHeaders": ["Content-Type", "Content-Length"],
    "MaxAgeSeconds": 3600
  }
]
```

**WARNING:** Dropbox removal is included. Existing videos with Dropbox URLs in `video_url` will still work (instant-posting fetches whatever URL is stored). New uploads will use R2 URLs.

---

## Architecture Flow

```
1. Browser → createVideo() in Supabase DB (status: 'uploading')
2. Browser → generate-upload-url Edge Function → gets presigned PUT URL
3. Browser → PUT file directly to Cloudflare R2 (with progress bar)
4. Browser → updateVideo() with video_url = R2 public URL, status = 'draft'
5. Later: User clicks Publish → instant-posting reads video_url from DB → streams to YouTube/IG/TikTok
```

No file data ever passes through Edge Functions or n8n. The browser talks directly to R2.

---

## Step 1: New Edge Function — `generate-upload-url`

**File:** `supabase/functions/generate-upload-url/index.ts` [NEW]

- Accepts JSON: `{ filename, content_type, creator_id, video_id }`
- Uses `@aws-sdk/client-s3` + `@aws-sdk/s3-request-presigner` (via `npm:` specifiers for Deno)
- Generates a presigned PUT URL pointing to R2
- Object key format: `videos/{creator_id}/{video_id}/{filename}`
- URL expires in 60 minutes
- Returns: `{ upload_url, object_key, public_url }`

For files under ~5GB (which covers all creator videos), a single presigned PUT is sufficient. S3 Multipart Upload is only needed for files >5GB and adds significant complexity — we skip it for now.

---

## Step 2: Rewrite `upload-form.tsx`

**File:** `components/upload/upload-form.tsx` [MODIFY — full rewrite of handleSubmit]

**Old flow (removed):**
```
createVideo() → POST file to n8n webhook → hope it works
```

**New flow:**
```
1. createVideo() in Supabase (status: 'uploading')
2. Call generate-upload-url Edge Function → get presigned URL + public URL
3. XMLHttpRequest PUT file directly to R2 (tracks upload.onprogress for real %)
4. updateVideo() with video_url = public R2 URL, status = 'draft'
```

New UI features:
- Real percentage progress bar (not a spinner)
- Upload speed (MB/s)
- Cancel upload button (via AbortController / xhr.abort())

Removes all references to:
- `VITE_N8N_WEBHOOK_URL`
- `callback_url`
- n8n FormData logic

---

## Step 3: Replace `dropbox-url.ts` → `video-url.ts`

**File:** `lib/utils/dropbox-url.ts` → rename to `lib/utils/video-url.ts` [MODIFY/RENAME]

New generic utility:
```typescript
export function getVideoPlaybackUrl(videoUrl: string): string {
  if (!videoUrl) return ''
  // Legacy Dropbox URLs: convert to direct download
  if (videoUrl.includes('dropbox.com')) {
    return videoUrl.replace('?dl=0', '?dl=1')
  }
  // R2 URLs are already direct-access
  return videoUrl
}
```

**4 files need import path updates:**
- `src/pages/VideoDetailsPage.tsx`
- `src/pages/VideosPage.tsx`
- `src/components/discover/video-feed.tsx`
- `components/discover/video-feed.tsx`

---

## Step 4: Clean up `instant-posting`

**File:** `supabase/functions/instant-posting/index.ts` [MODIFY — minimal]

The function already reads `videoData.video_url` from DB and passes it to platform APIs. R2 URLs are standard HTTPS, so the flow already works.

Only cleanup needed:
- Remove `.replace('&dl=0', '&dl=1')` Dropbox transforms (lines 133, 194, 304)
- R2 URLs don't need transformation

---

## Step 5: Env & Config Cleanup

- Remove `N8N_API_KEY` from `.env.local` (line 26, currently empty anyway)
- No `VITE_N8N_WEBHOOK_URL` exists (was never set — that was the original error)
- Set R2 secrets on Supabase Edge Functions:
  ```bash
  supabase secrets set R2_ACCOUNT_ID=<value>
  supabase secrets set R2_ACCESS_KEY_ID=<value>
  supabase secrets set R2_SECRET_ACCESS_KEY=<value>
  supabase secrets set R2_BUCKET_NAME=creatorjoy-videos
  supabase secrets set R2_PUBLIC_URL=https://pub-xxx.r2.dev
  ```

---

## Execution Order

| Step | What | Files | Blocked On |
|------|------|-------|------------|
| 1 | Create `generate-upload-url` Edge Function | `supabase/functions/generate-upload-url/index.ts` | R2 credentials from user |
| 2 | Rewrite `upload-form.tsx` | `components/upload/upload-form.tsx` | Step 1 |
| 3 | Replace `dropbox-url.ts` → `video-url.ts` | `lib/utils/video-url.ts` + 4 import updates | None (can be parallel) |
| 4 | Clean up `instant-posting` Dropbox transforms | `supabase/functions/instant-posting/index.ts` | None (can be parallel) |
| 5 | Set env vars + R2 CORS config | `.env.local`, Supabase secrets, R2 dashboard | R2 credentials |

---

## Verification Plan

1. **Edge Function test:** `curl` the `generate-upload-url` function → confirm it returns a valid presigned URL
2. **Upload test:** `curl -X PUT` a small file to the presigned URL → confirm 200 OK and file accessible at public URL
3. **Browser test:** Open `/upload`, select a video, verify progress bar, confirm video appears on `/videos` page with R2 URL
4. **Publishing test:** Click Publish on a video with R2 URL → confirm `instant-posting` can fetch and push to platform
5. **Legacy test:** Confirm old videos with Dropbox URLs still play in the video feed
