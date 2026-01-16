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
    let stateData: { creator_unique_identifier: string; user_id: string }
    try {
      stateData = JSON.parse(Buffer.from(state, 'base64url').toString())
    } catch {
      return NextResponse.redirect(
        new URL('/settings/connections?error=invalid_state', request.url)
      )
    }

    const clientId = process.env.YOUTUBE_CLIENT_ID
    const clientSecret = process.env.YOUTUBE_CLIENT_SECRET
    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/auth/youtube/callback`

    if (!clientId || !clientSecret) {
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

    // Check if tokens already exist for this creator
    const { data: existing } = await serviceClient
      .from('youtube_tokens')
      .select('user_id')
      .eq('user_id', stateData.user_id)
      .maybeSingle()

    const tokenData: any = {
      user_id: stateData.user_id,
      creator_unique_identifier: stateData.creator_unique_identifier, // Store for easier lookup
      google_access_token: access_token,
      google_refresh_token: refresh_token || null,
      token_type: 'Bearer',
      scope: scope || null,
      expires_at: expiresAt,
      updated_at: new Date().toISOString(),
      handle: channelTitle,
      channel_id: channelId,
    }

    if (existing) {
      // Update existing tokens
      const { error: updateError } = await serviceClient
        .from('youtube_tokens')
        .update(tokenData)
        .eq('user_id', stateData.user_id)

      if (updateError) {
        console.error('Error updating YouTube tokens:', updateError)
        return NextResponse.redirect(
          new URL('/settings/connections?error=update_failed', request.url)
        )
      }
    } else {
      // Insert new tokens
      const { error: insertError } = await serviceClient
        .from('youtube_tokens')
        .insert(tokenData)

      if (insertError) {
        console.error('Error inserting YouTube tokens:', insertError)
        return NextResponse.redirect(
          new URL('/settings/connections?error=insert_failed', request.url)
        )
      }
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

