import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCurrentCreator } from '@/lib/db/creator'
import { getAppUrl } from '@/lib/utils/app-url'
import crypto from 'crypto'

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

    const clientKey = process.env.TIKTOK_CLIENT_KEY || 'sbawzz3li4gtvlwp9u'
    
    // Use getAppUrl() utility which properly detects Vercel, ngrok, or localhost
    const baseUrl = getAppUrl()
    // Ensure no trailing slash in baseUrl before appending path
    const cleanBaseUrl = baseUrl.replace(/\/$/, '')
    const redirectUri = `${cleanBaseUrl}/api/auth/tiktok/callback`
    
    console.log('[TikTok OAuth] Environment check:', {
      VERCEL_URL: process.env.VERCEL_URL || 'NOT SET',
      NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'NOT SET',
      NODE_ENV: process.env.NODE_ENV,
    })
    console.log('[TikTok OAuth] Base URL:', baseUrl)
    console.log('[TikTok OAuth] Clean Base URL:', cleanBaseUrl)
    console.log('[TikTok OAuth] Redirect URI:', redirectUri)
    console.log('[TikTok OAuth] Redirect URI length:', redirectUri.length)

    // TikTok requires PKCE (Proof Key for Code Exchange)
    // Generate code_verifier (random string)
    const codeVerifier = crypto.randomBytes(32).toString('base64url')
    
    // Generate code_challenge (SHA256 hash of verifier, base64url encoded)
    const codeChallenge = crypto
      .createHash('sha256')
      .update(codeVerifier)
      .digest('base64url')
    
    console.log('[TikTok OAuth] Generated PKCE:', {
      hasVerifier: !!codeVerifier,
      hasChallenge: !!codeChallenge,
    })

    // Generate state (include redirect_uri and code_verifier for callback)
    const state = Buffer.from(JSON.stringify({
      creator_unique_identifier: creator?.unique_identifier || null,
      user_id: user?.id || null,
      redirect_uri: redirectUri,
      code_verifier: codeVerifier, // Store for callback
    })).toString('base64url')

    // TikTok OAuth scopes for video upload
    const scopes = [
      'user.info.basic',
      'video.upload',
      'video.publish',
    ].join(',')

    // Build OAuth URL with PKCE
    const authUrl = new URL('https://www.tiktok.com/v2/auth/authorize/')
    authUrl.searchParams.set('client_key', clientKey)
    authUrl.searchParams.set('redirect_uri', redirectUri)
    authUrl.searchParams.set('scope', scopes)
    authUrl.searchParams.set('response_type', 'code')
    authUrl.searchParams.set('state', state)
    authUrl.searchParams.set('code_challenge', codeChallenge)
    authUrl.searchParams.set('code_challenge_method', 'S256')

    return NextResponse.redirect(authUrl.toString())
  } catch (error) {
    console.error('TikTok OAuth initiation error:', error)
    return NextResponse.json(
      { error: 'Failed to initiate TikTok OAuth' },
      { status: 500 }
    )
  }
}

