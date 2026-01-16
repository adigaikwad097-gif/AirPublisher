import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCurrentCreator } from '@/lib/db/creator'

/**
 * Initiate YouTube OAuth flow
 * Redirects user to YouTube authorization page
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

    // Get creator profile to link tokens
    const creator = await getCurrentCreator()

    if (!creator) {
      return NextResponse.redirect(new URL('/setup', request.url))
    }

    const clientId = process.env.YOUTUBE_CLIENT_ID
    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/auth/youtube/callback`
    
    if (!clientId) {
      return NextResponse.json(
        { error: 'YouTube OAuth not configured. Please set YOUTUBE_CLIENT_ID in environment variables.' },
        { status: 500 }
      )
    }

    // Generate state parameter for security (store creator_unique_identifier)
    const state = Buffer.from(JSON.stringify({
      creator_unique_identifier: creator.unique_identifier,
      user_id: user.id,
    })).toString('base64url')

    // YouTube OAuth scopes needed for uploading videos
    const scopes = [
      'https://www.googleapis.com/auth/youtube.upload',
      'https://www.googleapis.com/auth/youtube',
      'https://www.googleapis.com/auth/youtube.readonly',
    ].join(' ')

    // Build OAuth URL
    const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth')
    authUrl.searchParams.set('client_id', clientId)
    authUrl.searchParams.set('redirect_uri', redirectUri)
    authUrl.searchParams.set('response_type', 'code')
    authUrl.searchParams.set('scope', scopes)
    authUrl.searchParams.set('access_type', 'offline') // Get refresh token
    authUrl.searchParams.set('prompt', 'consent') // Force consent to get refresh token
    authUrl.searchParams.set('state', state)

    // Redirect to YouTube OAuth
    return NextResponse.redirect(authUrl.toString())
  } catch (error) {
    console.error('YouTube OAuth initiation error:', error)
    return NextResponse.json(
      { error: 'Failed to initiate YouTube OAuth' },
      { status: 500 }
    )
  }
}

