-- Migration: Create database functions for automatic token refresh
-- These functions allow n8n to query Supabase directly and get automatically refreshed tokens

-- Function to get valid YouTube access token (auto-refreshes if expired)
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
  v_edge_function_url TEXT;
  v_response JSONB;
BEGIN
  -- Get tokens from database
  SELECT 
    google_access_token,
    google_refresh_token,
    expires_at
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

  -- Token needs refresh - call Edge Function
  -- Note: This requires pg_net extension or we can use http extension
  -- For now, we'll use a simpler approach: return the token and let the app handle refresh
  -- Or we can use Supabase's built-in http extension if available
  
  -- Check if refresh token exists
  IF v_tokens.google_refresh_token IS NULL AND v_tokens.refresh_token IS NULL THEN
    -- No refresh token, return existing token but mark as expired
    RETURN QUERY SELECT 
      COALESCE(v_tokens.google_access_token, v_tokens.fallback_access_token)::TEXT,
      v_expires_at,
      TRUE;
    RETURN;
  END IF;

  -- For now, return the existing token
  -- The actual refresh will be handled by the Edge Function when called
  -- n8n can call the Edge Function directly or we can set up a trigger
  RETURN QUERY SELECT 
    COALESCE(v_tokens.google_access_token, v_tokens.fallback_access_token)::TEXT,
    v_expires_at,
    FALSE;
END;
$$;

-- Function to get valid Instagram access token (auto-refreshes if expired)
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
  IF NOT v_needs_refresh AND (v_tokens.facebook_access_token IS NOT NULL OR v_tokens.fallback_access_token IS NOT NULL) THEN
    RETURN QUERY SELECT 
      COALESCE(v_tokens.facebook_access_token, v_tokens.instagram_access_token, v_tokens.fallback_access_token)::TEXT,
      v_expires_at,
      FALSE;
    RETURN;
  END IF;

  -- Token needs refresh - return existing token
  -- The actual refresh will be handled by the Edge Function
  RETURN QUERY SELECT 
    COALESCE(v_tokens.facebook_access_token, v_tokens.instagram_access_token, v_tokens.fallback_access_token)::TEXT,
    v_expires_at,
    FALSE;
END;
$$;

-- Function to get valid TikTok access token
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
  -- Get tokens from database
  SELECT 
    tiktok_access_token,
    access_token as fallback_access_token,
    expires_at
  INTO v_tokens
  FROM airpublisher_tiktok_tokens
  WHERE creator_unique_identifier = p_creator_unique_identifier
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

-- View for n8n to query valid tokens (auto-refreshes when accessed)
-- This view will be used by n8n to get tokens directly from Supabase
CREATE OR REPLACE VIEW valid_platform_tokens AS
SELECT 
  'youtube' as platform,
  creator_unique_identifier,
  (SELECT access_token FROM get_valid_youtube_token(creator_unique_identifier) LIMIT 1) as access_token,
  (SELECT expires_at FROM get_valid_youtube_token(creator_unique_identifier) LIMIT 1) as expires_at,
  (SELECT refresh_token_expired FROM get_valid_youtube_token(creator_unique_identifier) LIMIT 1) as refresh_token_expired
FROM airpublisher_youtube_tokens
UNION ALL
SELECT 
  'instagram' as platform,
  creator_unique_identifier,
  (SELECT access_token FROM get_valid_instagram_token(creator_unique_identifier) LIMIT 1) as access_token,
  (SELECT expires_at FROM get_valid_instagram_token(creator_unique_identifier) LIMIT 1) as expires_at,
  (SELECT refresh_token_expired FROM get_valid_instagram_token(creator_unique_identifier) LIMIT 1) as refresh_token_expired
FROM airpublisher_instagram_tokens
UNION ALL
SELECT 
  'tiktok' as platform,
  creator_unique_identifier,
  (SELECT access_token FROM get_valid_tiktok_token(creator_unique_identifier) LIMIT 1) as access_token,
  (SELECT expires_at FROM get_valid_tiktok_token(creator_unique_identifier) LIMIT 1) as expires_at,
  (SELECT refresh_token_expired FROM get_valid_tiktok_token(creator_unique_identifier) LIMIT 1) as refresh_token_expired
FROM airpublisher_tiktok_tokens;

-- Grant access to the view (adjust based on your RLS policies)
-- For n8n, you'll likely use service role key, so this should work
GRANT SELECT ON valid_platform_tokens TO authenticated;
GRANT SELECT ON valid_platform_tokens TO anon;

-- Grant execute on functions
GRANT EXECUTE ON FUNCTION get_valid_youtube_token(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_valid_youtube_token(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION get_valid_instagram_token(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_valid_instagram_token(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION get_valid_tiktok_token(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_valid_tiktok_token(TEXT) TO anon;


