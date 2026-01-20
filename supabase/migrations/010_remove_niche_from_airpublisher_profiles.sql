-- Migration: Remove Niche column from airpublisher_creator_profiles
-- Niche should be stored in the shared creator_profiles table, not in airpublisher_creator_profiles
-- This aligns with the shared schema where niche comes from niches_list table

-- Step 1: Remove the Niche column from airpublisher_creator_profiles
ALTER TABLE airpublisher_creator_profiles
DROP COLUMN IF EXISTS "Niche";

-- Step 2: Add comment explaining niche is stored in creator_profiles
COMMENT ON TABLE airpublisher_creator_profiles IS 'Main creator profile table for AIR Publisher. Links users to their creator profiles. Niche data should come from creator_profiles table which references niches_list.';


