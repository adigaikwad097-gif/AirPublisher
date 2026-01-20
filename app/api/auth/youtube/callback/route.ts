import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { Database } from '@/lib/supabase/types'

/**
 * YouTube OAuth callback
 * Receives authorization code and exchanges for tokens
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')
    const state = searchParams.get('state')
    const error = searchParams.get('error')

    if (error) {
      return NextResponse.redirect(
        new URL(`/settings/connections?error=${encodeURIComponent(error)}`, request.url)
      )
    }

    if (!code || !state) {
      return NextResponse.redirect(
        new URL('/settings/connections?error=missing_code', request.url)
      )
    }

    // Decode state to get creator info
    let stateData: { creator_unique_identifier?: string; user_id?: string }
    try {
      stateData = JSON.parse(Buffer.from(state, 'base64url').toString())
    } catch {
      return NextResponse.redirect(
        new URL('/settings/connections?error=invalid_state', request.url)
      )
    }

    // If creator_unique_identifier is missing from state, fetch it from creator profile
    let creatorUniqueIdentifier = stateData.creator_unique_identifier
    const userId = stateData.user_id
    
    if (!creatorUniqueIdentifier && userId) {
      console.log('[youtube-callback] creator_unique_identifier not in state, fetching from creator profile...')
      const supabase = await createClient()
      const { data: profiles, error: profileError } = await supabase
        .from('creator_profiles')
        .select('unique_identifier')
        .limit(1)
        .order('created_at', { ascending: false })
      
      if (!profileError && profiles && profiles.length > 0) {
        creatorUniqueIdentifier = profiles[0].unique_identifier
        console.log('[youtube-callback] Found creator_unique_identifier from profile:', creatorUniqueIdentifier)
      }
    }

    // If still no creator_unique_identifier, try to get from getCurrentCreator
    if (!creatorUniqueIdentifier) {
      try {
        const { getCurrentCreator } = await import('@/lib/db/creator')
        const creator = await getCurrentCreator()
        if (creator) {
          creatorUniqueIdentifier = creator.unique_identifier
          console.log('[youtube-callback] Found creator_unique_identifier from getCurrentCreator:', creatorUniqueIdentifier)
        }
      } catch (e) {
        console.warn('[youtube-callback] Could not get creator from getCurrentCreator:', e)
      }
    }

    // If still no creator_unique_identifier, we can't proceed
    if (!creatorUniqueIdentifier) {
      console.error('[youtube-callback] No creator_unique_identifier found - cannot store tokens')
      return NextResponse.redirect(
        new URL('/settings/connections?error=no_creator_profile', request.url)
      )
    }

    // Update stateData with resolved creator_unique_identifier
    const resolvedStateData = {
      creator_unique_identifier: creatorUniqueIdentifier,
      user_id: userId,
    }

    const clientId = process.env.YOUTUBE_CLIENT_ID
    const clientSecret = process.env.YOUTUBE_CLIENT_SECRET
    
    // Detect base URL (support ngrok for local development)
    // Try to get from state first (if stored), otherwise detect from request
    let baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    
    // Check if request is coming through ngrok or has custom host
    const host = request.headers.get('x-forwarded-host') || request.headers.get('host')
    const protocol = request.headers.get('x-forwarded-proto') || (request.url.startsWith('https') ? 'https' : 'http')
    
    if (host && (host.includes('ngrok') || host.includes('.ngrok-free.dev'))) {
      baseUrl = `${protocol}://${host}`
      console.log('[YouTube Callback] Detected ngrok URL:', baseUrl)
    } else if (host && host !== 'localhost:3000') {
      // Custom host (production or other environment)
      baseUrl = `${protocol}://${host}`
      console.log('[YouTube Callback] Using custom host:', baseUrl)
    }
    
    const redirectUri = `${baseUrl}/api/auth/youtube/callback`
    
    console.log('[YouTube Callback] OAuth configuration:', {
      hasClientId: !!clientId,
      hasClientSecret: !!clientSecret,
      clientIdLength: clientId?.length || 0,
      redirectUri,
      baseUrl,
    })

    if (!clientId || !clientSecret) {
      console.error('[YouTube Callback] Missing OAuth credentials:', {
        hasClientId: !!clientId,
        hasClientSecret: !!clientSecret,
      })
      return NextResponse.redirect(
        new URL('/settings/connections?error=oauth_not_configured', request.url)
      )
    }

    // Exchange authorization code for tokens
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    })

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text()
      console.error('Token exchange error:', errorData)
      return NextResponse.redirect(
        new URL('/settings/connections?error=token_exchange_failed', request.url)
      )
    }

    const tokens = await tokenResponse.json()
    const {
      access_token,
      refresh_token,
      expires_in,
      scope,
    } = tokens

    if (!access_token) {
      return NextResponse.redirect(
        new URL('/settings/connections?error=no_access_token', request.url)
      )
    }

    // Get user info from YouTube to get channel ID
    const userInfoResponse = await fetch(
      'https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true',
      {
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      }
    )

    let channelId = null
    let channelTitle = null
    if (userInfoResponse.ok) {
      const userInfo = await userInfoResponse.json()
      if (userInfo.items && userInfo.items.length > 0) {
        channelId = userInfo.items[0].id
        channelTitle = userInfo.items[0].snippet?.title || null
      }
    }

    // Calculate expiration time
    const expiresAt = expires_in
      ? new Date(Date.now() + expires_in * 1000).toISOString()
      : null

    // Store tokens in database
    // Use service role for insert (bypasses RLS)
    const serviceClient = createServiceClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Try new airpublisher_youtube_tokens table first, fallback to youtube_tokens
    const creatorId = resolvedStateData.creator_unique_identifier
    
    // First try new table, fallback to old table if it doesn't exist
    let tableName = 'airpublisher_youtube_tokens'
    let useNewTable = true
    
    // Check if new table exists by trying a simple query
    const { error: tableCheckError } = await (serviceClient
      .from('airpublisher_youtube_tokens') as any)
      .select('id')
      .limit(1)
    
    if (tableCheckError && tableCheckError.code === '42P01') {
      // Table doesn't exist, use old table
      console.warn('[youtube-callback] airpublisher_youtube_tokens table not found, using youtube_tokens')
      tableName = 'youtube_tokens'
      useNewTable = false
    }
    
    // Check if tokens already exist
    const lookupField = useNewTable && creatorId ? 'creator_unique_identifier' : 'user_id'
    const lookupValue = useNewTable && creatorId ? creatorId : (resolvedStateData.user_id || 'null_user_id_dev')
    
    const { data: existing, error: lookupError } = await (serviceClient
      .from(tableName) as any)
      .select('id, user_id, creator_unique_identifier')
      .eq(lookupField, lookupValue)
      .maybeSingle()
    
    if (lookupError && lookupError.code !== 'PGRST116') {
      console.error('[youtube-callback] Error looking up existing tokens:', lookupError)
    }

    const tokenData: any = useNewTable ? {
      user_id: resolvedStateData.user_id,
      creator_unique_identifier: creatorId,
      google_access_token: access_token,
      google_refresh_token: refresh_token || null,
      token_type: 'Bearer',
      scope: scope || null,
      expires_at: expiresAt,
      handle: channelTitle,
      channel_id: channelId,
      channel_title: channelTitle,
    } : {
      user_id: resolvedStateData.user_id || null,
      google_access_token: access_token,
      google_refresh_token: refresh_token || null,
      token_type: 'Bearer',
      scope: scope || null,
      expires_at: expiresAt,
      updated_at: new Date().toISOString(),
      handle: channelTitle,
      channel_id: channelId,
      google_access_token_secret_id: null,
      google_refresh_token_secret_id: null,
    }

    if (existing) {
      // Update existing tokens
      console.log('[youtube-callback] Updating existing tokens:', { id: existing.id, tableName })
      const { error: updateError } = await (serviceClient
        .from(tableName) as any)
        .update(tokenData)
        .eq('id', existing.id)

      if (updateError) {
        console.error('[youtube-callback] Error updating YouTube tokens:', {
          error: updateError,
          code: updateError.code,
          message: updateError.message,
          details: updateError.details,
          hint: updateError.hint,
        })
        return NextResponse.redirect(
          new URL(`/settings/connections?error=update_failed&details=${encodeURIComponent(updateError.message || 'Unknown error')}`, request.url)
        )
      }
      
      console.log('[youtube-callback] ✅ Successfully updated YouTube tokens')
    } else {
      // Insert new tokens
      console.log('[youtube-callback] Inserting new tokens:', {
        tableName,
        userId: tokenData.user_id,
        creatorUniqueIdentifier: tokenData.creator_unique_identifier || 'N/A',
        hasAccessToken: !!tokenData.google_access_token,
        hasChannelId: !!tokenData.channel_id,
      })
      
      const { data: insertData, error: insertError } = await (serviceClient
        .from(tableName) as any)
        .insert(tokenData)
        .select()
        .single()

      if (insertError) {
        console.error('[youtube-callback] Error inserting YouTube tokens:', {
          error: insertError,
          code: insertError.code,
          message: insertError.message,
          details: insertError.details,
          hint: insertError.hint,
          tableName,
          tokenDataKeys: Object.keys(tokenData),
        })
        return NextResponse.redirect(
          new URL(`/settings/connections?error=insert_failed&details=${encodeURIComponent(insertError.message || 'Unknown error')}`, request.url)
        )
      }
      
      console.log('[youtube-callback] ✅ Successfully inserted YouTube tokens:', {
        id: insertData?.id,
        userId: insertData?.user_id,
        creatorId: insertData?.creator_unique_identifier,
      })
    }

    // Success! Redirect to connections page
    return NextResponse.redirect(
      new URL('/settings/connections?success=youtube_connected', request.url)
    )
  } catch (error) {
    console.error('YouTube OAuth callback error:', error)
    return NextResponse.redirect(
      new URL('/settings/connections?error=callback_error', request.url)
    )
  }
}

