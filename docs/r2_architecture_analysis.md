# R2 Upload & Publishing — Architecture Analysis

## 1. R2 Folder Structure (Finalized)

```
creatorjoy-videos/                          ← R2 Bucket
└── {creator_unique_identifier}/            ← Per-creator folder
    ├── uploads/                            ← AirPublisher (video posts)
    │   ├── 1740483920-a3f8b2c1.mp4
    │   └── ...
    └── media/                              ← AirCreator (personal assets)
        ├── profile_pic.jpg
        ├── voice_clone.wav
        └── ...
```

**URL Format (matches your n8n expression):**
```
https://pub-554fecf5e8e94c3fb4623925782d59dc.r2.dev/{creator_unique_identifier}/uploads/{timestamp}-{randomId}.mp4
https://pub-554fecf5e8e94c3fb4623925782d59dc.r2.dev/{creator_unique_identifier}/media/profile_pic.jpg
```

> [!NOTE]
> AirPublisher only touches `uploads/`. AirCreator only touches `media/`. Same bucket, same creator folder, different subfolders.

---

## 2. What The N8N Automations Were Doing (Reference)

### N8N Automation 1: "DropBox Upload"

```
Webhook (POST /uploaddropbox)
    ↓
Respond to Webhook (immediate 200)
    ↓
Upload a file to Dropbox
    Path: /airpublisher/creator_{creator_unique_identifier}/{video_id}.mp4
    ↓
Create Shared Link (POST to Dropbox API)
    Makes the file publicly accessible
    ↓
HTTP Request (callback)
    POSTs back to AirPublisher with:
    - video_id
    - video_url (Dropbox shared link with ?dl=1)
    - dropbox_path
    - creator_unique_identifier
    - processing_status: "completed"
```

**Key insight:** The n8n flow was:
1. Browser → n8n webhook (file upload via FormData)
2. n8n → Dropbox (upload binary)
3. n8n → Dropbox API (create shared link)
4. n8n → callback URL (notify AirPublisher with video_url)

**Problem:** The file goes through n8n's memory (OOM for large files), and the 3-step chain is slow and fragile.

**Our R2 replacement** is simpler:
1. Browser → Edge Function (get presigned URL only, no video data)
2. Browser → R2 directly (upload binary via PUT, with progress bar)
3. Browser → Supabase DB (save R2 URL)

No intermediary servers touching the video binary. No callbacks needed.

---

### N8N Automation 2: "Instant Posting"

```
Webhook receives { video_id, creator_unique_identifier, platform, trigger_type }
    ↓
Switch on platform → Instagram / YouTube / TikTok
    ↓
┌─ INSTAGRAM ──────────────────────────────────────────────┐
│  Get video row from air_publisher_videos (by video_id)    │
│  Get Instagram tokens (by creator_unique_identifier)      │
│  Check token expiry (expiresTimestamp > nowTimestamp)      │
│  Create media container (POST /media with video_url)      │
│    └─ video_url uses .replace('&dl=0', '&dl=1')           │
│  Poll status (GET /status_code until FINISHED)            │
│    └─ If not FINISHED → Wait node → retry                │
│  Publish media (POST /media_publish)                      │
│  Get permalink                                            │
│  Update air_publisher_videos.instagram_url = permalink    │
└──────────────────────────────────────────────────────────┘

┌─ YOUTUBE ────────────────────────────────────────────────┐
│  Get video row from air_publisher_videos (by video_id)    │
│  Get YouTube tokens (by creator_unique_identifier)        │
│  Check token expiry                                       │
│  Init resumable session (POST /upload?uploadType=resume)  │
│  Extract upload_url from response headers.location        │
│  Download video binary from video_url (dl=0→dl=1)         │
│  PUT binary to upload_url                                 │
│  Set youtube_url = https://youtube.com/watch?v={id}       │
│  Update air_publisher_videos.youtube_url                  │
└──────────────────────────────────────────────────────────┘

┌─ TIKTOK ─────────────────────────────────────────────────┐
│  Get video row from air_publisher_videos (by video_id)    │
│  Get TikTok tokens (by creator_unique_identifier)         │
│  Check token expiry                                       │
│  Download video to get binary + size                      │
│  Compute chunk_size and total_chunk_count                 │
│  Init video upload (POST /video/init)                     │
│  Re-download video binary (for the PUT)                   │
│  PUT binary with Content-Range header                     │
│  Fetch publish status                                     │
│  Check if PUBLISH_COMPLETE                                │
└──────────────────────────────────────────────────────────┘
```

**Key insights from n8n Instant Posting:**
- All three platforms use `video_url` from `air_publisher_videos` table
- All three apply `.replace('&dl=0', '&dl=1')` for Dropbox compatibility
- Token expiry checking is done before each platform call
- Instagram uses a Wait + retry loop for media processing
- TikTok downloads the video **twice** (once for size, once for upload)

---

## 3. Edge Function vs N8N — Comparison

