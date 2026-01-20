import { createClient as createServiceClient } from '@supabase/supabase-js'
import { Database } from '@/lib/supabase/types'

/**
 * Refresh YouTube access token using refresh token
 * Returns new access token and expiration time
 */
async function refreshYouTubeToken(
  refreshToken: string,
  clientId: string,
  clientSecret: string
): Promise<{ access_token: string; expires_in: number; expires_at: Date } | null> {
  try {
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
      }),
    })

    if (!response.ok) {
      const errorData = await response.text()
      console.error('[refreshYouTubeToken] Token refresh failed:', errorData)
      return null
    }

    const data = await response.json()
    const { access_token, expires_in } = data

    if (!access_token) {
      console.error('[refreshYouTubeToken] No access token in refresh response')
      return null
    }

    const expiresAt = new Date(Date.now() + (expires_in || 3600) * 1000)

    return {
      access_token,
      expires_in: expires_in || 3600,
      expires_at: expiresAt,
    }
  } catch (error) {
    console.error('[refreshYouTubeToken] Exception refreshing token:', error)
    return null
  }
}

/**
 * Get a valid YouTube access token, automatically refreshing if expired
 * 
 * @param tokens - Token record from database
 * @param creatorUniqueIdentifier - Creator unique identifier (for lookup)
 * @returns Valid access token, or null if refresh failed
 */
export async function getValidYouTubeAccessToken(
  tokens: {
    id: string
    google_access_token: string | null
    google_refresh_token: string | null
    expires_at: string | null
    creator_unique_identifier?: string | null
    user_id?: string | null
  } | null,
  creatorUniqueIdentifier?: string
): Promise<string | null> {
  if (!tokens) {
    console.warn('[getValidYouTubeAccessToken] No tokens provided')
    return null
  }

  const clientId = process.env.YOUTUBE_CLIENT_ID
  const clientSecret = process.env.YOUTUBE_CLIENT_SECRET

  if (!clientId || !clientSecret) {
    console.error('[getValidYouTubeAccessToken] Missing YouTube OAuth credentials')
    return null
  }

  if (!tokens.google_access_token) {
    console.warn('[getValidYouTubeAccessToken] No access token found')
    return null
  }

  // Check if token is expired (or about to expire in 5 minutes)
  const expiresAt = tokens.expires_at ? new Date(tokens.expires_at) : null
  const now = new Date()
  const fiveMinutesFromNow = new Date(now.getTime() + 5 * 60 * 1000)

  const isExpired = !expiresAt || expiresAt <= fiveMinutesFromNow

  if (!isExpired && tokens.google_access_token) {
    // Token is still valid, return it
    return tokens.google_access_token
  }

  // Token is expired or about to expire, refresh it
  if (!tokens.google_refresh_token) {
    console.error('[getValidYouTubeAccessToken] Access token expired but no refresh token available')
    return null
  }

  console.log('[getValidYouTubeAccessToken] Access token expired, refreshing...')

  const refreshResult = await refreshYouTubeToken(
    tokens.google_refresh_token,
    clientId,
    clientSecret
  )

  if (!refreshResult) {
    console.error('[getValidYouTubeAccessToken] Failed to refresh token')
    return null
  }

  // Update database with new access token
  const serviceClient = createServiceClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Try new table first, fallback to old table
  let tableName = 'airpublisher_youtube_tokens'
  let updateField = 'creator_unique_identifier'

  // Check if new table exists
  const { error: tableCheckError } = await (serviceClient
    .from('airpublisher_youtube_tokens') as any)
    .select('id')
    .limit(1)

  if (tableCheckError && tableCheckError.code === '42P01') {
    tableName = 'youtube_tokens'
    updateField = 'user_id'
  }

  const lookupField = tableName === 'airpublisher_youtube_tokens' && creatorUniqueIdentifier
    ? 'creator_unique_identifier'
    : 'user_id'
  const lookupValue = tableName === 'airpublisher_youtube_tokens' && creatorUniqueIdentifier
    ? creatorUniqueIdentifier
    : (tokens.user_id || tokens.id)

  const updateData: any = {
    google_access_token: refreshResult.access_token,
    expires_at: refreshResult.expires_at.toISOString(),
    updated_at: new Date().toISOString(),
  }

  const { error: updateError } = await (serviceClient
    .from(tableName) as any)
    .update(updateData)
    .eq('id', tokens.id)

  if (updateError) {
    console.error('[getValidYouTubeAccessToken] Failed to update token in database:', updateError)
    // Still return the new token even if DB update failed (it's valid for now)
  } else {
    console.log('[getValidYouTubeAccessToken] ✅ Successfully refreshed and updated token')
  }

  return refreshResult.access_token
}

/**
 * Get YouTube tokens and return a valid access token (refreshing if needed)
 * 
 * @param creatorUniqueIdentifier - Creator unique identifier
 * @returns Valid access token, or null if unavailable
 */
export async function getYouTubeAccessTokenForCreator(
  creatorUniqueIdentifier: string
): Promise<string | null> {
  const serviceClient = createServiceClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Try new table first
  let { data: tokens, error: tokenError } = await (serviceClient
    .from('airpublisher_youtube_tokens') as any)
    .select('*')
    .eq('creator_unique_identifier', creatorUniqueIdentifier)
    .maybeSingle()

  // Fallback to old table
  if (tokenError || !tokens) {
    const { data: oldTokens } = await (serviceClient
      .from('youtube_tokens') as any)
      .select('*')
      .eq('creator_unique_identifier', creatorUniqueIdentifier)
      .maybeSingle()
    
    tokens = oldTokens as any
  }

  if (!tokens) {
    console.warn('[getYouTubeAccessTokenForCreator] No tokens found for creator:', creatorUniqueIdentifier)
    return null
  }

  return getValidYouTubeAccessToken(tokens, creatorUniqueIdentifier)
}


