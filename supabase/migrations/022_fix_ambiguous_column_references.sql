-- Migration: Fix ambiguous column references in token functions
-- The issue was that function variables had the same name as table columns
-- Solution: Use table aliases to qualify column names

-- Fix YouTube token function
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
  -- Get tokens from database (use table alias to avoid ambiguity)
  SELECT 
    t.google_access_token,
    t.google_refresh_token,
    t.expires_at
  INTO v_tokens
  FROM airpublisher_youtube_tokens t
  WHERE t.creator_unique_identifier = p_creator_unique_identifier
  LIMIT 1;

  -- If no tokens found, return empty
  IF v_tokens IS NULL THEN
    RETURN;
  END IF;

  -- Check if token needs refresh (expired or expiring within 5 minutes)
  v_expires_at := v_tokens.expires_at;
  v_needs_refresh := v_expires_at IS NULL OR v_expires_at <= (NOW() + INTERVAL '5 minutes');

  -- If token is valid, return it
  IF NOT v_needs_refresh AND v_tokens.google_access_token IS NOT NULL THEN
    RETURN QUERY SELECT 
      v_tokens.google_access_token::TEXT,
      v_expires_at,
      FALSE;
    RETURN;
  END IF;

  -- Token needs refresh
  -- Check if refresh token exists
  IF v_tokens.google_refresh_token IS NULL THEN
    RETURN QUERY SELECT 
      v_tokens.google_access_token::TEXT,
      v_expires_at,
      TRUE; -- Refresh token expired
    RETURN;
  END IF;

  -- Token is expired but refresh token exists
  -- Return existing token - background job will refresh it
  RETURN QUERY SELECT 
    v_tokens.google_access_token::TEXT,
    v_expires_at,
    FALSE;
END;
$$;

-- Fix Instagram token function
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
  -- Get tokens from database (use table alias to avoid ambiguity)
  SELECT 
    t.facebook_access_token,
    t.instagram_access_token,
    t.expires_at
  INTO v_tokens
  FROM airpublisher_instagram_tokens t
  WHERE t.creator_unique_identifier = p_creator_unique_identifier
  LIMIT 1;

  -- If no tokens found, return empty
  IF v_tokens IS NULL THEN
    RETURN;
  END IF;

  -- Check if token needs refresh (expired or expiring within 7 days)
  v_expires_at := v_tokens.expires_at;
  v_needs_refresh := v_expires_at IS NULL OR v_expires_at <= (NOW() + INTERVAL '7 days');

  -- If token is valid, return it
  IF NOT v_needs_refresh AND v_tokens.facebook_access_token IS NOT NULL THEN
    RETURN QUERY SELECT 
      COALESCE(v_tokens.facebook_access_token, v_tokens.instagram_access_token)::TEXT,
      v_expires_at,
      FALSE;
    RETURN;
  END IF;

  -- Token needs refresh - return existing token
  -- Background job will refresh it
  RETURN QUERY SELECT 
    COALESCE(v_tokens.facebook_access_token, v_tokens.instagram_access_token)::TEXT,
    v_expires_at,
    FALSE;
END;
$$;

-- Fix TikTok token function
CREATE OR REPLACE FUNCTION get_valid_tiktok_token(p_creator_unique_identifier TEXT)
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
BEGIN
  -- Get tokens from database (use table alias to avoid ambiguity)
  SELECT 
    t.tiktok_access_token,
    t.expires_at
  INTO v_tokens
  FROM airpublisher_tiktok_tokens t
  WHERE t.creator_unique_identifier = p_creator_unique_identifier
  LIMIT 1;

  -- If no tokens found, return empty
  IF v_tokens IS NULL THEN
    RETURN;
  END IF;

  -- TikTok tokens typically don't expire, just return existing
  RETURN QUERY SELECT 
    v_tokens.tiktok_access_token::TEXT,
    v_tokens.expires_at,
    FALSE;
END;
$$;

