import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCurrentCreator } from '@/lib/db/creator'

/**
 * Initiate Instagram OAuth flow
 * Note: Instagram uses Facebook OAuth (Instagram Graph API)
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

    const appId = process.env.INSTAGRAM_APP_ID
    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/auth/instagram/callback`
    
    if (!appId) {
      return NextResponse.json(
        { error: 'Instagram OAuth not configured. Please set INSTAGRAM_APP_ID in environment variables.' },
        { status: 500 }
      )
    }

    // Generate state
    const state = Buffer.from(JSON.stringify({
      creator_unique_identifier: creator.unique_identifier,
      user_id: user.id,
    })).toString('base64url')

    // Instagram Graph API scopes
    const scopes = [
      'instagram_basic',
      'instagram_content_publish',
      'pages_show_list',
      'pages_read_engagement',
    ].join(',')

    // Build OAuth URL (Instagram uses Facebook OAuth)
    const authUrl = new URL('https://www.facebook.com/v18.0/dialog/oauth')
    authUrl.searchParams.set('client_id', appId)
    authUrl.searchParams.set('redirect_uri', redirectUri)
    authUrl.searchParams.set('scope', scopes)
    authUrl.searchParams.set('response_type', 'code')
    authUrl.searchParams.set('state', state)

    return NextResponse.redirect(authUrl.toString())
  } catch (error) {
    console.error('Instagram OAuth initiation error:', error)
    return NextResponse.json(
      { error: 'Failed to initiate Instagram OAuth' },
      { status: 500 }
    )
  }
}

