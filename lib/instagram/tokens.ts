import { createClient as createServiceClient } from '@supabase/supabase-js'
import { Database } from '@/lib/supabase/types'

interface InstagramTokens {
  id: string
  user_id: string | null
  creator_unique_identifier?: string | null
  facebook_access_token?: string | null
  instagram_access_token?: string | null
  expires_at: string | null
  [key: string]: any
}

const TOKEN_REFRESH_THRESHOLD_SECONDS = 300 // Refresh if token expires in less than 5 minutes

/**
 * Refresh an expired Instagram access token
 * Instagram long-lived tokens (60 days) can be refreshed before they expire
 * 
 * @param accessToken The Instagram access token to refresh
 * @param appSecret Your Instagram App Secret
 * @returns New access token and expiration time, or null if refresh fails
 */
export async function refreshInstagramToken(
  accessToken: string,
  appSecret: string
): Promise<{ access_token: string; expires_in: number; expires_at: Date } | null> {
  try {
    // Instagram token refresh endpoint
    // See: https://developers.facebook.com/docs/instagram-platform/instagram-api-with-instagram-login/business-login
    const response = await fetch(
      `https://graph.instagram.com/refresh_access_token?` +
      `grant_type=ig_refresh_token&` +
      `access_token=${accessToken}`,
      { method: 'GET' }
    )

    if (!response.ok) {
      const errorData = await response.text()
      console.error('[refreshInstagramToken] Token refresh failed:', errorData)
      return null
    }

    const data = await response.json()
    const { access_token, expires_in } = data

    if (!access_token) {
      console.error('[refreshInstagramToken] No access token in refresh response')
      return null
    }

    const expiresAt = new Date(Date.now() + (expires_in || 5184000) * 1000) // Default 60 days

    return {
      access_token,
      expires_in: expires_in || 5184000,
      expires_at: expiresAt,
    }
  } catch (error) {
    console.error('[refreshInstagramToken] Exception refreshing token:', error)
    return null
  }
}

/**
 * Get a valid Instagram access token, automatically refreshing if expired
 * 
 * @param tokens - Token record from database
 * @param creatorUniqueIdentifier - Creator unique identifier (optional, for lookup)
 * @returns Valid access token, or null if refresh failed
 */
export async function getValidInstagramAccessToken(
  tokens: InstagramTokens | null,
  creatorUniqueIdentifier?: string
): Promise<string | null> {
  if (!tokens) {
    console.warn('[getValidInstagramAccessToken] No tokens provided')
    return null
  }

  const appSecret = process.env.INSTAGRAM_APP_SECRET || 
                    '4691b6a3b97ab0dcaec41b218e4321c1' || 
                    process.env.META_APP_SECRET ||
                    '67b086a74833746df6a0a7ed0b50f867'

  if (!appSecret) {
    console.error('[getValidInstagramAccessToken] Missing Instagram App Secret')
    return null
  }

  // Get access token from tokens (can be in facebook_access_token or instagram_access_token)
  const accessToken = tokens.facebook_access_token || tokens.instagram_access_token || (tokens as any).access_token

  if (!accessToken) {
    console.warn('[getValidInstagramAccessToken] No access token found')
    return null
  }

  // Check if token is expired (or about to expire in 5 minutes)
  const expiresAt = tokens.expires_at ? new Date(tokens.expires_at) : null
  const now = new Date()
  const fiveMinutesFromNow = new Date(now.getTime() + TOKEN_REFRESH_THRESHOLD_SECONDS * 1000)

  const isExpired = !expiresAt || expiresAt <= fiveMinutesFromNow

  if (!isExpired) {
    // Token is still valid, return it
    return accessToken
  }

  // Token is expired or about to expire, refresh it
  console.log('[getValidInstagramAccessToken] Access token expired, refreshing...')

  const refreshResult = await refreshInstagramToken(accessToken, appSecret)

  if (!refreshResult) {
    console.error('[getValidInstagramAccessToken] Failed to refresh token - user needs to reconnect')
    return null
  }

  // Update database with new access token
  const serviceClient = createServiceClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Try new table first, fallback to old table
  let tableName = 'airpublisher_instagram_tokens'
  
  // Check if new table exists
  const { error: tableCheckError } = await (serviceClient
    .from('airpublisher_instagram_tokens') as any)
    .select('id')
    .limit(1)
  
  if (tableCheckError && tableCheckError.code === '42P01') {
    tableName = 'instagram_tokens'
  }

  const updateData: any = {}
  
  if (tableName === 'airpublisher_instagram_tokens') {
    // New table structure
    updateData.facebook_access_token = refreshResult.access_token
    updateData.instagram_access_token = refreshResult.access_token
    updateData.expires_at = refreshResult.expires_at.toISOString()
    updateData.updated_at = new Date().toISOString()
  } else {
    // Old table structure
    updateData.access_token = refreshResult.access_token
    updateData.expires_at = refreshResult.expires_at.toISOString()
    updateData.updated_at = new Date().toISOString()
  }

  const { error: updateError } = await (serviceClient
    .from(tableName) as any)
    .update(updateData)
    .eq('id', tokens.id)

  if (updateError) {
    console.error('[getValidInstagramAccessToken] Failed to update token in database:', updateError)
    // Still return the new token even if DB update failed (it's valid for now)
  } else {
    console.log('[getValidInstagramAccessToken] ✅ Successfully refreshed and updated token')
  }

  return refreshResult.access_token
}

/**
 * Get Instagram tokens for a creator and return a valid access token (refreshing if needed)
 * 
 * @param creatorUniqueIdentifier - Creator unique identifier
 * @returns Valid access token, or null if unavailable/failed
 */
export async function getInstagramAccessTokenForCreator(
  creatorUniqueIdentifier: string
): Promise<string | null> {
  const serviceClient = createServiceClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Try new table first
  let { data: tokens, error: tokenError } = await (serviceClient
    .from('airpublisher_instagram_tokens') as any)
    .select('*')
    .eq('creator_unique_identifier', creatorUniqueIdentifier)
    .maybeSingle()

  // Fallback to old table
  if (tokenError || !tokens) {
    const { data: oldTokens } = await (serviceClient
      .from('instagram_tokens') as any)
      .select('*')
      .eq('creator_unique_identifier', creatorUniqueIdentifier)
      .maybeSingle()
    
    tokens = oldTokens as any
  }

  if (!tokens) {
    console.warn('[getInstagramAccessTokenForCreator] No tokens found for creator:', creatorUniqueIdentifier)
    return null
  }

  return getValidInstagramAccessToken(tokens as InstagramTokens, creatorUniqueIdentifier)
}


