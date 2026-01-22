import { NextResponse } from 'next/server'

// Force dynamic rendering - this route uses request.url
export const dynamic = 'force-dynamic'

/**
 * Handle Dropbox OAuth callback
 */
export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const code = url.searchParams.get('code')
    const state = url.searchParams.get('state')
    const error = url.searchParams.get('error')

    if (error) {
      console.error('[dropbox-callback] OAuth error:', error)
      return NextResponse.redirect(
        new URL(`/settings/connections?error=dropbox_oauth_${error}`, request.url)
      )
    }

    if (!code || !state) {
      return NextResponse.redirect(
        new URL('/settings/connections?error=missing_code_or_state', request.url)
      )
    }

    // Decode state
    let stateData: { redirect_uri: string; user_id?: string }
    try {
      stateData = JSON.parse(Buffer.from(state, 'base64').toString())
    } catch (e) {
      console.error('[dropbox-callback] Failed to decode state:', e)
      return NextResponse.redirect(
        new URL('/settings/connections?error=invalid_state', request.url)
      )
    }

    const clientId = process.env.DROPBOX_CLIENT_ID
    const clientSecret = process.env.DROPBOX_CLIENT_SECRET
    const redirectUri = stateData.redirect_uri

    if (!clientId || !clientSecret) {
      return NextResponse.redirect(
        new URL('/settings/connections?error=dropbox_not_configured', request.url)
      )
    }

    // Exchange code for tokens
    const tokenResponse = await fetch('https://api.dropbox.com/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        code,
        grant_type: 'authorization_code',
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
      }),
    })

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text()
      console.error('[dropbox-callback] Token exchange error:', errorText)
      return NextResponse.redirect(
        new URL('/settings/connections?error=token_exchange_failed', request.url)
      )
    }

    const tokens = await tokenResponse.json()
    const {
      access_token,
      refresh_token,
      expires_in,
    } = tokens

    if (!access_token) {
      return NextResponse.redirect(
        new URL('/settings/connections?error=no_access_token', request.url)
      )
    }

    // Note: Tokens are not stored in database anymore
    // Dropbox uploads are handled by n8n, which manages its own Dropbox connection
    // This callback route is kept for backwards compatibility but tokens are not persisted
    console.log('[dropbox-callback] ✅ OAuth completed (tokens not stored - using n8n for uploads)')

    return NextResponse.redirect(
      new URL('/settings/connections?success=dropbox_connected', request.url)
    )
  } catch (error: any) {
    console.error('[dropbox-callback] Error:', error)
    return NextResponse.redirect(
      new URL('/settings/connections?error=dropbox_callback_failed', request.url)
    )
  }
}

