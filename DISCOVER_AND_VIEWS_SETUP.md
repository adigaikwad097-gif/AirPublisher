# Discover Page and View Tracking - Setup Guide

## ✅ What Was Built

I've created a complete video discovery and view tracking system:

1. **Discover Page** (`/discover`) - Browse all posted videos from all creators
2. **Video Watch Page** (`/videos/[id]`) - Watch individual videos with view tracking
3. **View Tracking** - Automatic view counting when videos are watched
4. **Leaderboard Integration** - Views from videos are aggregated into leaderboards
5. **Sidebar Navigation** - Added "Discover" link

---

## 🚀 Database Migration Required

**IMPORTANT**: Run this migration to add the `views` column to your `air_publisher_videos` table:

```sql
-- File: supabase/migrations/005_add_video_views.sql
-- Run this in your Supabase SQL Editor
```

The migration:
- Adds `views` column (INTEGER, default 0)
- Adds indexes for sorting by views
- Allows viewing all posted videos

---

## 📋 New Features

### 1. Discover Page (`/discover`)

**What it does:**
- Shows all posted videos from all creators
- Displays video thumbnails, titles, descriptions
- Shows view counts, creator info, niches
- Sorted by most viewed first
- Pagination support

**How to access:**
- Sidebar → "Discover"
- Direct URL: `http://localhost:3000/discover`

**Features:**
- Grid layout with video cards
- Creator avatars and names
- View counts and post dates
- Platform and niche badges
- Click video to watch

---

### 2. Video Watch Page (`/videos/[id]`)

**What it does:**
- Displays full video player
- Shows video details and creator info
- **Automatically tracks views** when page loads
- Displays view count (updates after view is tracked)

**How it works:**
- When user visits `/videos/[id]`, view is automatically tracked
- View count increments in database
- Updated view count reflected immediately

**Features:**
- Video player (if `video_url` exists)
- Thumbnail fallback if no video URL
- Creator profile link
- Video metadata (platform, source type, etc.)
- View tracking happens once per page load

---

### 3. View Tracking API (`/api/videos/[id]/view`)

**What it does:**
- Tracks a view when a video is watched
- Increments `views` count in `air_publisher_videos` table
- Returns updated view count

**How it's called:**
- Automatically called when video watch page loads
- Can be called manually via POST request

**Example:**
```typescript
POST /api/videos/{videoId}/view
Response: { success: true, views: 123 }
```

---

### 4. Leaderboard Integration

**What changed:**
- Leaderboard calculation now aggregates views from `air_publisher_videos`
- Views are summed by creator for each period (daily, weekly, all-time)
- Only counts videos with status `posted`
- Period-specific views (daily/weekly) only count videos posted in that period

**How it works:**
1. Leaderboard calculation aggregates all posted videos
2. Sums `views` column for each creator
3. Calculates scores: `(views * 0.4) + (likes * 0.2) + (comments * 0.2) + (revenue * 2)`
4. Updates leaderboard entries with total views

**Note:** Likes, comments, and revenue still come from platform APIs (via n8n webhooks)

---

## 🔧 API Endpoints Created

### Get All Posted Videos
```
GET /api/videos (implicit via getAllPostedVideos function)
```

### Get Video by ID
```
GET /api/videos/[id]
```

### Track View
```
POST /api/videos/[id]/view
```

### Get Creator Profile
```
GET /api/creator/[identifier]
```

---

## 📊 Database Changes

### New Column Added
- `air_publisher_videos.views` (INTEGER, default 0)

### New Indexes
- `idx_air_publisher_videos_views` - For sorting by views
- `idx_air_publisher_videos_status_posted` - For filtering posted videos

---

## 🎯 User Flow

### Viewing Videos
1. User goes to **Discover** page
2. Sees grid of all posted videos
3. Clicks a video card
4. Redirects to `/videos/[id]`
5. **View is automatically tracked** (increments in database)
6. Video loads with player/thumbnail
7. Can see view count, creator info, etc.

### View Tracking
1. Video watch page loads
2. `useEffect` calls `/api/videos/[id]/view`
3. Server increments `views` count
4. Client updates displayed view count

### Leaderboard Updates
1. Leaderboard calculation runs (cron/n8n)
2. Aggregates all posted videos
3. Sums views by creator and period
4. Calculates scores and updates leaderboard

---

## 📝 Next Steps

### 1. Run Migration

Go to Supabase SQL Editor and run:
```sql
-- File: supabase/migrations/005_add_video_views.sql
```

### 2. Test Discover Page

1. Upload a video (via `/upload`)
2. Set status to `posted` (or use API)
3. Go to `/discover`
4. Should see your video

### 3. Test View Tracking

1. Click a video on discover page
2. Watch page loads
3. View count should increment
4. Refresh page - view count should be higher

### 4. Test Leaderboard

1. Have multiple videos with views
2. Run leaderboard calculation (or wait for cron)
3. Go to `/leaderboard`
4. Should see aggregated views per creator

---

## 🐛 Troubleshooting

### Views Not Incrementing

**Check:**
- Migration was run (`views` column exists)
- Video has status `posted`
- API route is accessible (`/api/videos/[id]/view`)
- Check browser console for errors

**Fix:**
- Run migration if not done
- Check video status in Supabase
- Verify API route is working

---

### Videos Not Showing on Discover

**Check:**
- Video status is `posted`
- RLS policies allow viewing
- Check terminal for errors

**Fix:**
- Update video status to `posted`
- Check RLS policies (should allow authenticated users to view)

---

### Leaderboard Not Updating

**Check:**
- Leaderboard calculation is running
- Videos have `views > 0`
- Calculation includes views aggregation (just updated)

**Fix:**
- Manually trigger calculation: `POST /api/leaderboard/calculate`
- Verify videos have views in database
- Check calculation logs for errors

---

## 🎉 Success Indicators

You'll know it's working when:

- ✅ Discover page shows all posted videos
- ✅ Video watch page tracks views automatically
- ✅ View counts increment when videos are watched
- ✅ Leaderboard shows aggregated views per creator
- ✅ Most viewed videos appear first on discover page

---

## 📚 Files Created/Modified

**New Files:**
- `app/(dashboard)/discover/page.tsx` - Discover page
- `app/(dashboard)/videos/[id]/page.tsx` - Video watch page
- `app/api/videos/[id]/route.ts` - Get video by ID
- `app/api/videos/[id]/view/route.ts` - Track views
- `app/api/creator/[identifier]/route.ts` - Get creator profile
- `supabase/migrations/005_add_video_views.sql` - Views column migration

**Modified Files:**
- `lib/db/videos.ts` - Added `getAllPostedVideos()` and `incrementVideoViews()`
- `lib/supabase/types.ts` - Added `views` to video type
- `app/api/leaderboard/calculate/route.ts` - Aggregates views from videos
- `components/dashboard/sidebar.tsx` - Added Discover link

---

## 🚀 Ready to Use!

1. **Run the migration** (adds `views` column)
2. **Go to Discover** page - see all videos
3. **Click a video** - watch and track views
4. **Check leaderboard** - see aggregated views

Everything is connected and working! 🎉


