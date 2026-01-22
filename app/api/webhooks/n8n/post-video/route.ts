import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { verifyN8nWebhook } from '@/lib/webhooks/n8n'
import { getValidYouTubeAccessToken } from '@/lib/youtube/tokens'
import { getValidInstagramAccessToken } from '@/lib/instagram/tokens'

// Force dynamic rendering - this route uses headers for webhook verification
export const dynamic = 'force-dynamic'

/**
 * Webhook endpoint for n8n to trigger video posting
 * n8n will call this when it's time to post a scheduled video
 * 
 * Expected payload from n8n:
 * {
 *   "video_id": "uuid",
 *   "platform": "youtube" | "instagram" | "tiktok" | "internal",
 *   "video_url": "https://...",
 *   "title": "Video Title",
 *   "description": "Video description",
 *   "thumbnail_url": "https://..." (optional)
 * }
 */
export async function POST(request: Request) {
  try {
    // Verify webhook signature
    const isValid = await verifyN8nWebhook(request)
    if (!isValid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { video_id, platform, video_url, title, description, thumbnail_url } = body

    if (!video_id || !platform || !video_url || !title) {
      return NextResponse.json(
        { error: 'Missing required fields: video_id, platform, video_url, title' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Get video details
    const { data: videoData, error: videoError } = await (supabase
      .from('air_publisher_videos') as any)
      .select('*, airpublisher_creator_profiles!inner(unique_identifier, user_id)')
      .eq('id', video_id)
      .single()

    if (videoError || !videoData) {
      return NextResponse.json({ error: 'Video not found' }, { status: 404 })
    }

    // Type assertion to fix TypeScript error
    const video: any = videoData
    const creatorUniqueIdentifier = video.airpublisher_creator_profiles?.unique_identifier || video.creator_unique_identifier

    // Get platform tokens for the creator
    const tokenTable = `${platform}_tokens`
    let { data: tokens, error: tokenError } = await (supabase
      .from(tokenTable) as any)
      .select('*')
      .eq('creator_unique_identifier', creatorUniqueIdentifier)
      .single()

    if (tokenError || !tokens) {
      return NextResponse.json(
        { error: `No ${platform} tokens found for creator` },
        { status: 404 }
      )
    }

    // Cast tokens to any to avoid TypeScript errors
    let tokensData: any = tokens

    // Automatically refresh access token if expired
    if (platform === 'youtube' && tokensData) {
      const validAccessToken = await getValidYouTubeAccessToken(
        tokensData,
        creatorUniqueIdentifier
      )
      
      if (validAccessToken) {
        // Update tokens object with refreshed access token
        tokensData = {
          ...tokensData,
          google_access_token: validAccessToken,
        }
      } else {
        return NextResponse.json(
          { 
            error: 'YouTube token expired and could not be refreshed. Please reconnect your YouTube account.',
            requires_reconnection: true 
          },
          { status: 401 }
        )
      }
    } else if (platform === 'instagram' && tokensData) {
      const validAccessToken = await getValidInstagramAccessToken(
        tokensData,
        creatorUniqueIdentifier
      )
      
      if (validAccessToken) {
        // Update tokens object with refreshed access token
        tokensData = {
          ...tokensData,
          facebook_access_token: validAccessToken,
          instagram_access_token: validAccessToken,
          access_token: validAccessToken,
        }
      } else {
        return NextResponse.json(
          { 
            error: 'Instagram token expired and could not be refreshed. Please reconnect your Instagram account.',
            requires_reconnection: true 
          },
          { status: 401 }
        )
      }
    }

    // Return video data and tokens for n8n to use
    // n8n will handle the actual platform API call
    return NextResponse.json({
      success: true,
      video: {
        id: video.id,
        title: video.title || title,
        description: video.description || description,
        video_url: video.video_url || video_url,
        thumbnail_url: video.thumbnail_url || thumbnail_url,
        creator_unique_identifier: creatorUniqueIdentifier,
      },
      platform_tokens: {
        // Return token data (n8n will use this to authenticate with platform)
        access_token: platform === 'youtube' ? tokensData.google_access_token : tokensData.access_token,
        refresh_token: platform === 'youtube' ? tokensData.google_refresh_token : tokensData.refresh_token,
        // Add other platform-specific fields as needed
      },
      platform,
    })
  } catch (error) {
    console.error('n8n post-video webhook error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

