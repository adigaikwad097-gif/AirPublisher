-- Create Dropbox tokens table (company-wide, not per-creator)
CREATE TABLE IF NOT EXISTS airpublisher_dropbox_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_unique_identifier TEXT, -- Placeholder, not used for company account
  is_company_account BOOLEAN DEFAULT true NOT NULL,
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(is_company_account) -- Only one company account allowed
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_dropbox_tokens_creator ON airpublisher_dropbox_tokens(creator_unique_identifier);

-- Enable RLS
ALTER TABLE airpublisher_dropbox_tokens ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Any authenticated user can view company Dropbox token (shared by all)
CREATE POLICY "Users can view company dropbox token" ON airpublisher_dropbox_tokens
  FOR SELECT
  USING (is_company_account = true AND auth.uid() IS NOT NULL);

-- Any authenticated user can insert/update company token (first connection)
CREATE POLICY "Users can manage company dropbox token" ON airpublisher_dropbox_tokens
  FOR ALL
  USING (is_company_account = true AND auth.uid() IS NOT NULL)
  WITH CHECK (is_company_account = true AND auth.uid() IS NOT NULL);

-- Create fallback table (for backward compatibility)
CREATE TABLE IF NOT EXISTS dropbox_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_unique_identifier TEXT NOT NULL UNIQUE,
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_dropbox_tokens_creator_old ON dropbox_tokens(creator_unique_identifier);

