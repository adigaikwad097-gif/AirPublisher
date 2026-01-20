-- Fix Dropbox table to support App Key/Secret authentication (no OAuth needed)
-- Drop old policies first
DROP POLICY IF EXISTS "Users can view own dropbox tokens" ON airpublisher_dropbox_tokens;
DROP POLICY IF EXISTS "Users can insert own dropbox tokens" ON airpublisher_dropbox_tokens;
DROP POLICY IF EXISTS "Users can update own dropbox tokens" ON airpublisher_dropbox_tokens;

-- Alter table to support app key/secret (not OAuth tokens)
ALTER TABLE airpublisher_dropbox_tokens 
  DROP COLUMN IF EXISTS creator_unique_identifier,
  DROP COLUMN IF EXISTS access_token,
  DROP COLUMN IF EXISTS refresh_token,
  DROP COLUMN IF EXISTS expires_at;

-- Add app_key and app_secret columns (stored encrypted, but we'll use env vars instead)
-- Actually, we don't need to store them - we'll use env vars directly
-- Just keep the table structure for future use if needed

-- Drop the table entirely since we're using env vars
DROP TABLE IF EXISTS airpublisher_dropbox_tokens;

-- Create a simple table just to track if Dropbox is configured (optional)
CREATE TABLE IF NOT EXISTS airpublisher_dropbox_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  is_configured BOOLEAN DEFAULT true NOT NULL,
  configured_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(is_configured)
);

-- Enable RLS
ALTER TABLE airpublisher_dropbox_config ENABLE ROW LEVEL SECURITY;

-- Any authenticated user can view config
CREATE POLICY "Users can view dropbox config" ON airpublisher_dropbox_config
  FOR SELECT
  USING (auth.uid() IS NOT NULL);


