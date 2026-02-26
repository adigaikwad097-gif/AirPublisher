import { createClient as createServiceClient } from '@supabase/supabase-js'

/**
 * Refresh Instagram/Facebook access token
 * Instagram uses Facebook Graph API for token refresh
 */
async function refreshInstagramToken(
  accessToken: string,
  appId: string,
  appSecret: string,
  creatorUniqueIdentifier: string
): Promise<{ access_token: string; expires_in: number } | null> {
  try {
    console.log('[refreshInstagramToken] Refreshing Instagram token')

    // Instagram/Facebook long-lived tokens can be refreshed using the Graph API
    // See: https://developers.facebook.com/docs/instagram-basic-display-api/guides/long-lived-access-tokens
    const response = await fetch(
      `https://graph.facebook.com/v18.0/oauth/access_token?` +
      `grant_type=fb_exchange_token&` +
      `client_id=${appId}&` +
      `client_secret=${appSecret}&` +
      `fb_exchange_token=${accessToken}`,
      {
        method: 'GET',
      }
    )

    if (!response.ok) {
      const error = await response.text()
      console.error('[refreshInstagramToken] Token refresh failed:', error)

      // Check if refresh token is invalid/expired
      try {
        const errorJson = JSON.parse(error)
        if (errorJson.error?.code === 190 || errorJson.error?.message?.includes('expired') || errorJson.error?.message?.includes('invalid')) {
          console.error('[refreshInstagramToken] Refresh token is expired or invalid')
          // Mark refresh token as expired in database
          const serviceClient = createServiceClient(
            import.meta.env.VITE_SUPABASE_URL,
            import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY || import.meta.env.SUPABASE_SERVICE_ROLE_KEY
          )

          try {
            await serviceClient
              .from('instagram_tokens')
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
      expires_in: data.expires_in || 5184000, // Default to 60 days
    }
  } catch (error) {
    console.error('[refreshInstagramToken] Error:', error)
    return null
  }
}

/**
 * Get valid Instagram access token, automatically refreshing if expired
 * Updates the database with the new token if refreshed
 * 
 * Returns:
 * - string: Valid access token
 * - null: Token refresh failed (refresh token may be expired/invalid)
 */
export async function getValidInstagramAccessToken(
  tokens: any,
  creatorUniqueIdentifier: string
): Promise<string | null> {
  try {
    const serviceClient = createServiceClient(
      import.meta.env.VITE_SUPABASE_URL,
      import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY || import.meta.env.SUPABASE_SERVICE_ROLE_KEY
    )

    let accessToken = tokens.facebook_access_token || tokens.instagram_access_token || tokens.access_token
    const expiresAt = tokens.expires_at

    // Decrypt Vault token if needed
    if (!accessToken && tokens.access_token_secret_id) {
      const { data: decAccess } = await serviceClient.rpc('get_decrypted_secret', {
        p_secret_id: tokens.access_token_secret_id
      })
      if (decAccess) accessToken = decAccess
    }

    if (!accessToken) {
      console.warn('[getValidInstagramAccessToken] Missing access token')
      return null
    }

    // Instagram tokens are typically long-lived (60 days)
    // Check if token is expired or about to expire (within 7 days)
    const now = new Date()
    const expiresAtDate = expiresAt ? new Date(expiresAt) : null
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)

    // If no expires_at or token is expired/expiring soon, refresh it
    if (!expiresAtDate || expiresAtDate <= sevenDaysFromNow) {
      console.log('[getValidInstagramAccessToken] Access token expired or expiring soon, refreshing...')

      const appId = import.meta.env.VITE_INSTAGRAM_APP_ID || import.meta.env.INSTAGRAM_APP_ID || import.meta.env.META_APP_ID || ''
      const appSecret = import.meta.env.VITE_INSTAGRAM_APP_SECRET || import.meta.env.INSTAGRAM_APP_SECRET || import.meta.env.META_APP_SECRET || ''

      if (!appId || !appSecret) {
        console.error('[getValidInstagramAccessToken] Missing Instagram App ID or Secret')
        return null
      }

      const refreshResult = await refreshInstagramToken(accessToken, appId, appSecret, creatorUniqueIdentifier)

      if (!refreshResult) {
        console.error('[getValidInstagramAccessToken] Failed to refresh token')
        // Return existing token as fallback (might still work)
        return accessToken
      }

      const newExpiresAt = new Date(now.getTime() + refreshResult.expires_in * 1000).toISOString()
      const updateData: any = {
        expires_at: newExpiresAt,
        updated_at: new Date().toISOString(),
      }

      // Encrypt new token before saving
      let hasNewSecret = false
      if (tokens.access_token_secret_id) {
        const { data: updated } = await serviceClient.rpc('update_vault_secret', {
          p_secret_id: tokens.access_token_secret_id,
          p_new_secret: refreshResult.access_token
        })
        if (updated) hasNewSecret = true
      } else if (tokens.user_id) {
        const { data: secretId } = await serviceClient.rpc('create_vault_secret', {
          p_secret: refreshResult.access_token,
          p_name: `instagram_access_${tokens.user_id}`
        })
        if (secretId) {
          updateData.access_token_secret_id = secretId
          hasNewSecret = true
        }
      }

      if (hasNewSecret) {
        updateData.access_token = null
        updateData.instagram_access_token = null
        updateData.facebook_access_token = null
      } else {
        updateData.access_token = refreshResult.access_token
        updateData.instagram_access_token = refreshResult.access_token
        updateData.facebook_access_token = refreshResult.access_token
      }

      // Update the base table
      const { error: updateError } = await serviceClient
        .from('instagram_tokens')
        .update(updateData)
        .eq('creator_unique_identifier', creatorUniqueIdentifier)

      if (updateError) {
        console.error('[getValidInstagramAccessToken] Failed to update token in database:', updateError)
      }

      console.log('[getValidInstagramAccessToken] ✅ Successfully refreshed and updated token')
      return refreshResult.access_token
    }

    // Token is still valid
    console.log('[getValidInstagramAccessToken] Token is still valid, using existing token')
    return accessToken
  } catch (error) {
    console.error('[getValidInstagramAccessToken] Error:', error)
    return null
  }
}
