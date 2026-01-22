import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCurrentCreator } from '@/lib/db/creator'
import { getAppUrl } from '@/lib/utils/app-url'

// Force dynamic rendering - this route uses cookies and request.url
export const dynamic = 'force-dynamic'

/**
 * Initiate YouTube OAuth flow
 * Redirects user to YouTube authorization page
 */
export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    let user = null
    let authError = null

    try {
      const authResult = await supabase.auth.getUser()
      user = authResult.data?.user || null
      authError = authResult.error || null
      console.log('[YouTube OAuth] Auth check:', {
        hasUser: !!user,
        userEmail: user?.email,
        error: authError?.message || null,
      })
    } catch (error: any) {
      console.error('[YouTube OAuth] Auth check exception:', error?.message || String(error))
      authError = error
    }

    // In development, allow OAuth even without user (for testing)
    const isDevelopment = process.env.NODE_ENV === 'development'
    
    if (!isDevelopment && (!user || authError)) {
      console.error('[YouTube OAuth] Auth failed, redirecting to login')
      return NextResponse.redirect(new URL('/login', request.url))
    }

    // Try to get creator profile (but don't require it)
    let creator = null
    if (user) {
      try {
        creator = await getCurrentCreator()
      } catch (error: any) {
        console.error('[YouTube OAuth] Error fetching creator:', error?.message || String(error))
      }
    }

    const clientId = process.env.YOUTUBE_CLIENT_ID
    
    // Use getAppUrl() utility which properly detects Vercel, ngrok, or localhost
    const baseUrl = getAppUrl().replace(/\/$/, '')
    const redirectUri = `${baseUrl}/api/auth/youtube/callback`
    
    console.log('[YouTube OAuth] Environment check:', {
      VERCEL_URL: process.env.VERCEL_URL || 'NOT SET',
      NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'NOT SET',
    })
    console.log('[YouTube OAuth] Base URL:', baseUrl)
    console.log('[YouTube OAuth] Redirect URI:', redirectUri)
    
    console.log('[YouTube OAuth] OAuth configuration:', {
      hasClientId: !!clientId,
      clientIdLength: clientId?.length || 0,
      redirectUri,
      baseUrl,
    })
    
    if (!clientId) {
      return NextResponse.json(
        { error: 'YouTube OAuth not configured. Please set YOUTUBE_CLIENT_ID in environment variables.' },
        { status: 500 }
      )
    }

    // Generate state parameter for security (store creator_unique_identifier)
    const state = Buffer.from(JSON.stringify({
      creator_unique_identifier: creator?.unique_identifier || null,
      user_id: user?.id || null,
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
    authUrl.searchParams.set('prompt', 'consent') // Force consent to get refresh token (replaces deprecated approval_prompt)
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

