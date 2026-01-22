import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCurrentCreator } from '@/lib/db/creator'

// Force dynamic rendering - this route uses cookies and request.url
export const dynamic = 'force-dynamic'

/**
 * Initiate Buffer OAuth flow
 * This is much simpler than individual platform OAuth!
 */
export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.redirect(new URL('/login', request.url))
    }

    // Get creator profile
    const creator = await getCurrentCreator()

    if (!creator) {
      return NextResponse.redirect(new URL('/setup', request.url))
    }

    const clientId = process.env.BUFFER_CLIENT_ID
    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/auth/buffer/callback`
    
    if (!clientId) {
      return NextResponse.json(
        { error: 'Buffer OAuth not configured. Please set BUFFER_CLIENT_ID in environment variables.' },
        { status: 500 }
      )
    }

    // Generate state parameter for security
    const state = Buffer.from(JSON.stringify({
      creator_unique_identifier: creator.unique_identifier,
      user_id: user.id,
    })).toString('base64url')

    // Buffer OAuth scopes
    // 'publish' - Post to social media accounts
    // 'read' - Read profile information
    const scopes = ['publish', 'read'].join(' ')

    // Build OAuth URL
    const authUrl = new URL('https://buffer.com/oauth2/authorize')
    authUrl.searchParams.set('client_id', clientId)
    authUrl.searchParams.set('redirect_uri', redirectUri)
    authUrl.searchParams.set('response_type', 'code')
    authUrl.searchParams.set('scope', scopes)
    authUrl.searchParams.set('state', state)

    // Redirect to Buffer OAuth
    return NextResponse.redirect(authUrl.toString())
  } catch (error) {
    console.error('Buffer OAuth initiation error:', error)
    return NextResponse.json(
      { error: 'Failed to initiate Buffer OAuth' },
      { status: 500 }
    )
  }
}


