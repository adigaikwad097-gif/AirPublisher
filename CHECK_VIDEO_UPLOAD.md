# How to Check if Video Was Uploaded to Supabase

## What Happens When You Upload

When you click "Upload Video" in the form:
1. ✅ **Video metadata is saved** to `air_publisher_videos` table
2. ❌ **Video file is NOT uploaded yet** (marked as TODO in code)
3. Status is set to `'draft'`

## Check Supabase

### Method 1: Supabase Dashboard (Easiest)

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project: `pezvnqhexxttlhcnbtta`
3. Click **"Table Editor"** in left sidebar
4. Find **`air_publisher_videos`** table
5. Click on it to view all rows
6. You should see your video entry with:
   - `id` (UUID)
   - `creator_unique_identifier` (your creator ID)
   - `title` (what you entered)
   - `description` (what you entered)
   - `status` = `'draft'`
   - `platform_target` = the platform you selected
   - `source_type` = `'ugc'`
   - `created_at` = timestamp
   - `video_url` = `null` (file not uploaded yet)
   - `thumbnail_url` = `null` (not generated yet)

### Method 2: Check in Your App

1. Go to: `http://localhost:3000/videos`
2. You should see your video listed there
3. Or go to Dashboard → "Recent Videos" section

### Method 3: SQL Query in Supabase

Go to Supabase Dashboard → SQL Editor and run:

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

## What to Look For

Your video entry should have:
- ✅ `title` = The title you entered
- ✅ `description` = The description you entered (or null)
- ✅ `status` = `'draft'`
- ✅ `platform_target` = `'youtube'`, `'instagram'`, `'tiktok'`, or `'internal'`
- ✅ `source_type` = `'ugc'`
- ✅ `creator_unique_identifier` = Your creator profile ID
- ❌ `video_url` = `null` (file upload not implemented yet)
- ❌ `thumbnail_url` = `null` (thumbnail generation not implemented yet)

## Next Steps

The video metadata is saved, but:
1. **Video file upload** - Not implemented yet (TODO in code)
2. **Thumbnail generation** - Not implemented yet
3. **Posting to platforms** - Will be handled by n8n when video is ready

The upload form currently just creates a database entry. The actual file upload and posting will be handled by n8n workflows later.


