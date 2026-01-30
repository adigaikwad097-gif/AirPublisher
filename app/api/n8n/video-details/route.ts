import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { verifyN8nWebhook } from '@/lib/webhooks/n8n'
import { getValidYouTubeAccessToken } from '@/lib/youtube/tokens'
import { getValidInstagramAccessToken } from '@/lib/instagram/tokens'

// Force dynamic rendering - this route uses headers for webhook verification
export const dynamic = 'force-dynamic'

/**
 * Query endpoint for n8n to fetch video details and platform tokens
 * Used when n8n needs to post a video
 * 
 * Query params:
 * - video_id: UUID of the video
 */
export async function GET(request: Request) {
  try {
    // Verify webhook signature
    const isValid = await verifyN8nWebhook(request)
    if (!isValid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const videoId = searchParams.get('video_id')

    if (!videoId) {
      return NextResponse.json(
        { error: 'Missing video_id parameter' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Get video details
    const { data: video, error: videoError } = await (supabase
      .from('air_publisher_videos') as any)
      .select('*')
      .eq('id', videoId)
      .single()

    if (videoError || !video) {
      return NextResponse.json({ error: 'Video not found' }, { status: 404 })
    }

    // Get platform tokens - try new airpublisher_*_tokens tables first
    const serviceClient = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const newTokenTable = `airpublisher_${video.platform_target}_tokens`
    const oldTokenTable = `${video.platform_target}_tokens`
    
    // Try new table first
    let { data: tokens, error: tokenError } = await (serviceClient
      .from(newTokenTable) as any)
      .select('*')
      .eq('creator_unique_identifier', video.creator_unique_identifier)
      .maybeSingle()
    
    // Fallback to old table if new table doesn't have tokens
    if (tokenError || !tokens) {
      const { data: oldTokens } = await (serviceClient
        .from(oldTokenTable) as any)
        .select('*')
        .eq('creator_unique_identifier', video.creator_unique_identifier)
        .maybeSingle()
      
      if (oldTokens) {
        tokens = oldTokens
        tokenError = null
      }
    }

    // Automatically refresh access token if expired
    if (video.platform_target === 'youtube' && tokens) {
      const validAccessToken = await getValidYouTubeAccessToken(
        tokens,
        video.creator_unique_identifier
      )
      
      if (validAccessToken) {
        // Update tokens object with refreshed access token
        tokens = {
          ...tokens,
          google_access_token: validAccessToken,
        }
      } else {
        // Token refresh failed - return error message
        return NextResponse.json(
          { 
            error: 'YouTube token expired and could not be refreshed. Please reconnect your YouTube account.',
            requires_reconnection: true 
          },
          { status: 401 }
        )
      }
    } else if (video.platform_target === 'instagram' && tokens) {
      const validAccessToken = await getValidInstagramAccessToken(
        tokens,
        video.creator_unique_identifier
      )
      
      if (validAccessToken) {
        // Update tokens object with refreshed access token
        tokens = {
          ...tokens,
          facebook_access_token: validAccessToken,
          instagram_access_token: validAccessToken,
          access_token: validAccessToken,
        }
      } else {
        // Token refresh failed - return error message
        return NextResponse.json(
          { 
            error: 'Instagram token expired and could not be refreshed. Please reconnect your Instagram account.',
            requires_reconnection: true 
          },
          { status: 401 }
        )
      }
    }

    // Format tokens based on platform for n8n
    let formattedTokens: any = null
    if (tokens) {
      if (video.platform_target === 'youtube') {
        formattedTokens = {
          access_token: tokens.google_access_token || tokens.access_token,
          refresh_token: tokens.google_refresh_token || tokens.refresh_token,
          channel_id: tokens.channel_id,
          channel_title: tokens.channel_title || tokens.handle,
        }
      } else if (video.platform_target === 'instagram') {
        formattedTokens = {
          // Instagram Graph API uses Facebook access tokens, so prioritize facebook_access_token
          access_token: tokens.facebook_access_token || tokens.instagram_access_token || tokens.access_token,
          instagram_id: tokens.instagram_id || tokens.instagram_business_account_id,
          username: tokens.username,
        }
      } else if (video.platform_target === 'tiktok') {
        formattedTokens = {
          access_token: tokens.tiktok_access_token || tokens.access_token,
          refresh_token: tokens.tiktok_refresh_token || tokens.refresh_token,
          open_id: tokens.tiktok_open_id || tokens.open_id,
        }
      } else {
        // Fallback: return all token fields
        formattedTokens = tokens
      }
    }

    return NextResponse.json({
      success: true,
      video: {
        id: video.id,
        title: video.title,
        description: video.description,
        video_url: video.video_url,
        thumbnail_url: video.thumbnail_url,
        platform_target: video.platform_target,
        creator_unique_identifier: video.creator_unique_identifier,
      },
      platform_tokens: formattedTokens,
      has_tokens: !!formattedTokens,
    })
  } catch (error) {
    console.error('n8n video-details query error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

