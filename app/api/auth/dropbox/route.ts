import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Force dynamic rendering - this route uses cookies and request.url
export const dynamic = 'force-dynamic'

/**
 * Initiate Dropbox OAuth flow (company-wide connection)
 * Only needs to be done once by an admin
 */
export async function GET(request: Request) {
  try {
    // Check if user is authenticated (but don't require creator profile)
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.redirect(
        new URL('/login?error=not_authenticated', request.url)
      )
    }

    const clientId = process.env.DROPBOX_CLIENT_ID
    const redirectUri = process.env.DROPBOX_REDIRECT_URI || 
      `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/auth/dropbox/callback`

    if (!clientId) {
      return NextResponse.redirect(
        new URL('/settings/connections?error=dropbox_not_configured', request.url)
      )
    }

    // Detect ngrok or production URL
    const url = new URL(request.url)
    const host = request.headers.get('x-forwarded-host') || 
                 request.headers.get('host') || 
                 url.host
    
    const protocol = request.headers.get('x-forwarded-proto') || 
                    (host.includes('ngrok') ? 'https' : url.protocol.slice(0, -1)) ||
                    'http'
    
    const baseUrl = `${protocol}://${host}`
    const finalRedirectUri = redirectUri.includes('localhost') && !host.includes('localhost')
      ? `${baseUrl}/api/auth/dropbox/callback`
      : redirectUri

    // Generate state (company-wide connection, no creator-specific data needed)
    const state = Buffer.from(JSON.stringify({
      redirect_uri: finalRedirectUri,
      user_id: user.id,
    })).toString('base64')

    // Dropbox OAuth URL
    const authUrl = new URL('https://www.dropbox.com/oauth2/authorize')
    authUrl.searchParams.set('client_id', clientId)
    authUrl.searchParams.set('redirect_uri', finalRedirectUri)
    authUrl.searchParams.set('response_type', 'code')
    authUrl.searchParams.set('token_access_type', 'offline') // Get refresh token
    authUrl.searchParams.set('scope', 'files.content.write files.content.read files.metadata.write files.metadata.read sharing.write')
    authUrl.searchParams.set('state', state)

    console.log('[dropbox-auth] Redirecting to Dropbox OAuth (company account):', {
      authUrl: authUrl.toString(),
      redirectUri: finalRedirectUri,
      userId: user.id,
    })

    return NextResponse.redirect(authUrl.toString())
  } catch (error: any) {
    console.error('[dropbox-auth] Error:', error)
    return NextResponse.redirect(
      new URL('/settings/connections?error=oauth_failed', request.url)
    )
  }
}

