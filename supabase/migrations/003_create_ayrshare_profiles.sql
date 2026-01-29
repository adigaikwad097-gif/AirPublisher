-- Create ayrshare_profiles table to store user-specific Ayrshare profile info
-- This enables each user to have their own Ayrshare profile and connect their social accounts

CREATE TABLE IF NOT EXISTS public.ayrshare_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  creator_unique_identifier TEXT NOT NULL,
  ayrshare_profile_id TEXT NOT NULL,
  ayrshare_profile_key TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id),
  UNIQUE(creator_unique_identifier)
);

-- Index for lookups
CREATE INDEX IF NOT EXISTS idx_ayrshare_profiles_user_id ON public.ayrshare_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_ayrshare_profiles_creator ON public.ayrshare_profiles(creator_unique_identifier);
CREATE INDEX IF NOT EXISTS idx_ayrshare_profiles_profile_id ON public.ayrshare_profiles(ayrshare_profile_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for updated_at
CREATE TRIGGER update_ayrshare_profiles_updated_at
  BEFORE UPDATE ON public.ayrshare_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE public.ayrshare_profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can view their own profile
CREATE POLICY "Users can view own Ayrshare profile"
  ON public.ayrshare_profiles FOR SELECT
  USING (auth.uid()::text = user_id::text);

-- Users can insert their own profile
CREATE POLICY "Users can insert own Ayrshare profile"
  ON public.ayrshare_profiles FOR INSERT
  WITH CHECK (auth.uid()::text = user_id::text);

-- Users can update their own profile
CREATE POLICY "Users can update own Ayrshare profile"
  ON public.ayrshare_profiles FOR UPDATE
  USING (auth.uid()::text = user_id::text);



