-- Migration: Fix RLS policies for airpublisher_creator_profiles
-- Ensure users can view their own profile even if session detection is delayed

-- Drop existing SELECT policy
DROP POLICY IF EXISTS "Users can view own linking record" ON airpublisher_creator_profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON airpublisher_creator_profiles;

-- Create a more permissive SELECT policy that allows users to view their own profile
-- This uses auth.uid() = user_id which should work when session is properly detected
CREATE POLICY "Users can view own profile"
  ON airpublisher_creator_profiles FOR SELECT
  USING (auth.uid() = user_id);

-- Also allow viewing all profiles for public access (leaderboards, discover page, etc.)
-- This ensures the discover page and other public features work
CREATE POLICY "Anyone can view profiles"
  ON airpublisher_creator_profiles FOR SELECT
  USING (true);

-- Ensure INSERT policy allows users to create their own profile
DROP POLICY IF EXISTS "Users can insert own linking record" ON airpublisher_creator_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON airpublisher_creator_profiles;

CREATE POLICY "Users can insert own profile"
  ON airpublisher_creator_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Ensure UPDATE policy allows users to update their own profile
DROP POLICY IF EXISTS "Users can update own linking record" ON airpublisher_creator_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON airpublisher_creator_profiles;

CREATE POLICY "Users can update own profile"
  ON airpublisher_creator_profiles FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Ensure DELETE policy (if needed)
DROP POLICY IF EXISTS "Users can delete own linking record" ON airpublisher_creator_profiles;

CREATE POLICY "Users can delete own profile"
  ON airpublisher_creator_profiles FOR DELETE
  USING (auth.uid() = user_id);


