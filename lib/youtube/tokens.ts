import { createClient as createServiceClient } from '@supabase/supabase-js'

/**
 * Refresh YouTube access token using refresh token
 */
async function refreshYouTubeToken(
  refreshToken: string,
  creatorUniqueIdentifier: string
): Promise<{ access_token: string; expires_in: number } | null> {
  try {
    console.log('[refreshYouTubeToken] Refreshing YouTube token for creator:', creatorUniqueIdentifier)

    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID || import.meta.env.GOOGLE_CLIENT_ID || import.meta.env.YOUTUBE_CLIENT_ID || '',
        client_secret: import.meta.env.VITE_GOOGLE_CLIENT_SECRET || import.meta.env.GOOGLE_CLIENT_SECRET || import.meta.env.YOUTUBE_CLIENT_SECRET || '',
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      console.error('[refreshYouTubeToken] Token refresh failed:', error)

      // Check if refresh token is invalid/expired
      try {
        const errorJson = JSON.parse(error)
        if (errorJson.error === 'invalid_grant' || errorJson.error_description?.includes('Token has been expired')) {
          console.error('[refreshYouTubeToken] Refresh token is expired or invalid')
          // Mark refresh token as expired in database
          const serviceClient = createServiceClient(
            import.meta.env.VITE_SUPABASE_URL,
            import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY || import.meta.env.SUPABASE_SERVICE_ROLE_KEY
          )

          // Try to update a flag indicating refresh token is expired
          // We'll add a refresh_token_expired field or use a convention
          try {
            await serviceClient
              .from('youtube_tokens')
              .update({
                updated_at: new Date().toISOString(),
              })
              .eq('creator_unique_identifier', creatorUniqueIdentifier)
          } catch {
            // Ignore update errors
          }
        }
      } catch {
        // Error response is not JSON, continue
      }

      return null
    }

    const data = await response.json()
    return {
      access_token: data.access_token,
      expires_in: data.expires_in || 3600, // Default to 1 hour
    }
  } catch (error) {
    console.error('[refreshYouTubeToken] Error:', error)
    return null
  }
}

/**
 * Get valid YouTube access token, automatically refreshing if expired
 * Updates the database with the new token if refreshed
 * 
 * Returns:
 * - string: Valid access token
 * - null: Token refresh failed (refresh token may be expired/invalid)
 */
export async function getValidYouTubeAccessToken(
  tokens: any,
  creatorUniqueIdentifier: string
): Promise<string | null> {
  try {
    const serviceClient = createServiceClient(
      import.meta.env.VITE_SUPABASE_URL,
      import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY || import.meta.env.SUPABASE_SERVICE_ROLE_KEY
    )

    let accessToken = tokens.google_access_token || tokens.access_token
    let refreshToken = tokens.google_refresh_token || tokens.refresh_token
    const expiresAt = tokens.expires_at

    // Decrypt Vault tokens if needed
    if (!accessToken && tokens.google_access_token_secret_id) {
      const { data: decAccess } = await serviceClient.rpc('get_decrypted_secret', {
        p_secret_id: tokens.google_access_token_secret_id
      })
      if (decAccess) accessToken = decAccess
    }
    if (!refreshToken && tokens.google_refresh_token_secret_id) {
      const { data: decRefresh } = await serviceClient.rpc('get_decrypted_secret', {
        p_secret_id: tokens.google_refresh_token_secret_id
      })
      if (decRefresh) refreshToken = decRefresh
    }

    if (!accessToken || !refreshToken) {
      console.warn('[getValidYouTubeAccessToken] Missing access token or refresh token')
      return null
    }

    // Check if token is expired or about to expire (within 5 minutes)
    const now = new Date()
    const expiresAtDate = expiresAt ? new Date(expiresAt) : null
    const fiveMinutesFromNow = new Date(now.getTime() + 5 * 60 * 1000)

    // If no expires_at or token is expired/expiring soon, refresh it
    if (!expiresAtDate || expiresAtDate <= fiveMinutesFromNow) {
      console.log('[getValidYouTubeAccessToken] Access token expired or expiring soon, refreshing...')

      const refreshResult = await refreshYouTubeToken(refreshToken, creatorUniqueIdentifier)

      if (!refreshResult) {
        console.error('[getValidYouTubeAccessToken] Failed to refresh token')
        return null
      }

      const newExpiresAt = new Date(now.getTime() + refreshResult.expires_in * 1000).toISOString()
      const updateData: any = {
        expires_at: newExpiresAt,
        updated_at: new Date().toISOString(),
      }

      // Encrypt new token before saving
      let hasNewSecret = false
      if (tokens.google_access_token_secret_id) {
        // Update existing secret
        const { data: updated } = await serviceClient.rpc('update_vault_secret', {
          p_secret_id: tokens.google_access_token_secret_id,
          p_new_secret: refreshResult.access_token
        })
        if (updated) hasNewSecret = true
      } else if (tokens.user_id) {
        // Create new secret
        const { data: secretId } = await serviceClient.rpc('create_vault_secret', {
          p_secret: refreshResult.access_token,
          p_name: `youtube_access_${tokens.user_id}`
        })
        if (secretId) {
          updateData.google_access_token_secret_id = secretId
          hasNewSecret = true
        }
      }

      if (hasNewSecret) {
        updateData.google_access_token = null
        updateData.access_token = null
      } else {
        updateData.google_access_token = refreshResult.access_token
        updateData.access_token = refreshResult.access_token
      }

      // Update the base table
      const { error: updateError } = await serviceClient
        .from('youtube_tokens')
        .update(updateData)
        .eq('creator_unique_identifier', creatorUniqueIdentifier)

      if (updateError) {
        console.error('[getValidYouTubeAccessToken] Failed to update token in database:', updateError)
      }

      console.log('[getValidYouTubeAccessToken] ✅ Successfully refreshed and updated token')
      return refreshResult.access_token
    }

    // Token is still valid
    console.log('[getValidYouTubeAccessToken] Token is still valid, using existing token')
    return accessToken
  } catch (error) {
    console.error('[getValidYouTubeAccessToken] Error:', error)
    return null
  }
}
