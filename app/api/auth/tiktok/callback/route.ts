import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { Database } from '@/lib/supabase/types'

/**
 * TikTok OAuth callback
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

    // Decode state
    let stateData: { creator_unique_identifier: string; user_id: string }
    try {
      stateData = JSON.parse(Buffer.from(state, 'base64url').toString())
    } catch {
      return NextResponse.redirect(
        new URL('/settings/connections?error=invalid_state', request.url)
      )
    }

    const clientKey = process.env.TIKTOK_CLIENT_KEY
    const clientSecret = process.env.TIKTOK_CLIENT_SECRET
    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/auth/tiktok/callback`

    if (!clientKey || !clientSecret) {
      return NextResponse.redirect(
        new URL('/settings/connections?error=oauth_not_configured', request.url)
      )
    }

    // Exchange code for tokens
    const tokenResponse = await fetch('https://open.tiktokapis.com/v2/oauth/token/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_key: clientKey,
        client_secret: clientSecret,
        code,
        grant_type: 'authorization_code',
        redirect_uri: redirectUri,
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
      open_id,
    } = tokens.data || tokens

    if (!access_token) {
      return NextResponse.redirect(
        new URL('/settings/connections?error=no_access_token', request.url)
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

    // Store tokens
    const serviceClient = createServiceClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data: existing } = await serviceClient
      .from('tiktok_tokens')
      .select('user_id')
      .eq('user_id', stateData.user_id)
      .maybeSingle()

    const tokenRecord: any = {
      user_id: stateData.user_id,
      creator_unique_identifier: stateData.creator_unique_identifier, // Store for easier lookup
      tiktok_open_id: open_id || null,
      access_token: access_token,
      refresh_token: refresh_token || null,
      display_name: displayName,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      expires_at: expiresAt,
      handle: displayName, // TikTok doesn't have separate handle
    }

    if (existing) {
      const { error: updateError } = await serviceClient
        .from('tiktok_tokens')
        .update(tokenRecord)
        .eq('user_id', stateData.user_id)

      if (updateError) {
        console.error('Error updating TikTok tokens:', updateError)
        return NextResponse.redirect(
          new URL('/settings/connections?error=update_failed', request.url)
        )
      }
    } else {
      const { error: insertError } = await serviceClient
        .from('tiktok_tokens')
        .insert(tokenRecord)

      if (insertError) {
        console.error('Error inserting TikTok tokens:', insertError)
        return NextResponse.redirect(
          new URL('/settings/connections?error=insert_failed', request.url)
        )
      }
    }

    return NextResponse.redirect(
      new URL('/settings/connections?success=tiktok_connected', request.url)
    )
  } catch (error) {
    console.error('TikTok OAuth callback error:', error)
    return NextResponse.redirect(
      new URL('/settings/connections?error=callback_error', request.url)
    )
  }
}

