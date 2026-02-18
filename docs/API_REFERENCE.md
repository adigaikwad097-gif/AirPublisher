# API Reference

## n8n Integration Endpoints

**IMPORTANT:** All n8n endpoints require authentication via `x-n8n-api-key` header or `Authorization: Bearer` token.

### Query Endpoints (n8n calls these)

#### `GET /api/n8n/scheduled-posts`
Get videos that need to be posted.

**Query Params:**
- `limit` (optional): Number of posts (default: 50)
- `before` (optional): ISO timestamp (default: now)

**Response:**
```json
{
  "success": true,
  "count": 5,
  "posts": [...]
}
```

#### `GET /api/n8n/video-details?video_id={id}`
Get video details and platform tokens.

**Response:**
```json
{
  "success": true,
  "video": {...},
  "platform_tokens": {...},
  "has_tokens": true
}
```

#### `POST /api/n8n/leaderboard-calculate`
Trigger leaderboard rank recalculation.

---

### Webhook Endpoints (n8n sends data here)

#### `POST /api/webhooks/n8n/post-video`
Trigger video posting (alternative flow).

#### `POST /api/webhooks/n8n/post-status`
Report post status after attempting to post.

#### `POST /api/webhooks/n8n/metrics`
Send performance metrics for a video.

#### `POST /api/webhooks/n8n/upload-complete`
Report video processing completion.

See [N8N_INTEGRATION.md](./N8N_INTEGRATION.md) for complete n8n API documentation.

---

## Server Actions

### Video Actions (`app/api/videos/actions.ts`)

#### `createVideoAction(video: VideoInsert)`
Creates a new video entry.

**Parameters:**
- `video`: Video data including:
  - `creator_unique_identifier`: Auto-set from current user
  - `source_type`: 'ai_generated' | 'ugc'
  - `title`: Video title
  - `description`: Optional description
  - `platform_target`: 'youtube' | 'instagram' | 'tiktok' | 'internal'
  - `status`: 'draft' | 'scheduled' | 'posted' | 'failed'

**Returns:** Created video object

**Throws:** Error if unauthorized

---

#### `updateVideoAction(id: string, updates: VideoUpdate)`
Updates an existing video.

**Parameters:**
- `id`: Video UUID
- `updates`: Partial video data to update

**Returns:** Updated video object

**Throws:** Error if unauthorized or video not found

---

#### `scheduleVideoAction(id: string, scheduledAt: string, platformTarget: string)`
Schedules a video for posting.

**Parameters:**
- `id`: Video UUID
- `scheduledAt`: ISO timestamp string
- `platformTarget`: Target platform

**Returns:** Updated video object

---

#### `postVideoAction(id: string)`
Posts a video immediately (placeholder - needs platform API integration).

**Parameters:**
- `id`: Video UUID

**Returns:** Updated video object with `status: 'posted'` and `posted_at` set

---

## API Routes

### `POST /api/leaderboard/calculate`

Calculates and updates leaderboard scores. Intended for cron job execution.

**Authentication:**
- Requires `Authorization: Bearer {CRON_SECRET}` header

**Response:**
```json
{
  "success": true
}
```

**Note:** Currently uses placeholder metrics. In production, this should:
1. Fetch actual metrics from platform APIs
2. Aggregate by creator
3. Calculate scores using the formula
4. Update leaderboard entries for all periods (daily, weekly, all_time)

---

## Database Functions

### `lib/db/videos.ts`

#### `getVideosByCreator(creatorUniqueIdentifier: string)`
Fetches all videos for a creator.

#### `getVideoById(id: string)`
Fetches a single video by ID.

#### `createVideo(video: VideoInsert)`
Creates a video (server-side only).

#### `updateVideo(id: string, updates: VideoUpdate)`
Updates a video (server-side only).

#### `getScheduledVideos(creatorUniqueIdentifier?: string)`
Fetches all scheduled videos, optionally filtered by creator.

---

### `lib/db/leaderboard.ts`

#### `getLeaderboard(period: 'daily' | 'weekly' | 'all_time', limit?: number)`
Fetches leaderboard entries for a period.

**Returns:** Array of leaderboard entries with creator profiles

#### `getCreatorRank(creatorUniqueIdentifier: string, period: string)`
Gets a creator's rank for a specific period.

**Returns:** Leaderboard entry or null

#### `getLeaderboardByNiche(niche: string, period: string, limit?: number)`
Fetches leaderboard entries filtered by niche.

**Returns:** Array of leaderboard entries with creator profiles

#### `calculateScore(views: number, likes: number, comments: number, estimatedRevenue: number)`
Calculates leaderboard score using the formula:
```
score = (views * 0.4) + (likes * 0.2) + (comments * 0.2) + (estimated_revenue * 2)
```

---

### `lib/db/creator.ts`

#### `getCreatorProfile(uniqueIdentifier: string)`
Fetches a creator profile by unique identifier.

#### `getCreatorByUserId(userId: string)`
Fetches a creator profile by Supabase Auth user ID.

#### `getCurrentCreator()`
Fetches the current authenticated creator's profile.

---

## Storage Functions

### `lib/storage.ts`

#### `uploadVideo(file: File, path: string)`
Uploads a video file to Supabase Storage.

**Parameters:**
- `file`: File object
- `path`: Storage path (e.g., `creator-id/video-id.mp4`)

**Returns:** `{ path: string, url: string }`

#### `deleteVideo(path: string)`
Deletes a video from Supabase Storage.

#### `getVideoUrl(path: string)`
Generates a public URL for a video.

---

## Type Definitions

See `lib/supabase/types.ts` for full TypeScript type definitions.

Key types:
- `Database['public']['Tables']['air_publisher_videos']['Row']`
- `Database['public']['Tables']['air_leaderboards']['Row']`
- `Database['public']['Tables']['creator_profiles']['Row']`

