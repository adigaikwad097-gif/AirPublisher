-- Migration: Add RLS policies for creator_profiles table
-- This allows users to create their own profiles

-- Enable RLS if not already enabled
ALTER TABLE creator_profiles ENABLE ROW LEVEL SECURITY;

-- Policy: Users can insert their own profile
-- This assumes creator_profiles has a user_id column
-- If it doesn't, you may need to add it first or modify this policy
CREATE POLICY "Users can insert own profile"
  ON creator_profiles FOR INSERT
  WITH CHECK (auth.uid()::text = user_id::text);

-- Policy: Users can view their own profile
CREATE POLICY "Users can view own profile"
  ON creator_profiles FOR SELECT
  USING (auth.uid()::text = user_id::text);

-- Policy: Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON creator_profiles FOR UPDATE
  USING (auth.uid()::text = user_id::text);

-- Policy: Everyone can view all profiles (for leaderboards)
-- Comment this out if you want profiles to be private
CREATE POLICY "Anyone can view profiles"
  ON creator_profiles FOR SELECT
  USING (true);

-- If creator_profiles doesn't have user_id column, add it:
-- ALTER TABLE creator_profiles ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

