# How to Check if Video Was Saved in Supabase

## Quick Check Methods

### Method 1: Check in Your App (Easiest)

1. **Go to**: `http://localhost:3000/videos`
   - This page shows all your videos
   - You should see your uploaded video listed there

2. **Or go to Dashboard**: `http://localhost:3000/dashboard`
   - Scroll down to "Recent Videos" section
   - Your video should appear there

### Method 2: Check Supabase Dashboard

1. **Go to**: [Supabase Dashboard](https://supabase.com/dashboard)
2. **Select your project**: `pezvnqhexxttlhcnbtta`
3. **Click**: "Table Editor" in left sidebar
4. **Find**: `air_publisher_videos` table
5. **Click on it** to view all rows
6. **You should see your video** with:
   - `id` (UUID)
   - `creator_unique_identifier` (your creator ID)
   - `title` (the title you entered)
   - `description` (the description you entered, or null)
   - `status` = `'draft'`
   - `platform_target` = the platform you selected (youtube/instagram/tiktok/internal)
   - `source_type` = `'ugc'`
   - `created_at` = timestamp
   - `video_url` = `null` (file not uploaded yet - this is normal)
   - `thumbnail_url` = `null` (not generated yet - this is normal)

### Method 3: Run SQL Query

1. **Go to**: Supabase Dashboard → SQL Editor
2. **Run this query**:

```sql
SELECT 
  id,
  creator_unique_identifier,
  title,
  description,
  status,
  platform_target,
  source_type,
  video_url,
  thumbnail_url,
  created_at
FROM air_publisher_videos
ORDER BY created_at DESC
LIMIT 10;
```

This shows the 10 most recent videos.

---

## What's Normal

✅ **Video metadata saved** - Title, description, platform, status
❌ **Video file NOT uploaded** - This is expected! The file upload is marked as TODO in the code
❌ **Thumbnail NOT generated** - This will be done by n8n later

The upload form currently:
1. ✅ Saves video metadata to database
2. ❌ Does NOT upload the video file (TODO in code)
3. ❌ Does NOT generate thumbnail (TODO in code)

The actual file upload and processing will be handled by n8n workflows later.

---

## If Video is Missing

If you don't see the video in Supabase:

1. **Check browser console** for errors
2. **Check terminal logs** for server errors
3. **Verify RLS policies** - Make sure you ran the migration `004_fix_air_publisher_rls.sql`
4. **Check creator profile** - Make sure you have a creator profile set up

Let me know what you find!
