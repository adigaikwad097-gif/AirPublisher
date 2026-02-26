// Supabase Edge Function to refresh platform tokens
// This function can be called from database functions or directly

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  // Log that the function was called
  console.log('[refresh-token] Edge Function called', {
    method: req.method,
    url: req.url,
    timestamp: new Date().toISOString(),
  })

  try {
    // Allow calls from same Supabase project without explicit auth
    // This allows database functions to call via pg_net
    // The Edge Function will use its own SUPABASE_SERVICE_ROLE_KEY from environment

    const body = await req.json()
    console.log('[refresh-token] Request body:', body)

    const { platform, creator_unique_identifier } = body

    if (!platform || !creator_unique_identifier) {
      console.error('[refresh-token] Missing required fields:', { platform, creator_unique_identifier })
      return new Response(
        JSON.stringify({ error: 'Missing platform or creator_unique_identifier' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('[refresh-token] Processing token refresh:', { platform, creator_unique_identifier })

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get tokens from database - using shared tables now
    const tokenTable = `${platform}_tokens`
    const { data: tokens, error: tokenError } = await supabase
      .from(tokenTable)
      .select('*')
      .eq('creator_unique_identifier', creator_unique_identifier)
      .maybeSingle()

    if (tokenError || !tokens) {
      console.error('[refresh-token] No tokens found:', { tokenError, hasTokens: !!tokens })
      return new Response(
        JSON.stringify({ error: 'Tokens not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('[refresh-token] Found tokens, starting refresh for:', platform)

    let newAccessToken: string | null = null
    let newExpiresAt: string | null = null

    if (platform === 'youtube') {
      let refreshToken = tokens.google_refresh_token || tokens.refresh_token
      if (!refreshToken && tokens.google_refresh_token_secret_id) {
        const { data: decRefresh } = await supabase.rpc('get_decrypted_secret', {
          p_secret_id: tokens.google_refresh_token_secret_id
        })
        if (decRefresh) refreshToken = decRefresh
      }

      if (!refreshToken) {
        return new Response(
          JSON.stringify({ error: 'No refresh token available' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Refresh YouTube token
      const clientId = Deno.env.get('GOOGLE_CLIENT_ID_ALYAN') || Deno.env.get('GOOGLE_CLIENT_ID')!
      const clientSecret = Deno.env.get('GOOGLE_CLIENT_SECRET_ALYAN') || Deno.env.get('GOOGLE_CLIENT_SECRET')!

      const response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: clientId,
          client_secret: clientSecret,
          refresh_token: refreshToken,
          grant_type: 'refresh_token',
        }),
      })

      if (!response.ok) {
        const error = await response.text()
        return new Response(
          JSON.stringify({ error: 'Token refresh failed', details: error }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const data = await response.json()
      newAccessToken = data.access_token
      const expiresIn = data.expires_in || 3600
      newExpiresAt = new Date(Date.now() + expiresIn * 1000).toISOString()

      // Update database
      const updateData: any = {
        expires_at: newExpiresAt,
        updated_at: new Date().toISOString(),
      }

      let hasNewSecret = false
      if (tokens.google_access_token_secret_id) {
        const { data: updated } = await supabase.rpc('update_vault_secret', {
          p_secret_id: tokens.google_access_token_secret_id,
          p_new_secret: newAccessToken
        })
        if (updated) hasNewSecret = true
      } else if (tokens.user_id) {
        const { data: secretId } = await supabase.rpc('create_vault_secret', {
          p_secret: newAccessToken,
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
        updateData.google_access_token = newAccessToken
      }

      await supabase
        .from(tokenTable)
        .update(updateData)
        .eq('creator_unique_identifier', creator_unique_identifier)

    } else if (platform === 'instagram') {
      let accessToken = tokens.facebook_access_token || tokens.instagram_access_token || tokens.access_token
      if (!accessToken && tokens.access_token_secret_id) {
        const { data: decAccess } = await supabase.rpc('get_decrypted_secret', {
          p_secret_id: tokens.access_token_secret_id
        })
        if (decAccess) accessToken = decAccess
      }

      if (!accessToken) {
        return new Response(
          JSON.stringify({ error: 'No access token available' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Refresh Instagram token using Graph API
      const appId = Deno.env.get('INSTAGRAM_APP_ID_ALYAN') || Deno.env.get('META_APP_ID_ALYAN') || Deno.env.get('INSTAGRAM_APP_ID') || Deno.env.get('META_APP_ID')
      const appSecret = Deno.env.get('INSTAGRAM_APP_SECRET_ALYAN') || Deno.env.get('META_APP_SECRET_ALYAN') || Deno.env.get('INSTAGRAM_APP_SECRET') || Deno.env.get('META_APP_SECRET')

      if (!appId || !appSecret) {
        return new Response(
          JSON.stringify({ error: 'Instagram App ID or Secret not configured' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const response = await fetch(
        `https://graph.instagram.com/refresh_access_token?` +
        `grant_type=ig_refresh_token&` +
        `access_token=${accessToken}`,
        { method: 'GET' }
      )

      if (!response.ok) {
        const error = await response.text()
        return new Response(
          JSON.stringify({ error: 'Token refresh failed', details: error }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const data = await response.json()
      newAccessToken = data.access_token
      const expiresIn = data.expires_in || 5184000
      newExpiresAt = new Date(Date.now() + expiresIn * 1000).toISOString()

      // Update database
      const updateData: any = {
        expires_at: newExpiresAt,
        updated_at: new Date().toISOString(),
      }

      let hasNewSecret = false
      if (tokens.access_token_secret_id) {
        const { data: updated } = await supabase.rpc('update_vault_secret', {
          p_secret_id: tokens.access_token_secret_id,
          p_new_secret: newAccessToken
        })
        if (updated) hasNewSecret = true
      } else if (tokens.user_id) {
        const { data: secretId } = await supabase.rpc('create_vault_secret', {
          p_secret: newAccessToken,
          p_name: `instagram_access_${tokens.user_id}`
        })
        if (secretId) {
          updateData.access_token_secret_id = secretId
          hasNewSecret = true
        }
      }

      if (hasNewSecret) {
        updateData.facebook_access_token = null
        updateData.instagram_access_token = null
        updateData.access_token = null
      } else {
        updateData.facebook_access_token = newAccessToken
        updateData.instagram_access_token = newAccessToken
        updateData.access_token = newAccessToken
      }

      await supabase
        .from(tokenTable)
        .update(updateData)
        .eq('creator_unique_identifier', creator_unique_identifier)

    } else if (platform === 'tiktok') {
      let refreshToken = tokens.tiktok_refresh_token || tokens.refresh_token
      if (!refreshToken && tokens.tiktok_refresh_token_secret_id) {
        const { data: decRefresh } = await supabase.rpc('get_decrypted_secret', {
          p_secret_id: tokens.tiktok_refresh_token_secret_id
        })
        if (decRefresh) refreshToken = decRefresh
      }

      if (!refreshToken) {
        // If no refresh token, return existing token
        let accessToken = tokens.tiktok_access_token || tokens.access_token
        if (!accessToken && tokens.tiktok_access_token_secret_id) {
          const { data: decAccess } = await supabase.rpc('get_decrypted_secret', {
            p_secret_id: tokens.tiktok_access_token_secret_id
          })
          if (decAccess) accessToken = decAccess
        }
        newAccessToken = accessToken
        newExpiresAt = tokens.expires_at
      } else {
        // Refresh TikTok token
        const clientKey = Deno.env.get('TIKTOK_CLIENT_KEY_ALYAN') || Deno.env.get('TIKTOK_CLIENT_KEY')!
        const clientSecret = Deno.env.get('TIKTOK_CLIENT_SECRET_ALYAN') || Deno.env.get('TIKTOK_CLIENT_SECRET')!

        if (!clientKey || !clientSecret) {
          return new Response(
            JSON.stringify({ error: 'TikTok Client Key or Secret not configured' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        // TikTok token refresh endpoint
        const response = await fetch('https://open.tiktokapis.com/v2/oauth/token/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            client_key: clientKey,
            client_secret: clientSecret,
            grant_type: 'refresh_token',
            refresh_token: refreshToken,
          }),
        })

        if (!response.ok) {
          const error = await response.text()
          return new Response(
            JSON.stringify({ error: 'TikTok token refresh failed', details: error }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        const data = await response.json()
        newAccessToken = data.access_token
        const expiresIn = data.expires_in || 86400 // Default to 24 hours
        newExpiresAt = new Date(Date.now() + expiresIn * 1000).toISOString()
        const newRefreshToken = data.refresh_token || refreshToken

        // Update database
        const updateData: any = {
          expires_at: newExpiresAt,
          updated_at: new Date().toISOString(),
        }

        let hasNewAccessSecret = false
        if (tokens.tiktok_access_token_secret_id) {
          const { data: updated } = await supabase.rpc('update_vault_secret', {
            p_secret_id: tokens.tiktok_access_token_secret_id,
            p_new_secret: newAccessToken
          })
          if (updated) hasNewAccessSecret = true
        } else if (tokens.user_id) {
          const { data: secretId } = await supabase.rpc('create_vault_secret', {
            p_secret: newAccessToken,
            p_name: `tiktok_access_${tokens.user_id}`
          })
          if (secretId) {
            updateData.tiktok_access_token_secret_id = secretId
            hasNewAccessSecret = true
          }
        }

        if (hasNewAccessSecret) {
          updateData.tiktok_access_token = null
          updateData.access_token = null
        } else {
          updateData.tiktok_access_token = newAccessToken
        }

        let hasNewRefreshSecret = false
        if (tokens.tiktok_refresh_token_secret_id) {
          const { data: updated } = await supabase.rpc('update_vault_secret', {
            p_secret_id: tokens.tiktok_refresh_token_secret_id,
            p_new_secret: newRefreshToken
          })
          if (updated) hasNewRefreshSecret = true
        } else if (tokens.user_id) {
          const { data: secretId } = await supabase.rpc('create_vault_secret', {
            p_secret: newRefreshToken,
            p_name: `tiktok_refresh_${tokens.user_id}`
          })
          if (secretId) {
            updateData.tiktok_refresh_token_secret_id = secretId
            hasNewRefreshSecret = true
          }
        }

        if (hasNewRefreshSecret) {
          updateData.tiktok_refresh_token = null
          updateData.refresh_token = null
        } else {
          updateData.tiktok_refresh_token = newRefreshToken
        }

        await supabase
          .from(tokenTable)
          .update(updateData)
          .eq('creator_unique_identifier', creator_unique_identifier)
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        access_token: newAccessToken,
        expires_at: newExpiresAt,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})


