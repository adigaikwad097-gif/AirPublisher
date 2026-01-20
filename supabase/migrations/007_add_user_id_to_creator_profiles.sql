-- Migration: Add user_id column to creator_profiles table
-- This creates a proper foreign key relationship between users and creator profiles

-- Step 1: Add user_id column (nullable initially to handle existing profiles)
ALTER TABLE creator_profiles 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Step 2: Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_creator_profiles_user_id ON creator_profiles(user_id);

-- Step 3: Create unique constraint (one profile per user)
-- Note: This will fail if there are duplicate user_ids, so we'll handle that
DO $$
BEGIN
  -- Check if constraint already exists
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'creator_profiles_user_id_key'
  ) THEN
    -- Add unique constraint
    ALTER TABLE creator_profiles 
    ADD CONSTRAINT creator_profiles_user_id_key UNIQUE (user_id);
  END IF;
END $$;

-- Step 4: Update RLS policies to use user_id
-- Drop old policies if they exist
DROP POLICY IF EXISTS "Users can insert own profile" ON creator_profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON creator_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON creator_profiles;

-- Create new policies using user_id
CREATE POLICY "Users can insert own profile"
  ON creator_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own profile"
  ON creator_profiles FOR SELECT
  USING (auth.uid() = user_id OR true); -- Allow viewing own profile, or all profiles (for leaderboards)

CREATE POLICY "Users can update own profile"
  ON creator_profiles FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Step 5: Add comment
COMMENT ON COLUMN creator_profiles.user_id IS 'Foreign key to auth.users. Links creator profile to authenticated user.';


