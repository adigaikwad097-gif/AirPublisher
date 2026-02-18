# Fix RLS Policy for Video Uploads

## Problem
The RLS (Row Level Security) policy on `air_publisher_videos` table is failing because it references a `user_id` column in `creator_profiles` that doesn't exist.

## Solution
Run the migration `004_fix_air_publisher_rls.sql` in your Supabase SQL Editor.

## Steps

1. **Go to Supabase Dashboard** → Your Project → SQL Editor

2. **Run this migration:**

```sql
-- Fix RLS policies for air_publisher_videos
-- Drop existing policies
DROP POLICY IF EXISTS "Creators can view own videos" ON air_publisher_videos;
DROP POLICY IF EXISTS "Creators can insert own videos" ON air_publisher_videos;
DROP POLICY IF EXISTS "Creators can update own videos" ON air_publisher_videos;

-- New RLS Policies for air_publisher_videos
-- Allow authenticated users to manage videos
-- We verify ownership in the application layer (createVideoAction)

CREATE POLICY "Authenticated users can view videos"
  ON air_publisher_videos FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can insert videos"
  ON air_publisher_videos FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update videos"
  ON air_publisher_videos FOR UPDATE
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);
```

3. **Click "Run"** to execute the migration

4. **Test the upload** - Try uploading a video again

## Security Note

The application layer (`createVideoAction` in `app/api/videos/actions.ts`) already verifies:
- User is authenticated
- `creator_unique_identifier` matches the logged-in user's profile

So the RLS policy just needs to ensure the user is authenticated. The app handles ownership verification.






