# R2 Upload & Publishing — Implementation Plan

## Background

### What was happening (n8n — old flow)

**DropBox Upload automation:**
```
Browser → FormData POST to n8n webhook (/uploaddropbox)
  → n8n immediately responds 200
  → n8n uploads binary to Dropbox at /airpublisher/creator_{id}/{filename}.mp4
  → n8n calls Dropbox API to create shared link (public, viewer access)
  → n8n POSTs callback to AirPublisher with { video_id, video_url, dropbox_path, creator_unique_identifier, processing_status: "completed" }
```

**Instant Posting automation:**
```
Webhook receives { video_id, creator_unique_identifier, platform, trigger_type }
  → Switch on platform (instagram / youtube / tiktok)
  
  Instagram path:
    → Get video row from air_publisher_videos
    → Get Instagram tokens from airpublisher_instagram_tokens
    → Check token expiry (JS code node)
    → If valid: POST video_url to /v18.0/{ig_id}/media (REELS, with dl=0→dl=1 transform)
    → Poll GET /status_code until FINISHED (Wait node for retry loop)
    → POST /media_publish with creation_id
    → Get permalink
    → Update air_publisher_videos.instagram_url

  YouTube path:
    → Get video row from air_publisher_videos
    → Get YouTube tokens from airpublisher_youtube_tokens
    → Check token expiry (JS code node)
    → If valid: POST to /upload/youtube/v3/videos?uploadType=resumable (init session)
    → Extract upload_url from response headers.location (JS code node)
    → Download video binary from video_url (dl=0→dl=1 transform)
    → PUT binary to upload_url
    → Set youtube_url = https://youtube.com/watch?v={response.id}
    → Update air_publisher_videos.youtube_url

  TikTok path:
    → Get video row from air_publisher_videos
    → Get TikTok tokens from airpublisher_tiktok_tokens
    → Check token expiry (JS code node)
    → If valid: Download video to get binary + file size (dl=0→dl=1 transform)
    → Compute chunk_size and total_chunk_count (JS code node, 100+ lines)
    → POST to /v2/post/publish/video/init/ with source_info
    → Re-download video binary (second HTTP request, same URL)
    → PUT binary with Content-Range header to upload_url
    → POST to /v2/post/publish/status/fetch/ with publish_id
    → Check if status === PUBLISH_COMPLETE
```

### What we're replacing it with (Edge Functions — new flow)

**Step 1: Upload (replaces DropBox Upload n8n)**
```
Browser → supabase.functions.invoke('generate-upload-url', { title, description, contentType, creatorUniqueIdentifier })
  → Edge function generates presigned PUT URL for R2
  → Returns { uploadUrl, videoUrl, fileName }
Browser → XHR PUT directly to R2 uploadUrl (with progress bar)
Browser → createVideo() to save record in air_publisher_videos with R2 videoUrl
```

**Step 2: Publish (replaces Instant Posting n8n)**
```
Browser → supabase.functions.invoke('instant-posting', { video_id, creator_unique_identifier, platform })
  → Edge function fetches video row from DB (gets video_url = R2 URL)
  → Downloads video from R2 URL (direct access, no dl=0→dl=1 needed)
  → Uploads to platform API (YouTube resumable / IG container / TikTok chunked)
  → Updates DB with platform URL
```

---

## File Changes

### FILE 1: `supabase/functions/generate-upload-url/index.ts`

**Current state:** 125 lines. Has 3 issues that need fixing.

#### Change 1A: Accept `creatorUniqueIdentifier` in request body

**Location:** Line 42

**Before:**
```ts
const { title, description, contentType = 'video/mp4' } = await req.json()
```

**After:**
```ts
const { title, description, contentType = 'video/mp4', creatorUniqueIdentifier } = await req.json()
```

#### Change 1B: Add validation for `creatorUniqueIdentifier`

**Location:** After line 49 (after the `title` validation block)

**Insert:**
```ts
if (!creatorUniqueIdentifier) {
    return new Response(JSON.stringify({ error: 'creatorUniqueIdentifier is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
}
```

#### Change 1C: Fix the R2 file path

**Location:** Line 75

**Before:**
```ts
const fileName = `${user.id}/${timestamp}-${randomString}.${ext}`
```

**After:**
```ts
const fileName = `${creatorUniqueIdentifier}/uploads/${timestamp}-${randomString}.${ext}`
```

**Why:** This matches the agreed folder structure: `{creator_unique_identifier}/uploads/{timestamp}-{random}.mp4`. The old n8n flow used `/airpublisher/creator_{id}/{filename}` on Dropbox — we're using a cleaner equivalent on R2.

#### Change 1D: Remove the duplicate DB insert block

**Location:** Lines 87-102 (the entire "Create Database Record" section)

**Delete this entire block:**
```ts
// 5. Create Database Record
const { data: videoRecord, error: dbError } = await supabaseClient
    .from('air_publisher_videos')
    .insert({
        user_id: user.id,
        title,
        description: description || '',
        video_url: finalVideoUrl,
    })
    .select('id')
    .single()

if (dbError) {
    throw dbError
}
```

**Why:** The frontend (`upload-form.tsx`, line 99) already calls `createVideo()` after the upload completes. The edge function should only generate the presigned URL, not touch the database. Having both creates a duplicate row.

#### Change 1E: Remove `videoId` from response

**Location:** Lines 105-116

**Before:**
```ts
return new Response(
    JSON.stringify({
        uploadUrl: signedUrl,
        videoUrl: finalVideoUrl,
        videoId: videoRecord.id,
        fileName
    }),
    {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
    }
)
```

