-- Migration: Simplify token refresh functions
-- Since direct HTTP calls from PostgreSQL are complex, we'll use a hybrid approach:
-- 1. Database functions return tokens (checking expiration)
-- 2. Background cron job refreshes expired tokens periodically
-- 3. n8n queries get fresh tokens automatically

-- Update YouTube function to be simpler and more reliable
CREATE OR REPLACE FUNCTION get_valid_youtube_token(p_creator_unique_identifier TEXT)
RETURNS TABLE (
  access_token TEXT,
  expires_at TIMESTAMPTZ,
  refresh_token_expired BOOLEAN
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_tokens RECORD;
  v_expires_at TIMESTAMPTZ;
  v_needs_refresh BOOLEAN;
BEGIN
  -- Get tokens from database
  SELECT 
    google_access_token,
    google_refresh_token,
    refresh_token,
    expires_at,
    access_token as fallback_access_token
  INTO v_tokens
  FROM airpublisher_youtube_tokens
  WHERE creator_unique_identifier = p_creator_unique_identifier
  LIMIT 1;

  -- If no tokens found, return empty
  IF v_tokens IS NULL THEN
    RETURN;
  END IF;

  -- Check if token needs refresh (expired or expiring within 5 minutes)
  v_expires_at := v_tokens.expires_at;
  v_needs_refresh := v_expires_at IS NULL OR v_expires_at <= (NOW() + INTERVAL '5 minutes');

  -- If token is valid, return it
  IF NOT v_needs_refresh AND (v_tokens.google_access_token IS NOT NULL OR v_tokens.fallback_access_token IS NOT NULL) THEN
    RETURN QUERY SELECT 
      COALESCE(v_tokens.google_access_token, v_tokens.fallback_access_token)::TEXT,
      v_expires_at,
      FALSE;
    RETURN;
  END IF;

  -- Token needs refresh
  -- Check if refresh token exists
  IF v_tokens.google_refresh_token IS NULL AND v_tokens.refresh_token IS NULL THEN
    RETURN QUERY SELECT 
      COALESCE(v_tokens.google_access_token, v_tokens.fallback_access_token)::TEXT,
      v_expires_at,
      TRUE; -- Refresh token expired
    RETURN;
  END IF;

  -- Token is expired but refresh token exists
  -- Return existing token - background job will refresh it
  -- Or the app can refresh it on-demand
  RETURN QUERY SELECT 
    COALESCE(v_tokens.google_access_token, v_tokens.fallback_access_token)::TEXT,
    v_expires_at,
    FALSE;
END;
$$;

-- Update Instagram function similarly
CREATE OR REPLACE FUNCTION get_valid_instagram_token(p_creator_unique_identifier TEXT)
RETURNS TABLE (
  access_token TEXT,
  expires_at TIMESTAMPTZ,
  refresh_token_expired BOOLEAN
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_tokens RECORD;
  v_expires_at TIMESTAMPTZ;
  v_needs_refresh BOOLEAN;
BEGIN
  -- Get tokens from database
  SELECT 
    facebook_access_token,
    instagram_access_token,
    access_token as fallback_access_token,
    expires_at
  INTO v_tokens
  FROM airpublisher_instagram_tokens
  WHERE creator_unique_identifier = p_creator_unique_identifier
  LIMIT 1;

  -- If no tokens found, return empty
  IF v_tokens IS NULL THEN
    RETURN;
  END IF;

  -- Check if token needs refresh (expired or expiring within 7 days)
  v_expires_at := v_tokens.expires_at;
  v_needs_refresh := v_expires_at IS NULL OR v_expires_at <= (NOW() + INTERVAL '7 days');

  -- If token is valid, return it
  IF NOT v_needs_refresh AND (v_tokens.facebook_access_token IS NOT NULL OR v_tokens.fallback_access_token IS NOT NULL) THEN
    RETURN QUERY SELECT 
      COALESCE(v_tokens.facebook_access_token, v_tokens.instagram_access_token, v_tokens.fallback_access_token)::TEXT,
      v_expires_at,
      FALSE;
    RETURN;
  END IF;

  -- Token needs refresh - return existing token
  -- Background job will refresh it
  RETURN QUERY SELECT 
    COALESCE(v_tokens.facebook_access_token, v_tokens.instagram_access_token, v_tokens.fallback_access_token)::TEXT,
    v_expires_at,
    FALSE;
END;
$$;

