import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { Database } from '@/lib/supabase/types'
import { getCurrentCreator } from '@/lib/db/creator'

/**
 * YouTube OAuth callback via Supabase Auth
 * Extracts tokens from Supabase session and stores in youtube_tokens table
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
    } catch (error: any) {
      console.error('[YouTube Callback] Auth check exception:', error?.message || String(error))
      authError = error
    }

    // In development, allow callback even without user (for testing)
    const isDevelopment = process.env.NODE_ENV === 'development'
    
    if (!isDevelopment && (!user || authError)) {
      return NextResponse.redirect(new URL('/login', request.url))
    }

    // Try to get creator profile (but don't require it)
    let creator = null
    try {
      creator = await getCurrentCreator()
    } catch (error: any) {
      console.warn('[YouTube Callback] Could not get creator profile:', error?.message || String(error))
    }

    // If no user and no creator, we can't proceed
    if (!user && !creator) {
      return NextResponse.redirect(
        new URL('/settings/connections?error=no_user_or_creator', request.url)
      )
    }

    // Use creator unique_identifier if available, otherwise generate one from user ID
    const creatorUniqueIdentifier = creator?.unique_identifier || (user ? `creator_${user.id.slice(0, 8)}_${Date.now()}` : null)
    
    if (!creatorUniqueIdentifier) {
      return NextResponse.redirect(
        new URL('/settings/connections?error=no_identifier', request.url)
      )
    }

    // Get session to extract provider tokens
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session?.provider_token || !session?.provider_refresh_token) {
      return NextResponse.redirect(
        new URL('/settings/connections?error=no_tokens', request.url)
      )
    }

    // Get YouTube channel info
    let channelId: string | null = null
    let channelTitle: string | null = null

    try {
      const channelResponse = await fetch(
        'https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true',
        {
          headers: {
            Authorization: `Bearer ${session.provider_token}`,
          },
        }
      )

      if (channelResponse.ok) {
        const channelData = await channelResponse.json()
        if (channelData.items && channelData.items.length > 0) {
          channelId = channelData.items[0].id
          channelTitle = channelData.items[0].snippet?.title || null
        }
      }
    } catch (error) {
      console.error('Error fetching YouTube channel:', error)
    }

    // Store tokens in Supabase
    const serviceClient = createServiceClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const tokenData: Record<string, any> = {
      user_id: user?.id || 'dev_user',
      creator_unique_identifier: creatorUniqueIdentifier,
      google_access_token: session.provider_token,
      google_refresh_token: session.provider_refresh_token,
      token_type: 'Bearer',
      expires_at: session.expires_at ? new Date(session.expires_at * 1000).toISOString() : null,
      updated_at: new Date().toISOString(),
      channel_id: channelId,
      handle: channelTitle,
    }

    // Check if exists (by user_id if available, or by creator_unique_identifier)
    const lookupField = user?.id ? 'user_id' : 'creator_unique_identifier'
    const lookupValue = user?.id || creatorUniqueIdentifier
    
    const { data: existing } = await (serviceClient
      .from('youtube_tokens') as any)
      .select('user_id, creator_unique_identifier')
      .eq(lookupField, lookupValue)
      .maybeSingle()

    if (existing) {
      await (serviceClient
        .from('youtube_tokens') as any)
        .update(tokenData)
        .eq(lookupField, lookupValue)
    } else {
      await (serviceClient
        .from('youtube_tokens') as any)
        .insert(tokenData)
    }

    return NextResponse.redirect(
      new URL('/settings/connections?success=youtube_connected', request.url)
    )
  } catch (error: any) {
    console.error('YouTube Supabase callback error:', error)
    return NextResponse.redirect(
      new URL(`/settings/connections?error=${encodeURIComponent(error.message)}`, request.url)
    )
  }
}

