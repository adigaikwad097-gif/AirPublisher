import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { Database } from '@/lib/supabase/types'
import { getAppUrl } from '@/lib/utils/app-url'

/**
 * TikTok OAuth callback
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')
    const state = searchParams.get('state')
    const error = searchParams.get('error')

    // Use getAppUrl() utility which properly detects Vercel, ngrok, or localhost
    const baseUrlForRedirects = getAppUrl()

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

    // Decode state (now includes redirect_uri and code_verifier for PKCE)
    let stateData: { creator_unique_identifier?: string; user_id?: string; redirect_uri?: string; code_verifier?: string }
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
      console.log('[tiktok-callback] creator_unique_identifier not in state, fetching from creator profile...')
      const supabase = await createClient()
      const { data: profiles, error: profileError } = await supabase
        .from('creator_profiles')
        .select('unique_identifier')
        .eq('user_id', userId)
        .limit(1)
        .order('created_at', { ascending: false })
      
      if (!profileError && profiles && profiles.length > 0) {
        creatorUniqueIdentifier = (profiles[0] as { unique_identifier: string }).unique_identifier
        console.log('[tiktok-callback] Found creator_unique_identifier from profile:', creatorUniqueIdentifier)
      }
    }

    // If still no creator_unique_identifier, try to get from getCurrentCreator
    if (!creatorUniqueIdentifier) {
      try {
        const { getCurrentCreator } = await import('@/lib/db/creator')
        const creator = await getCurrentCreator()
        if (creator) {
          creatorUniqueIdentifier = creator.unique_identifier
          console.log('[tiktok-callback] Found creator_unique_identifier from getCurrentCreator:', creatorUniqueIdentifier)
        }
      } catch (e) {
        console.warn('[tiktok-callback] Could not get creator from getCurrentCreator:', e)
      }
    }

    // If still no creator_unique_identifier, we can't proceed
    if (!creatorUniqueIdentifier) {
      console.error('[tiktok-callback] No creator_unique_identifier found - cannot store tokens')
      return NextResponse.redirect(
        new URL('/settings/connections?error=no_creator_profile', baseUrlForRedirects)
      )
    }

    // Update stateData with resolved creator_unique_identifier
    const resolvedStateData = {
      creator_unique_identifier: creatorUniqueIdentifier,
      user_id: userId,
    }

    // Hardcode TikTok Client Key/Secret as fallback since .env.local isn't loading properly
    const clientKey = process.env.TIKTOK_CLIENT_KEY || 'sbawzz3li4gtvlwp9u'
    const clientSecret = process.env.TIKTOK_CLIENT_SECRET || 'RCBgpobN8bwmMBwbk56aY21nBYdxJECN'
    
    // Get redirect URI - use the one from state if available (ensures exact match with OAuth request)
    // Otherwise use getAppUrl() utility
    const baseUrlForTokenExchange = getAppUrl().replace(/\/$/, '')
    const redirectUri = stateData.redirect_uri || `${baseUrlForTokenExchange}/api/auth/tiktok/callback`
    
    console.log('[tiktok-callback] Environment check:', {
      VERCEL_URL: process.env.VERCEL_URL || 'NOT SET',
      NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'NOT SET',
    })
    console.log('[tiktok-callback] Redirect URI from state:', stateData.redirect_uri || 'NOT IN STATE')
    console.log('[tiktok-callback] Base URL for token exchange:', baseUrlForTokenExchange)
    console.log('[tiktok-callback] Final redirect URI being used:', redirectUri)
    console.log('[tiktok-callback] Redirect URI length:', redirectUri.length)

    // Note: We're using hardcoded fallbacks, so we should always have credentials
    if (!clientKey || !clientSecret) {
      console.error('[tiktok-callback] Missing TikTok credentials (even fallback values)')
      return NextResponse.redirect(
        new URL('/settings/connections?error=oauth_not_configured', baseUrlForRedirects)
      )
    }
    
    // Log which credentials are being used
    if (process.env.TIKTOK_CLIENT_KEY && process.env.TIKTOK_CLIENT_SECRET) {
      console.log('[tiktok-callback] Using TikTok credentials from environment variables')
    } else {
      console.log('[tiktok-callback] Using hardcoded TikTok credentials fallback')
    }

    // Exchange code for tokens (with PKCE if available)
    const tokenParams: Record<string, string> = {
      client_key: clientKey,
      client_secret: clientSecret,
      code,
      grant_type: 'authorization_code',
      redirect_uri: redirectUri,
    }
    
    // Add code_verifier if PKCE was used (required by TikTok)
    if (stateData.code_verifier) {
      tokenParams.code_verifier = stateData.code_verifier
      console.log('[tiktok-callback] Using PKCE (code_verifier from state)')
    } else {
      console.warn('[tiktok-callback] No code_verifier in state - PKCE may fail')
    }
    
    const tokenResponse = await fetch('https://open.tiktokapis.com/v2/oauth/token/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams(tokenParams),
    })

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text()
      console.error('[tiktok-callback] Token exchange error:', errorData)
      return NextResponse.redirect(
        new URL('/settings/connections?error=token_exchange_failed', baseUrlForRedirects)
      )
    }

    const tokens = await tokenResponse.json()
    const {
      access_token,
      refresh_token,
      expires_in,
      scope,
      open_id,
    } = tokens.data || tokens

    if (!access_token) {
      return NextResponse.redirect(
        new URL('/settings/connections?error=no_access_token', baseUrlForRedirects)
      )
    }

    // Get user info
    let displayName = null
    try {
      const userInfoResponse = await fetch(
        'https://open.tiktokapis.com/v2/user/info/?fields=open_id,union_id,avatar_url,union_id,display_name,is_verified',
        {
          headers: {
            Authorization: `Bearer ${access_token}`,
          },
        }
      )
      if (userInfoResponse.ok) {
        const userInfo = await userInfoResponse.json()
        displayName = userInfo.data?.user?.display_name || null
      }
    } catch (e) {
      console.warn('Could not fetch TikTok user info:', e)
    }

    // Calculate expiration
    const expiresAt = expires_in
      ? new Date(Date.now() + expires_in * 1000).toISOString()
      : null

    // Store tokens in database
    const serviceClient = createServiceClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Try new airpublisher_tiktok_tokens table first, fallback to tiktok_tokens
    let useNewTable = true
    let tableName = 'airpublisher_tiktok_tokens'
    let lookupField = 'creator_unique_identifier'

    // Check if new table exists by trying to query it
    const { error: tableCheckError } = await (serviceClient
      .from('airpublisher_tiktok_tokens') as any)
      .select('id')
      .limit(1)
    
    if (tableCheckError && tableCheckError.code === '42P01') {
      // Table doesn't exist, use old table
      useNewTable = false
      tableName = 'tiktok_tokens'
      lookupField = 'user_id'
      console.log('[tiktok-callback] New table not found, using old tiktok_tokens table')
    }

    // Prepare token record based on which table we're using
    let tokenRecord: any = {}
    
    if (useNewTable) {
      // New table structure (airpublisher_tiktok_tokens)
      tokenRecord = {
        user_id: resolvedStateData.user_id || null,
        creator_unique_identifier: resolvedStateData.creator_unique_identifier,
        tiktok_access_token: access_token,
        tiktok_refresh_token: refresh_token || null,
        token_type: 'Bearer',
        scope: scope || null,
        expires_at: expiresAt,
        tiktok_open_id: open_id || null,
        display_name: displayName,
      }
    } else {
      // Old table structure (no creator_unique_identifier)
      tokenRecord = {
        user_id: resolvedStateData.user_id || null,
        creator_unique_identifier: resolvedStateData.creator_unique_identifier || null,
        tiktok_open_id: open_id || null,
        access_token: access_token,
        refresh_token: refresh_token || null,
        display_name: displayName,
        updated_at: new Date().toISOString(),
        expires_at: expiresAt,
        handle: displayName,
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
        console.error(`Error updating TikTok tokens in ${tableName}:`, updateError)
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
        console.error(`Error inserting TikTok tokens into ${tableName}:`, insertError)
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

    console.log(`✅ Successfully stored TikTok tokens in ${tableName}`)

    return NextResponse.redirect(
      new URL('/settings/connections?success=tiktok_connected', baseUrlForRedirects)
    )
  } catch (error) {
    console.error('TikTok OAuth callback error:', error)
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