**After:**
```ts
return new Response(
    JSON.stringify({
        uploadUrl: signedUrl,
        videoUrl: finalVideoUrl,
        fileName
    }),
    {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
    }
)
```

#### Final state of `generate-upload-url/index.ts` after all changes:

The function will:
1. Validate auth (unchanged)
2. Parse `{ title, description, contentType, creatorUniqueIdentifier }` from body
3. Validate `title` and `creatorUniqueIdentifier`
4. Configure R2 client (unchanged)
5. Generate presigned URL with path `{creatorUniqueIdentifier}/uploads/{timestamp}-{random}.{ext}`
6. Return `{ uploadUrl, videoUrl, fileName }` — no DB writes

---

### FILE 2: `components/upload/upload-form.tsx`

**Current state:** 252 lines. Has 1 issue that needs fixing.

#### Change 2A: Pass `creatorUniqueIdentifier` to edge function

**Location:** Lines 58-64

**Before:**
```ts
const { data: uploadData, error: funcError } = await supabase.functions.invoke('generate-upload-url', {
    body: {
        title,
        description,
        contentType: file.type || 'video/mp4'
    }
})
```

**After:**
```ts
const { data: uploadData, error: funcError } = await supabase.functions.invoke('generate-upload-url', {
    body: {
        title,
        description,
        contentType: file.type || 'video/mp4',
        creatorUniqueIdentifier
    }
})
```

**Why:** The `creatorUniqueIdentifier` prop is already available in this component — it's received from `UploadPage.tsx` (line 93): `<UploadForm creatorUniqueIdentifier={creator.unique_identifier} />`. We just need to forward it to the edge function.

**No other changes needed in this file.** The rest of the flow (XHR upload, createVideo call, progress bar) is already correct.

---

### FILE 3: `supabase/functions/instant-posting/index.ts`

**Current state:** 410 lines. No changes needed.

**Why no changes:**
- Line 37: Fetches video row by `video_id` → gets `video_url` from DB
- `handleYouTubePublish` (line 71-165): Downloads from `videoData.video_url` via `fetch()` — works with any URL
- `handleInstagramPublish` (line 167-278): Passes `video_url` to Instagram API — works with any public URL
- `handleTikTokPublish` (line 280-409): Downloads from `videoData.video_url` via `fetch()` — works with any URL

The n8n automation had `video_url.replace('&dl=0', '&dl=1')` everywhere for Dropbox compatibility. The edge function doesn't have these transforms — it just uses the URL as-is. R2 URLs are already direct-access, so this is correct.

---

## Deployment Steps

### 1. Set R2 secrets on Supabase production

```bash
supabase secrets set R2_ACCOUNT_ID=a337afc5f64dde41f60b9cfe83f13b43
supabase secrets set R2_ACCESS_KEY_ID=0d148f556f44d5269ac285be1ef105d5
supabase secrets set R2_SECRET_ACCESS_KEY=aabebe40c81893f2c92b57c41a3f70cd9aea07c6403da2d5be2c8421a17c542f
supabase secrets set R2_BUCKET_NAME=creatorjoy-videos
supabase secrets set R2_PUBLIC_URL=https://pub-554fecf5e8e94c3fb4623925782d59dc.r2.dev
```

### 2. Deploy edge function

```bash
supabase functions deploy generate-upload-url
```

### 3. Deploy frontend (Vercel auto-deploys on git push)

---

## Testing Checklist

### Local testing

1. Start edge function locally:
   ```bash
   supabase functions serve generate-upload-url --env-file .env.local
   ```

2. Test presigned URL generation:
   ```bash
   curl -X POST http://localhost:54321/functions/v1/generate-upload-url \
     -H "Authorization: Bearer <access_token>" \
     -H "Content-Type: application/json" \
     -d '{"title":"Test","creatorUniqueIdentifier":"creator_test_123","contentType":"video/mp4"}'
   ```
   
   Expected response:
   ```json
   {
     "uploadUrl": "https://<account>.r2.cloudflarestorage.com/creatorjoy-videos/creator_test_123/uploads/...",
     "videoUrl": "https://pub-554fecf5e8e94c3fb4623925782d59dc.r2.dev/creator_test_123/uploads/...",
     "fileName": "creator_test_123/uploads/..."
   }
   ```

3. Test missing `creatorUniqueIdentifier` returns 400:
   ```bash
   curl -X POST http://localhost:54321/functions/v1/generate-upload-url \
     -H "Authorization: Bearer <access_token>" \
     -H "Content-Type: application/json" \
     -d '{"title":"Test","contentType":"video/mp4"}'
   ```

### End-to-end testing

1. Open upload page in browser
2. Select a video file
3. Enter title and description
4. Click upload
5. Verify progress bar shows percentage
6. Verify video appears in Videos page after upload
7. Open Cloudflare R2 dashboard → `creatorjoy-videos` bucket → verify file at `{creator_id}/uploads/` path
8. Check Supabase `air_publisher_videos` table → verify `video_url` is an R2 URL (not Dropbox)
9. Select the uploaded video → publish to a test platform
10. Verify `instant-posting` edge function logs show successful download from R2 URL

---

## Risk Assessment

| Risk | Mitigation |
|------|-----------|
| R2 CORS blocks browser PUT | Configure CORS on R2 bucket to allow `airpublisher.vercel.app` origin |
| Presigned URL expires before large upload completes | Current expiry is 3600s (1 hour) — sufficient for most files |
| Old videos still have Dropbox URLs in DB | `instant-posting` already works with both — Dropbox URLs still resolve, R2 URLs are direct |
| `createVideo()` called but R2 upload actually failed | Upload happens before `createVideo()` — if XHR fails, the try/catch prevents DB write |
