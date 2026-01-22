import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCurrentCreator } from '@/lib/db/creator'
import { getAppUrl } from '@/lib/utils/app-url'

/**
 * Initiate Instagram OAuth flow
 * Note: Instagram uses Facebook OAuth (Instagram Graph API)
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
      console.log('[Instagram OAuth] Auth check:', {
        hasUser: !!user,
        userEmail: user?.email,
        error: authError?.message || null,
      })
    } catch (error: any) {
      console.error('[Instagram OAuth] Auth check exception:', error?.message || String(error))
      authError = error
    }

    // In development, allow OAuth even without user (for testing)
    const isDevelopment = process.env.NODE_ENV === 'development'
    
    if (!isDevelopment && (!user || authError)) {
      console.error('[Instagram OAuth] Auth failed, redirecting to login')
      return NextResponse.redirect(new URL('/login', request.url))
    }

    // Try to get creator profile (but don't require it)
    let creator = null
    if (user) {
      try {
        creator = await getCurrentCreator()
      } catch (error: any) {
        console.error('[Instagram OAuth] Error fetching creator:', error?.message || String(error))
      }
    }

    // Debug: Log environment variables (without exposing secrets)
    console.log('[Instagram OAuth] Environment check:', {
      hasMETA_APP_ID: !!process.env.META_APP_ID,
      hasINSTAGRAM_APP_ID: !!process.env.INSTAGRAM_APP_ID,
      META_APP_ID_length: process.env.META_APP_ID?.length || 0,
      INSTAGRAM_APP_ID_length: process.env.INSTAGRAM_APP_ID?.length || 0,
      NODE_ENV: process.env.NODE_ENV,
    })

    // Instagram Business Login uses Instagram App ID (not Meta App ID)
    // Get from: Instagram > API setup with Instagram login > Business login settings
    // Remove any whitespace/newlines from app ID
    const appId = (process.env.INSTAGRAM_APP_ID || process.env.META_APP_ID || '836687999185692').trim()
    
    // Use getAppUrl() utility which properly detects Vercel, ngrok, or localhost
    const baseUrl = getAppUrl()
    // Ensure no trailing slash in baseUrl before appending path
    const cleanBaseUrl = baseUrl.replace(/\/$/, '')
    const redirectUri = `${cleanBaseUrl}/api/auth/instagram/callback`
    
    console.log('[Instagram OAuth] Environment check:', {
      VERCEL_URL: process.env.VERCEL_URL || 'NOT SET',
      NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'NOT SET',
      NODE_ENV: process.env.NODE_ENV,
    })
    console.log('[Instagram OAuth] Base URL:', baseUrl)
    console.log('[Instagram OAuth] Clean Base URL:', cleanBaseUrl)
    console.log('[Instagram OAuth] Redirect URI:', redirectUri)
    console.log('[Instagram OAuth] Redirect URI length:', redirectUri.length)
    
    // Debug logging - Check all Instagram-related env vars
    console.log('[Instagram OAuth] Environment variables check:', {
      INSTAGRAM_APP_ID: process.env.INSTAGRAM_APP_ID ? `SET (${process.env.INSTAGRAM_APP_ID.substring(0, 6)}...)` : 'NOT SET',
      INSTAGRAM_APP_SECRET: process.env.INSTAGRAM_APP_SECRET ? 'SET (hidden)' : 'NOT SET',
      META_APP_ID: process.env.META_APP_ID ? `SET (${process.env.META_APP_ID.substring(0, 6)}...)` : 'NOT SET',
    })
    console.log('[Instagram OAuth] App ID being used:', appId ? `${appId.substring(0, 6)}...` : 'NOT SET')
    console.log('[Instagram OAuth] App ID source:', process.env.INSTAGRAM_APP_ID ? 'INSTAGRAM_APP_ID' : (process.env.META_APP_ID ? 'META_APP_ID' : 'NONE'))
    console.log('[Instagram OAuth] Redirect URI:', redirectUri)
    
    if (!appId) {
      console.error('[Instagram OAuth] Missing Instagram App ID. Available env vars:', {
        INSTAGRAM_APP_ID: process.env.INSTAGRAM_APP_ID ? 'SET (hidden)' : 'NOT SET',
        META_APP_ID: process.env.META_APP_ID ? 'SET (hidden)' : 'NOT SET',
        allEnvKeys: Object.keys(process.env).filter(key => key.includes('META') || key.includes('INSTAGRAM') || key.includes('APP')),
      })
      return NextResponse.json(
        { 
          error: 'Instagram OAuth not configured. Please set INSTAGRAM_APP_ID in environment variables (found in Instagram > API setup with Instagram login > Business login settings).',
          debug: {
            hasINSTAGRAM_APP_ID: !!process.env.INSTAGRAM_APP_ID,
            hasMETA_APP_ID: !!process.env.META_APP_ID,
            hint: 'Get Instagram App ID from Meta Dashboard: Instagram > API setup with Instagram login > Business login settings',
          }
        },
        { status: 500 }
      )
    }

    // Generate state - include redirect_uri so callback can use the exact same one
    const state = Buffer.from(JSON.stringify({
      creator_unique_identifier: creator?.unique_identifier || null,
      user_id: user?.id || null,
      redirect_uri: redirectUri, // Store redirect URI in state to ensure exact match
    })).toString('base64url')

    // Instagram API with Instagram Login - New scopes (replaces old ones as of Jan 27, 2025)
    // Note: These scopes don't require Facebook Pages
    const scopes = [
      'instagram_business_basic',           // Basic profile info
      'instagram_business_content_publish', // Publish content
      // Optional scopes:
      // 'instagram_business_manage_comments', // Manage comments
      // 'instagram_business_manage_messages', // Manage messages
    ].join(',')

    // Build OAuth URL - Use Instagram's native OAuth endpoint
    // See: https://developers.facebook.com/docs/instagram-platform/instagram-api-with-instagram-login/business-login
    // Endpoint: https://api.instagram.com/oauth/authorize (NOT Facebook OAuth)
    const authUrl = new URL('https://api.instagram.com/oauth/authorize')
    authUrl.searchParams.set('client_id', appId)
    // Ensure redirect_uri is properly encoded and matches exactly what's in Instagram settings
    authUrl.searchParams.set('redirect_uri', redirectUri)
    authUrl.searchParams.set('scope', scopes)
    authUrl.searchParams.set('response_type', 'code')
    authUrl.searchParams.set('state', state)
    
    // Debug: Log the final OAuth URL (without exposing sensitive data)
    console.log('[Instagram OAuth] Final OAuth URL:', authUrl.toString().replace(/state=[^&]+/, 'state=***'))
    console.log('[Instagram OAuth] Redirect URI being sent:', redirectUri)
    
    // Note: Instagram OAuth endpoint does NOT support config_id, display, or auth_type
    // These are Facebook OAuth-specific parameters

    return NextResponse.redirect(authUrl.toString())
  } catch (error) {
    console.error('Instagram OAuth initiation error:', error)
    return NextResponse.json(
      { error: 'Failed to initiate Instagram OAuth' },
      { status: 500 }
    )
  }
}

