import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { Database } from '@/lib/supabase/types'

/**
 * Instagram OAuth callback
 * Instagram uses Facebook OAuth, so we need to:
 * 1. Exchange code for Facebook access token
 * 2. Get Instagram Business Account ID
 * 3. Get long-lived token
 * 4. Store in instagram_tokens table
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')
    const state = searchParams.get('state')
    const error = searchParams.get('error')

    // Detect base URL for redirects (ngrok or localhost) - used for early error redirects
    const requestUrl = new URL(request.url)
    let baseUrlForRedirects = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    
    // If request is coming through ngrok, use that
    if (requestUrl.host && requestUrl.host.includes('ngrok')) {
      const protocol = requestUrl.protocol.replace(':', '') || 'https'
      baseUrlForRedirects = `${protocol}://${requestUrl.host}`
    } else {
      // Check headers for ngrok
      const forwardedHost = request.headers.get('x-forwarded-host')
      const hostHeader = request.headers.get('host')
      const forwardedProto = request.headers.get('x-forwarded-proto') || 'https'
      const detectedHost = forwardedHost || hostHeader
      if (detectedHost && detectedHost.includes('ngrok')) {
        baseUrlForRedirects = `${forwardedProto}://${detectedHost}`
      }
    }

    if (error) {
      return NextResponse.redirect(
        new URL(`/settings/connections?error=${encodeURIComponent(error)}`, baseUrlForRedirects)
      )
    }

    if (!code || !state) {
      return NextResponse.redirect(
        new URL('/settings/connections?error=missing_code', baseUrlForRedirects)
      )
    }

    // Decode state to get creator info and redirect_uri
    let stateData: { creator_unique_identifier?: string; user_id?: string; redirect_uri?: string }
    try {
      stateData = JSON.parse(Buffer.from(state, 'base64url').toString())
    } catch {
      return NextResponse.redirect(
        new URL('/settings/connections?error=invalid_state', baseUrlForRedirects)
      )
    }

    // If creator_unique_identifier is missing from state, fetch it from creator profile
    let creatorUniqueIdentifier = stateData.creator_unique_identifier
    const userId = stateData.user_id
    
    if (!creatorUniqueIdentifier && userId) {
      console.log('[instagram-callback] creator_unique_identifier not in state, fetching from creator profile...')
      const supabase = await createClient()
      const { data: profiles, error: profileError } = await supabase
        .from('creator_profiles')
        .select('unique_identifier')
        .eq('user_id', userId)
        .limit(1)
        .order('created_at', { ascending: false })
      
      if (!profileError && profiles && profiles.length > 0) {
        creatorUniqueIdentifier = (profiles[0] as { unique_identifier: string }).unique_identifier
        console.log('[instagram-callback] Found creator_unique_identifier from profile:', creatorUniqueIdentifier)
      }
    }

    // If still no creator_unique_identifier, try to get from getCurrentCreator
    if (!creatorUniqueIdentifier) {
      try {
        const { getCurrentCreator } = await import('@/lib/db/creator')
        const creator = await getCurrentCreator()
        if (creator) {
          creatorUniqueIdentifier = creator.unique_identifier
          console.log('[instagram-callback] Found creator_unique_identifier from getCurrentCreator:', creatorUniqueIdentifier)
        }
      } catch (e) {
        console.warn('[instagram-callback] Could not get creator from getCurrentCreator:', e)
      }
    }

    // If still no creator_unique_identifier, we can't proceed
    if (!creatorUniqueIdentifier) {
      console.error('[instagram-callback] No creator_unique_identifier found - cannot store tokens')
      return NextResponse.redirect(
        new URL('/settings/connections?error=no_creator_profile', baseUrlForRedirects)
      )
    }

    // Update stateData with resolved creator_unique_identifier
    const resolvedStateData = {
      creator_unique_identifier: creatorUniqueIdentifier,
      user_id: userId,
    }

    // Instagram Business Login uses Instagram App ID and Secret
    // Get from: Instagram > API setup with Instagram login > Business login settings
    // NOT from Meta App settings (those are different)
    // Hardcode all IDs/secrets as fallback since .env.local isn't loading properly
    const appId = process.env.INSTAGRAM_APP_ID || '836687999185692' || process.env.META_APP_ID || '771396602627794'
    const appSecret = process.env.INSTAGRAM_APP_SECRET || '4691b6a3b97ab0dcaec41b218e4321c1' || process.env.META_APP_SECRET || '67b086a74833746df6a0a7ed0b50f867'
    
    // Get redirect URI - use the one from state if available (ensures exact match with OAuth request)
    // Otherwise detect ngrok from request
    let redirectUri: string
    
    if (stateData.redirect_uri) {
      // Use the exact redirect URI from the OAuth request (stored in state)
      redirectUri = stateData.redirect_uri
      console.log('[instagram-callback] ✅ Using redirect URI from state (exact match):', redirectUri)
      // Extract baseUrl from redirectUri for later error redirects
      baseUrlForRedirects = redirectUri.replace('/api/auth/instagram/callback', '')
    } else {
      // Fallback: detect from request (for backward compatibility)
      const fallbackRequestUrl = new URL(request.url)
      let fallbackBaseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
      
      // If request is coming through ngrok, use that
      if (fallbackRequestUrl.host && fallbackRequestUrl.host.includes('ngrok')) {
        const protocol = fallbackRequestUrl.protocol.replace(':', '') || 'https'
        fallbackBaseUrl = `${protocol}://${fallbackRequestUrl.host}`
        console.log('[instagram-callback] ✅ Detected ngrok from request URL:', fallbackBaseUrl)
      } else {
        // Check headers for ngrok
        const forwardedHost = request.headers.get('x-forwarded-host')
        const hostHeader = request.headers.get('host')
        const forwardedProto = request.headers.get('x-forwarded-proto') || 'https'
        const detectedHost = forwardedHost || hostHeader
        if (detectedHost && detectedHost.includes('ngrok')) {
          fallbackBaseUrl = `${forwardedProto}://${detectedHost}`
          console.log('[instagram-callback] ✅ Detected ngrok from headers:', fallbackBaseUrl)
        }
      }
      
      redirectUri = `${fallbackBaseUrl}/api/auth/instagram/callback`
      baseUrlForRedirects = fallbackBaseUrl
      console.log('[instagram-callback] Using redirect URI (detected):', redirectUri)
    }

    if (!appId || !appSecret) {
      console.error('[instagram-callback] Missing Instagram App ID or Secret:', {
        hasINSTAGRAM_APP_ID: !!process.env.INSTAGRAM_APP_ID,
        hasINSTAGRAM_APP_SECRET: !!process.env.INSTAGRAM_APP_SECRET,
        hasMETA_APP_ID: !!process.env.META_APP_ID,
        hasMETA_APP_SECRET: !!process.env.META_APP_SECRET,
        hint: 'Get Instagram App ID and Secret from Meta Dashboard: Instagram > API setup with Instagram login > Business login settings',
      })
      return NextResponse.redirect(
        new URL('/settings/connections?error=oauth_not_configured', baseUrlForRedirects)
      )
    }

    // Step 1: Exchange code for short-lived access token
    // Instagram Business Login uses Instagram's own token endpoint, not Facebook's
    // See: https://developers.facebook.com/docs/instagram-platform/instagram-api-with-instagram-login/business-login
    console.log('[instagram-callback] Token exchange request:', {
      appId: appId ? `${appId.substring(0, 6)}...` : 'NOT SET',
      hasAppSecret: !!appSecret,
      redirectUri,
      codeLength: code?.length || 0,
      grantType: 'authorization_code',
    })
    
    const tokenResponse = await fetch('https://api.instagram.com/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: appId,
        client_secret: appSecret,
        grant_type: 'authorization_code',
        redirect_uri: redirectUri,
        code: code,
      }),
    })

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text()
      let errorMessage = 'Token exchange failed'
      try {
        const errorJson = JSON.parse(errorData)
        errorMessage = errorJson.error_message || errorJson.error || errorData
        console.error('[instagram-callback] Token exchange error details:', {
          status: tokenResponse.status,
          statusText: tokenResponse.statusText,
          error: errorJson,
          redirectUri: redirectUri,
          appId: appId ? `${appId.substring(0, 6)}...` : 'NOT SET',
          hasAppSecret: !!appSecret,
        })
      } catch {
        console.error('[instagram-callback] Token exchange error (raw):', errorData)
        console.error('[instagram-callback] Request details:', {
          redirectUri,
          appId: appId ? `${appId.substring(0, 6)}...` : 'NOT SET',
          hasAppSecret: !!appSecret,
          codeLength: code?.length || 0,
        })
      }
      return NextResponse.redirect(
        new URL(`/settings/connections?error=token_exchange_failed&details=${encodeURIComponent(errorMessage)}`, baseUrlForRedirects)
      )
    }

    const tokenData = await tokenResponse.json()
    
    // Instagram Business Login returns data in a different format:
    // { "data": [{ "access_token": "...", "user_id": "...", "permissions": "..." }] }
    let shortLivedToken: string | null = null
    let instagramUserId: string | null = null
    
    if (tokenData.data && Array.isArray(tokenData.data) && tokenData.data.length > 0) {
      shortLivedToken = tokenData.data[0].access_token
      instagramUserId = tokenData.data[0].user_id
    } else if (tokenData.access_token) {
      // Fallback: direct access_token (some responses might be different)
      shortLivedToken = tokenData.access_token
      instagramUserId = tokenData.user_id || null
    }

    if (!shortLivedToken) {
      console.error('Token response format:', JSON.stringify(tokenData, null, 2))
      return NextResponse.redirect(
        new URL('/settings/connections?error=no_access_token', baseUrlForRedirects)
      )
    }

    // Step 2: Exchange for long-lived token (60 days)
    // Instagram Business Login uses Instagram Graph API, not Facebook Graph API
    // See: https://developers.facebook.com/docs/instagram-platform/instagram-api-with-instagram-login/business-login
    const longLivedResponse = await fetch(
      `https://graph.instagram.com/access_token?` +
      `grant_type=ig_exchange_token&` +
      `client_secret=${appSecret}&` +
      `access_token=${shortLivedToken}`,
      { method: 'GET' }
    )

    let longLivedToken = shortLivedToken
    let expiresAt: string | null = null

    if (longLivedResponse.ok) {
      const longLivedData = await longLivedResponse.json()
      longLivedToken = longLivedData.access_token || shortLivedToken
      if (longLivedData.expires_in) {
        expiresAt = new Date(Date.now() + longLivedData.expires_in * 1000).toISOString()
      }
    } else {
      console.warn('Failed to get long-lived token, using short-lived token:', await longLivedResponse.text())
    }

    // Step 3: Get Instagram account info
    // Instagram Business Login provides user_id directly in token response
    // Use Instagram Graph API to get account details
    let instagramBusinessAccountId = instagramUserId // Instagram-scoped user ID from token
    let username = null

    if (instagramBusinessAccountId) {
      // Get Instagram account details using Instagram Graph API
      // Note: Instagram Business Login uses Instagram Graph API, not Facebook Graph API
      const igInfoResponse = await fetch(
        `https://graph.instagram.com/${instagramBusinessAccountId}?` +
        `fields=username,account_type&` +
        `access_token=${longLivedToken}`
      )
      
      if (igInfoResponse.ok) {
        const igInfo = await igInfoResponse.json()
        username = igInfo.username || null
        console.log('[instagram-callback] Instagram account info:', igInfo)
      } else {
        const errorText = await igInfoResponse.text()
        console.warn('[instagram-callback] Failed to get Instagram account info:', errorText)
      }
    }

    // Step 4: Store tokens in database
    const serviceClient = createServiceClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Try new airpublisher_instagram_tokens table first, fallback to instagram_tokens
    let useNewTable = true
    let tableName = 'airpublisher_instagram_tokens'
    let lookupField = 'creator_unique_identifier'

    // Check if new table exists by trying to query it
    const { error: tableCheckError } = await (serviceClient
      .from('airpublisher_instagram_tokens') as any)
      .select('id')
      .limit(1)
    
    if (tableCheckError && tableCheckError.code === '42P01') {
      // Table doesn't exist, use old table
      useNewTable = false
      tableName = 'instagram_tokens'
      lookupField = 'user_id'
      console.log('[instagram-callback] New table not found, using old instagram_tokens table')
    }

    // Prepare token record based on which table we're using
    let tokenRecord: any = {}
    
    if (useNewTable) {
      // New table structure (airpublisher_instagram_tokens)
      // Note: facebook_access_token is required (NOT NULL), so we use longLivedToken there
      tokenRecord = {
        user_id: resolvedStateData.user_id || null,
        creator_unique_identifier: resolvedStateData.creator_unique_identifier,
        facebook_access_token: longLivedToken, // Required field - Instagram Business Login uses this token
        instagram_access_token: longLivedToken, // Also store in instagram_access_token
        instagram_id: instagramBusinessAccountId || 'pending',
        username: username,
        token_type: 'Bearer',
        expires_at: expiresAt,
        account_type: 'BUSINESS', // Instagram Business Login
      }
    } else {
      // Old table structure (no creator_unique_identifier)
      tokenRecord = {
        user_id: resolvedStateData.user_id || null,
        instagram_id: instagramBusinessAccountId || 'pending',
        access_token: longLivedToken,
        username: username,
        updated_at: new Date().toISOString(),
        expires_at: expiresAt,
        instagram_business_account_id: instagramBusinessAccountId,
        page_id: null,
      }
    }

    // Check if record exists
    const { data: existing } = await (serviceClient
      .from(tableName) as any)
      .select('id')
      .eq(lookupField, useNewTable ? resolvedStateData.creator_unique_identifier : (resolvedStateData.user_id || 'null_user_id_dev'))
      .maybeSingle()

    if (existing) {
      // Update existing record
      const { error: updateError } = await (serviceClient
        .from(tableName) as any)
        .update(tokenRecord)
        .eq(lookupField, useNewTable ? resolvedStateData.creator_unique_identifier : (resolvedStateData.user_id || 'null_user_id_dev'))

      if (updateError) {
        console.error(`Error updating Instagram tokens in ${tableName}:`, updateError)
        console.error('Token record keys:', Object.keys(tokenRecord))
        return NextResponse.redirect(
          new URL('/settings/connections?error=update_failed', baseUrlForRedirects)
        )
      }
    } else {
      // Insert new record
      const { error: insertError } = await (serviceClient
        .from(tableName) as any)
        .insert(tokenRecord)

      if (insertError) {
        console.error(`Error inserting Instagram tokens into ${tableName}:`, insertError)
        console.error('Error details:', {
          code: insertError.code,
          message: insertError.message,
          hint: insertError.hint,
          table: tableName,
          tokenRecordKeys: Object.keys(tokenRecord),
        })
        return NextResponse.redirect(
          new URL('/settings/connections?error=insert_failed', baseUrlForRedirects)
        )
      }
    }

    console.log(`✅ Successfully stored Instagram tokens in ${tableName}`)

    return NextResponse.redirect(
      new URL('/settings/connections?success=instagram_connected', baseUrlForRedirects)
    )
  } catch (error) {
    console.error('Instagram OAuth callback error:', error)
    // Get baseUrl again in catch block
    const catchRequestUrl = new URL(request.url)
    let catchBaseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    if (catchRequestUrl.host && catchRequestUrl.host.includes('ngrok')) {
      const protocol = catchRequestUrl.protocol.replace(':', '') || 'https'
      catchBaseUrl = `${protocol}://${catchRequestUrl.host}`
    }
    return NextResponse.redirect(
      new URL('/settings/connections?error=callback_error', catchBaseUrl)
    )
  }
}

