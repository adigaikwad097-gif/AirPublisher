import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCurrentCreator } from '@/lib/db/creator'

/**
 * Initiate TikTok OAuth flow
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
      console.log('[TikTok OAuth] Auth check:', {
        hasUser: !!user,
        userEmail: user?.email,
        error: authError?.message || null,
      })
    } catch (error: any) {
      console.error('[TikTok OAuth] Auth check exception:', error?.message || String(error))
      authError = error
    }

    // In development, allow OAuth even without user (for testing)
    const isDevelopment = process.env.NODE_ENV === 'development'
    
    if (!isDevelopment && (!user || authError)) {
      console.error('[TikTok OAuth] Auth failed, redirecting to login')
      return NextResponse.redirect(new URL('/login', request.url))
    }

    // Try to get creator profile (but don't require it)
    let creator = null
    if (user) {
      try {
        creator = await getCurrentCreator()
      } catch (error: any) {
        console.error('[TikTok OAuth] Error fetching creator:', error?.message || String(error))
      }
    }

    // Hardcode TikTok Client Key as fallback since .env.local isn't loading properly
    const clientKey = process.env.TIKTOK_CLIENT_KEY || 'sbawzz3li4gtvlwp9u'
    
    // Get redirect URI - detect ngrok from request, fallback to NEXT_PUBLIC_APP_URL or localhost
    const requestUrl = new URL(request.url)
    const headers = request.headers
    const forwardedHost = headers.get('x-forwarded-host')
    const hostHeader = headers.get('host')
    const forwardedProto = headers.get('x-forwarded-proto') || 'https'
    
    // Detect base URL - prioritize ngrok detection, then NEXT_PUBLIC_APP_URL, then localhost
    let baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    
    // Check if request is coming through ngrok (highest priority)
    const detectedHost = forwardedHost || hostHeader || requestUrl.host
    if (detectedHost && detectedHost.includes('ngrok')) {
      const protocol = forwardedProto || requestUrl.protocol.replace(':', '') || 'https'
      baseUrl = `${protocol}://${detectedHost}`
      console.log('[TikTok OAuth] ✅ Detected ngrok from request:', baseUrl)
    } else if (process.env.NEXT_PUBLIC_APP_URL && process.env.NEXT_PUBLIC_APP_URL.includes('ngrok')) {
      // Fallback: use NEXT_PUBLIC_APP_URL if it contains ngrok
      baseUrl = process.env.NEXT_PUBLIC_APP_URL
      console.log('[TikTok OAuth] ✅ Using ngrok URL from NEXT_PUBLIC_APP_URL:', baseUrl)
    } else {
      // Default to localhost for local development
      baseUrl = 'http://localhost:3000'
      console.log('[TikTok OAuth] Using localhost for redirect URI')
    }
    
    const redirectUri = `${baseUrl}/api/auth/tiktok/callback`
    
    // Debug: Log the redirect URI being used
    console.log('[TikTok OAuth] Request URL:', requestUrl.toString())
    console.log('[TikTok OAuth] Base URL:', baseUrl)
    console.log('[TikTok OAuth] Full redirect URI:', redirectUri)
    
    // Note: We're using hardcoded fallback, so we don't need to check here
    // But we can log which one is being used
    if (process.env.TIKTOK_CLIENT_KEY) {
      console.log('[TikTok OAuth] Using client key from environment variable')
    } else {
      console.log('[TikTok OAuth] Using hardcoded client key fallback')
    }

    // Generate state (include redirect_uri for exact match in callback)
    const state = Buffer.from(JSON.stringify({
      creator_unique_identifier: creator?.unique_identifier || null,
      user_id: user?.id || null,
      redirect_uri: redirectUri, // Store redirect URI for callback
    })).toString('base64url')

    // TikTok OAuth scopes for video upload
    const scopes = [
      'user.info.basic',
      'video.upload',
      'video.publish',
    ].join(',')

    // Build OAuth URL
    const authUrl = new URL('https://www.tiktok.com/v2/auth/authorize/')
    authUrl.searchParams.set('client_key', clientKey)
    authUrl.searchParams.set('redirect_uri', redirectUri)
    authUrl.searchParams.set('scope', scopes)
    authUrl.searchParams.set('response_type', 'code')
    authUrl.searchParams.set('state', state)

    return NextResponse.redirect(authUrl.toString())
  } catch (error) {
    console.error('TikTok OAuth initiation error:', error)
    return NextResponse.json(
      { error: 'Failed to initiate TikTok OAuth' },
      { status: 500 }
    )
  }
}

