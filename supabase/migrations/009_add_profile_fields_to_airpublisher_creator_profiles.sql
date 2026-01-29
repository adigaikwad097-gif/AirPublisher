-- Migration: Add profile fields to airpublisher_creator_profiles
-- This makes airpublisher_creator_profiles the main profile table instead of just a linking table

-- Step 1: Drop the foreign key constraint to creator_profiles (we'll make it optional)
ALTER TABLE airpublisher_creator_profiles 
DROP CONSTRAINT IF EXISTS airpublisher_creator_profiles_creator_unique_identifier_fkey;

-- Step 2: Add profile fields to airpublisher_creator_profiles
ALTER TABLE airpublisher_creator_profiles
ADD COLUMN IF NOT EXISTS handles TEXT NOT NULL DEFAULT '',
ADD COLUMN IF NOT EXISTS Niche TEXT,
ADD COLUMN IF NOT EXISTS profile_pic_url TEXT;

-- Step 3: Make creator_unique_identifier nullable (since we'll generate it ourselves)
ALTER TABLE airpublisher_creator_profiles
ALTER COLUMN creator_unique_identifier DROP NOT NULL;

-- Step 4: Remove the unique constraint on creator_unique_identifier (since it can be null now)
ALTER TABLE airpublisher_creator_profiles
DROP CONSTRAINT IF EXISTS airpublisher_creator_profiles_creator_unique_identifier_key;

-- Step 5: Add a function to auto-generate creator_unique_identifier if not provided
CREATE OR REPLACE FUNCTION generate_creator_unique_identifier()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.creator_unique_identifier IS NULL THEN
    NEW.creator_unique_identifier := 'creator_' || SUBSTRING(NEW.user_id::text, 1, 8) || '_' || 
                                    TO_CHAR(EXTRACT(EPOCH FROM NOW())::bigint, 'FM999999999999') || '_' ||
                                    SUBSTRING(MD5(RANDOM()::text), 1, 8);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 6: Create trigger to auto-generate creator_unique_identifier
DROP TRIGGER IF EXISTS trigger_generate_creator_unique_identifier ON airpublisher_creator_profiles;
CREATE TRIGGER trigger_generate_creator_unique_identifier
  BEFORE INSERT ON airpublisher_creator_profiles
  FOR EACH ROW
  EXECUTE FUNCTION generate_creator_unique_identifier();

-- Step 7: Update RLS policies to allow users to insert their own profile
-- The existing policies should already work, but let's make sure they're correct
DROP POLICY IF EXISTS "Users can insert own linking record" ON airpublisher_creator_profiles;
CREATE POLICY "Users can insert own profile"
  ON airpublisher_creator_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Step 8: Add comment
COMMENT ON TABLE airpublisher_creator_profiles IS 'Main creator profile table for AIR Publisher. Links users to their creator profiles with all profile data.';



