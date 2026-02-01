-- Migration: Enable pg_net extension for automatic token refresh
-- This allows database functions to call the Edge Function for token refresh

-- Enable pg_net extension (if available)
-- Note: This may require Supabase admin access
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Update the YouTube token function to automatically refresh via Edge Function
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
  v_new_token TEXT;
  v_new_expires_at TIMESTAMPTZ;
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

  -- Token needs refresh - try to call Edge Function via pg_net
  -- Get Supabase project URL from current database
  v_edge_function_url := current_setting('app.settings.supabase_url', true) || '/functions/v1/refresh-token';
  
  -- If pg_net is available, call Edge Function
  BEGIN
    SELECT content::jsonb INTO v_response
    FROM net.http_post(
      url := v_edge_function_url,
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
      ),
      body := jsonb_build_object(
        'platform', 'youtube',
        'creator_unique_identifier', p_creator_unique_identifier
      )
    );

    -- Extract new token from response
    IF v_response->>'success' = 'true' THEN
      v_new_token := v_response->>'access_token';
      v_new_expires_at := (v_response->>'expires_at')::timestamptz;
      
      -- Update database with new token
      UPDATE airpublisher_youtube_tokens
      SET 
        google_access_token = v_new_token,
        expires_at = v_new_expires_at,
        updated_at = NOW()
      WHERE creator_unique_identifier = p_creator_unique_identifier;
      
      RETURN QUERY SELECT v_new_token, v_new_expires_at, FALSE;
      RETURN;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    -- If pg_net call fails, return existing token
    -- Log error but don't fail
    RAISE WARNING 'Failed to refresh token via Edge Function: %', SQLERRM;
  END;

  -- Fallback: return existing token (might be expired)
  -- Check if refresh token exists
  IF v_tokens.google_refresh_token IS NULL AND v_tokens.refresh_token IS NULL THEN
    RETURN QUERY SELECT 
      COALESCE(v_tokens.google_access_token, v_tokens.fallback_access_token)::TEXT,
      v_expires_at,
      TRUE; -- Refresh token expired
    RETURN;
  END IF;

  -- Return existing token (will be refreshed on next call or by background job)
  RETURN QUERY SELECT 
    COALESCE(v_tokens.google_access_token, v_tokens.fallback_access_token)::TEXT,
    v_expires_at,
    FALSE;
END;
$$;

-- Similar update for Instagram (simplified - can be expanded)
-- For now, the functions will return tokens and rely on background refresh
-- The Edge Function can be called manually or via cron job

