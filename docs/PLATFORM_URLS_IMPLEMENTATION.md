# Platform URLs Implementation Summary

## Overview

Added support for storing platform-specific video URLs (YouTube, Instagram, TikTok) in the `air_publisher_videos` table. These URLs will be used for metrics collection and leaderboard calculations.

## Database Changes

### Migration: `002_add_platform_urls.sql`

Added three new columns to `air_publisher_videos`:
- `youtube_url` (TEXT) - URL of video published on YouTube
- `instagram_url` (TEXT) - URL of video published on Instagram  
- `tiktok_url` (TEXT) - URL of video published on TikTok

All columns are nullable and indexed for efficient queries.

## API Endpoint

### `POST /api/webhooks/n8n/post-status`

Updated to accept platform URLs and update the database accordingly.

**Request Body:**
```json
{
  "video_id": "uuid",
  "status": "posted",
  "platform": "youtube" | "instagram" | "tiktok",
  "youtube_url": "https://...",      // Optional
  "instagram_url": "https://...",    // Optional
  "tiktok_url": "https://...",       // Optional
  "platform_post_url": "https://...", // Alternative: auto-detects platform
  "published_at": "ISO timestamp"
}
```

**Response:**
```json
{
  "success": true,
  "video": { ... },
  "message": "Video uuid updated successfully"
}
```

## n8n Workflow Integration

### For TikTok

Add Supabase node after "Publish Video" to update directly:
- See: `N8N_UPDATE_TIKTOK_URL_SUPABASE.md`

### For YouTube

Add Supabase node after "YouTube Upload" to update directly:
- See: `N8N_UPDATE_YOUTUBE_URL_SUPABASE.md`

### For Instagram

Add Supabase node after "Instagram Upload" to update directly:
- See: `N8N_UPDATE_INSTAGRAM_URL_SUPABASE.md`

**Note:** These guides use n8n's Supabase node to update the database directly, without going through the Vercel API endpoint.

## Usage for Metrics Collection

Once URLs are stored, you can:

1. **Query videos with platform URLs:**
   ```sql
   SELECT * FROM air_publisher_videos 
   WHERE youtube_url IS NOT NULL 
   OR instagram_url IS NOT NULL 
   OR tiktok_url IS NOT NULL;
   ```

2. **Fetch metrics from platform APIs:**
   - Use the stored URLs to identify videos on each platform
   - Call platform APIs to get views, likes, comments
   - Aggregate metrics for leaderboard calculation

3. **Leaderboard calculation:**
   - Query all videos with platform URLs
   - Fetch metrics for each platform
   - Aggregate by creator
   - Calculate scores and update leaderboard

## TypeScript Types

If using Supabase generated types, run:
```bash
npx supabase gen types typescript --project-id your-project-id > lib/supabase/types.ts
```

The generated types will include:
```typescript
export interface AirPublisherVideos {
  id: string
  creator_unique_identifier: string
  // ... other fields
  youtube_url: string | null
  instagram_url: string | null
  tiktok_url: string | null
  // ... other fields
}
```

## Next Steps

1. **Run the migration:**
   - Execute `supabase/migrations/002_add_platform_urls.sql` in Supabase SQL Editor

2. **Update n8n workflows:**
   - Add "Update URL" nodes to each platform automation
   - Test the webhook endpoint

3. **Metrics collection:**
   - Create n8n workflow to fetch metrics using stored URLs
   - Update leaderboard calculation to use platform URLs

4. **Testing:**
   - Test posting to each platform
   - Verify URLs are saved correctly
   - Test metrics collection workflow

## Example: Metrics Collection Query

```typescript
// Get all videos with platform URLs
const { data: videos } = await supabase
  .from('air_publisher_videos')
  .select('id, youtube_url, instagram_url, tiktok_url, creator_unique_identifier')
  .or('youtube_url.not.is.null,instagram_url.not.is.null,tiktok_url.not.is.null')

// For each video, fetch metrics from platform APIs
for (const video of videos) {
  if (video.youtube_url) {
    // Fetch YouTube metrics
    const metrics = await fetchYouTubeMetrics(video.youtube_url)
    // Update leaderboard
  }
  if (video.instagram_url) {
    // Fetch Instagram metrics
    const metrics = await fetchInstagramMetrics(video.instagram_url)
    // Update leaderboard
  }
  if (video.tiktok_url) {
    // Fetch TikTok metrics
    const metrics = await fetchTikTokMetrics(video.tiktok_url)
    // Update leaderboard
  }
}
```

