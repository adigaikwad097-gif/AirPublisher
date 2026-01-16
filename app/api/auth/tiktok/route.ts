import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCurrentCreator } from '@/lib/db/creator'

/**
 * Initiate TikTok OAuth flow
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

    const clientKey = process.env.TIKTOK_CLIENT_KEY
    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/auth/tiktok/callback`
    
    if (!clientKey) {
      return NextResponse.json(
        { error: 'TikTok OAuth not configured. Please set TIKTOK_CLIENT_KEY in environment variables.' },
        { status: 500 }
      )
    }

    // Generate state
    const state = Buffer.from(JSON.stringify({
      creator_unique_identifier: creator.unique_identifier,
      user_id: user.id,
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