| Factor | Edge Function (our approach) | n8n Automation (old approach) |
|--------|------------------------------|-------------------------------|
| **Upload** | Presigned URL → browser direct to R2 | Browser → n8n → Dropbox (OOM risk) |
| **Memory** | Zero server-side memory for uploads | Full file passes through n8n memory |
| **Progress** | XHR progress bar in browser | No progress feedback |
| **Speed** | Direct PUT to R2 | 3-hop: webhook → Dropbox → callback |
| **Publishing** | Edge function streams from R2 | n8n downloads from Dropbox |
| **Token mgmt** | Supabase Vault (encrypted) | Supabase via n8n nodes |
| **Dropbox transforms** | Not needed (R2 URLs are direct) | `.replace('&dl=0', '&dl=1')` everywhere |
| **Cost** | Supabase free tier + R2 free tier | n8n cloud hosting |
| **Debugging** | Supabase logs | n8n execution history |
| **Code control** | Git-versioned TypeScript | JSON workflow exports |

### Verdict: Edge Functions for Both Steps

The existing `instant-posting` edge function already replicates the entire n8n Instant Posting workflow:
- ✅ YouTube: resumable upload with streaming
- ✅ Instagram: media container + polling + publish + permalink
- ✅ TikTok: size detection + chunked upload + status polling
- ✅ DB updates with platform URLs
- ✅ No more Dropbox URL transforms needed (R2 URLs are direct)

**There is no need for n8n anymore.** Both automations are fully replaced.

---

## 4. Complete Flow Diagram (New Architecture)

```
┌──────────────────────────────────────────────────────────┐
│  STEP 1: UPLOAD (Browser → R2)                            │
│                                                           │
│  Creator picks video + enters title/description            │
│       ↓                                                    │
│  upload-form.tsx calls generate-upload-url edge function    │
│    Body: { title, description, contentType,                │
│            creatorUniqueIdentifier }                        │
│       ↓                                                    │
│  Edge function returns:                                    │
│    { uploadUrl (presigned PUT), videoUrl (public R2 URL) } │
│       ↓                                                    │
│  Browser XHR PUTs file directly to R2 (progress bar %)     │
│  Path: {creator_id}/uploads/{timestamp}-{random}.mp4       │
│       ↓                                                    │
│  Frontend creates DB record:                               │
│    air_publisher_videos.video_url = R2 public URL           │
│       ↓                                                    │
│  Video appears in Videos page, playable immediately         │
└──────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────┐
│  STEP 2: PUBLISH (R2 → Platform)                          │
│                                                           │
│  Creator selects video + picks platform                    │
│       ↓                                                    │
│  Frontend calls instant-posting edge function              │
│    Body: { video_id, creator_unique_identifier, platform }  │
│       ↓                                                    │
│  Edge function reads video_url from DB (R2 public URL)     │
│       ↓                                                    │
│  Edge function downloads video from R2                     │
│  (streams body, no full-file buffering)                    │
│       ↓                                                    │
│  Uploads to platform API                                   │
│  (YouTube resumable / IG container / TikTok chunked)       │
│       ↓                                                    │
│  Updates DB: youtube_url / instagram_url / status           │
└──────────────────────────────────────────────────────────┘
```

---

## 5. Changes Required

### Change 1: Fix `generate-upload-url` path structure
**File:** `supabase/functions/generate-upload-url/index.ts`
- Accept `creatorUniqueIdentifier` in request body
- Change path from `${user.id}/${timestamp}-${randomString}.${ext}`
  → `${creatorUniqueIdentifier}/uploads/${timestamp}-${randomString}.${ext}`
- Remove the DB insert (frontend already handles it in Step 3)

### Change 2: Pass `creatorUniqueIdentifier` to edge function
**File:** `components/upload/upload-form.tsx`
- Add `creatorUniqueIdentifier` to the `supabase.functions.invoke()` body

### Change 3: Set R2 secrets on Supabase (production)
Once testing locally works, deploy secrets with:
```bash
supabase secrets set R2_ACCOUNT_ID=a337afc5f64dde41f60b9cfe83f13b43
supabase secrets set R2_ACCESS_KEY_ID=0d148f556f44d5269ac285be1ef105d5
supabase secrets set R2_SECRET_ACCESS_KEY=aabebe40c81893f2c92b57c41a3f70cd9aea07c6403da2d5be2c8421a17c542f
supabase secrets set R2_BUCKET_NAME=creatorjoy-videos
supabase secrets set R2_PUBLIC_URL=https://pub-554fecf5e8e94c3fb4623925782d59dc.r2.dev
```

---

## 6. Summary

| Component | Old (n8n) | New (Edge Functions) | Status |
|-----------|-----------|---------------------|--------|
| Video upload | Browser → n8n → Dropbox → callback | Browser → R2 (presigned URL) | **Needs 2 minor fixes** |
| Video publishing | n8n webhook → platform APIs | `instant-posting` edge function | ✅ **Already working** |
| Token management | n8n Supabase nodes + expiry checks | Supabase Vault + expiry checks | ✅ **Already working** |
| URL handling | Dropbox shared links + `dl=0→dl=1` | R2 public URLs (direct) | ✅ **Already migrated** |
| Progress feedback | None | XHR progress bar | ✅ **Already implemented** |
