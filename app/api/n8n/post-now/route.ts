import { NextResponse } from 'next/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { Database } from '@/lib/supabase/types'
import { verifyN8nWebhook } from '@/lib/webhooks/n8n'
import { getValidYouTubeAccessToken } from '@/lib/youtube/tokens'
import { getValidInstagramAccessToken } from '@/lib/instagram/tokens'

// Force dynamic rendering - this route uses headers for webhook verification
export const dynamic = 'force-dynamic'

/**
 * Immediate Posting Endpoint for n8n
 * 
 * This endpoint is called by n8n when a user clicks "Post Now"
 * It returns all the data n8n needs to post the video:
 * - Video details (title, description, Dropbox URL)
 * - Valid access tokens (auto-refreshed if expired)
 * - Platform-specific metadata
 * 
 * Request Body:
 * {
 *   "video_id": "uuid",
 *   "platform": "youtube" | "instagram" | "tiktok" | "internal"
 * }
 * 
 * Response:
 * {
 *   "success": true,
 *   "video": {
 *     "id": "uuid",
 *     "title": "Video Title",
 *     "description": "Description",
 *     "video_url": "https://dropbox.com/...", // Dropbox URL
 *     "thumbnail_url": "https://...",
 *     "creator_unique_identifier": "creator-id"
 *   },
 *   "platform_tokens": {
 *     "access_token": "...",
 *     "refresh_token": "...",
 *     // Platform-specific fields
 *   },
 *   "platform": "youtube"
 * }
 */
export async function POST(request: Request) {
  try {
    // Verify webhook signature (optional - can be disabled for testing)
    const isValid = await verifyN8nWebhook(request)
    if (!isValid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { video_id, platform } = body

    if (!video_id || !platform) {
      return NextResponse.json(
        { error: 'Missing required fields: video_id, platform' },
        { status: 400 }
      )
    }

    console.log('[post-now] Processing immediate post request:', { video_id, platform })

    // Use service role to bypass RLS
    const serviceClient = createServiceClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Get video details
    const { data: video, error: videoError } = await (serviceClient
      .from('air_publisher_videos') as any)
      .select('*')
      .eq('id', video_id)
      .single()

    if (videoError || !video) {
      console.error('[post-now] Video not found:', videoError?.message)
      return NextResponse.json({ error: 'Video not found' }, { status: 404 })
    }

    // Verify video has a URL (Dropbox URL)
    if (!video.video_url) {
      return NextResponse.json(
        { error: 'Video does not have a video URL. Please upload the video first.' },
        { status: 400 }
      )
    }

    console.log('[post-now] Video found:', {
      id: video.id,
      title: video.title,
      hasVideoUrl: !!video.video_url,
      platform_target: video.platform_target,
      creator: video.creator_unique_identifier,
    })

    // Get platform tokens - try new airpublisher_*_tokens tables first
    const newTokenTable = `airpublisher_${platform}_tokens`
    const oldTokenTable = `${platform}_tokens`

    let tokens: any = null
    let tokenError = null

    // Try new table first
    const { data: newTokens, error: newError } = await (serviceClient
      .from(newTokenTable) as any)
      .select('*')
      .eq('creator_unique_identifier', video.creator_unique_identifier)
      .maybeSingle()

    if (newTokens && !newError) {
      tokens = newTokens
    } else {
      // Fallback to old table
      const { data: oldTokens, error: oldError } = await (serviceClient
        .from(oldTokenTable) as any)
        .select('*')
        .eq('creator_unique_identifier', video.creator_unique_identifier)
        .maybeSingle()

      if (oldTokens && !oldError) {
        tokens = oldTokens
      } else {
        tokenError = newError || oldError
      }
    }

    if (!tokens) {
      console.error('[post-now] No tokens found for platform:', platform)
      return NextResponse.json(
        {
          error: `No ${platform} tokens found. Please connect your ${platform} account first.`,
          requires_reconnection: true,
        },
        { status: 401 }
      )
    }

    console.log('[post-now] Tokens found, validating and refreshing if needed...')

    // Validate and refresh access token if expired
    let validAccessToken: string | null = null

    if (platform === 'youtube') {
      validAccessToken = await getValidYouTubeAccessToken(video.creator_unique_identifier)
      if (!validAccessToken) {
        return NextResponse.json(
          {
            error: 'YouTube token expired and could not be refreshed. Please reconnect your YouTube account.',
            requires_reconnection: true,
          },
          { status: 401 }
        )
      }
    } else if (platform === 'instagram') {
      validAccessToken = await getValidInstagramAccessToken(video.creator_unique_identifier)
      if (!validAccessToken) {
        return NextResponse.json(
          {
            error: 'Instagram token expired and could not be refreshed. Please reconnect your Instagram account.',
            requires_reconnection: true,
          },
          { status: 401 }
        )
      }
    } else if (platform === 'tiktok') {
      // Check TikTok token expiration
      const expiresAt = tokens.expires_at
      if (expiresAt) {
        const expirationDate = new Date(expiresAt)
        const bufferTime = 5 * 60 * 1000 // 5 minutes
        if (expirationDate.getTime() < Date.now() + bufferTime) {
          return NextResponse.json(
            {
              error: 'TikTok token expired. Please reconnect your TikTok account.',
              requires_reconnection: true,
            },
            { status: 401 }
          )
        }
      }
      validAccessToken = tokens.tiktok_access_token || tokens.access_token || null
    } else if (platform === 'internal') {
      // Internal platform doesn't need tokens
      validAccessToken = null
    } else {
      validAccessToken = tokens.access_token || null
    }

    if (!validAccessToken && platform !== 'internal') {
      return NextResponse.json(
        {
          error: `No valid access token found for ${platform}`,
          requires_reconnection: true,
        },
        { status: 401 }
      )
    }

    // Format tokens based on platform for n8n
    let formattedTokens: any = null
    if (platform === 'youtube') {
      formattedTokens = {
        access_token: validAccessToken,
        refresh_token: tokens.google_refresh_token || tokens.refresh_token,
        channel_id: tokens.channel_id,
        channel_title: tokens.channel_title || tokens.handle,
      }
    } else if (platform === 'instagram') {
      formattedTokens = {
        access_token: validAccessToken,
        instagram_id: tokens.instagram_id || tokens.instagram_business_account_id,
        username: tokens.username,
      }
    } else if (platform === 'tiktok') {
      formattedTokens = {
        access_token: validAccessToken,
        refresh_token: tokens.tiktok_refresh_token || tokens.refresh_token,
        open_id: tokens.tiktok_open_id || tokens.open_id,
      }
    } else if (platform === 'internal') {
      formattedTokens = null // No tokens needed for internal
    } else {
      formattedTokens = {
        access_token: validAccessToken,
        refresh_token: tokens.refresh_token,
      }
    }

    console.log('[post-now] ✅ Returning video data and tokens for n8n')

    // Return everything n8n needs to post the video
    return NextResponse.json({
      success: true,
      video: {
        id: video.id,
        title: video.title,
        description: video.description || '',
        video_url: video.video_url, // Dropbox URL
        thumbnail_url: video.thumbnail_url,
        creator_unique_identifier: video.creator_unique_identifier,
      },
      platform_tokens: formattedTokens,
      platform,
      has_tokens: !!formattedTokens,
    })
  } catch (error: any) {
    console.error('[post-now] Error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}


