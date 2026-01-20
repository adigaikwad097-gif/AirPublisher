import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { Database } from '@/lib/supabase/types'
import { getBufferProfiles } from '@/lib/buffer/api'

/**
 * Buffer OAuth callback
 * Much simpler than individual platform callbacks!
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

    const clientId = process.env.BUFFER_CLIENT_ID
    const clientSecret = process.env.BUFFER_CLIENT_SECRET
    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/auth/buffer/callback`

    if (!clientId || !clientSecret) {
      return NextResponse.redirect(
        new URL('/settings/connections?error=oauth_not_configured', request.url)
      )
    }

    // Exchange authorization code for access token
    const tokenResponse = await fetch('https://api.bufferapp.com/1/oauth2/token.json', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: clientId,
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

    const tokenData = await tokenResponse.json()
    const { access_token } = tokenData

    if (!access_token) {
      return NextResponse.redirect(
        new URL('/settings/connections?error=no_access_token', request.url)
      )
    }

    // Get user's Buffer profiles (connected social accounts)
    let profiles: any[] = []
    try {
      profiles = await getBufferProfiles(access_token)
    } catch (e) {
      console.error('Error fetching Buffer profiles:', e)
      // Continue anyway - we'll store the token
    }

    // Store token in database
    const serviceClient = createServiceClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Check if token already exists
    const { data: existing } = await serviceClient
      .from('buffer_tokens')
      .select('user_id')
      .eq('user_id', stateData.user_id)
      .maybeSingle()

    const tokenRecord = {
      user_id: stateData.user_id,
      creator_unique_identifier: stateData.creator_unique_identifier,
      access_token: access_token,
      profiles: JSON.stringify(profiles), // Store connected profiles
      updated_at: new Date().toISOString(),
    } as Record<string, any>

    if (existing) {
      const { error: updateError } = await serviceClient
        .from('buffer_tokens')
        .update(tokenRecord)
        .eq('user_id', stateData.user_id)

      if (updateError) {
        console.error('Error updating Buffer tokens:', updateError)
        return NextResponse.redirect(
          new URL('/settings/connections?error=update_failed', request.url)
        )
      }
    } else {
      tokenRecord.created_at = new Date().toISOString()
      const { error: insertError } = await serviceClient
        .from('buffer_tokens')
        .insert(tokenRecord)

      if (insertError) {
        console.error('Error inserting Buffer tokens:', insertError)
        return NextResponse.redirect(
          new URL('/settings/connections?error=insert_failed', request.url)
        )
      }
    }

    // Success! Redirect to connections page
    return NextResponse.redirect(
      new URL('/settings/connections?success=buffer_connected', request.url)
    )
  } catch (error) {
    console.error('Buffer OAuth callback error:', error)
    return NextResponse.redirect(
      new URL('/settings/connections?error=callback_error', request.url)
    )
  }
}


