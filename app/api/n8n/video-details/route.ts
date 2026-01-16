import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { verifyN8nWebhook } from '@/lib/webhooks/n8n'

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
    const { data: video, error: videoError } = await supabase
      .from('air_publisher_videos')
      .select('*')
      .eq('id', videoId)
      .single()

    if (videoError || !video) {
      return NextResponse.json({ error: 'Video not found' }, { status: 404 })
    }

    // Get platform tokens
    // Try by creator_unique_identifier first (if column exists), fallback to user_id lookup
    const tokenTable = `${video.platform_target}_tokens`
    
    // Try to get tokens by creator_unique_identifier (if column exists)
    let { data: tokens, error: tokenError } = await supabase
      .from(tokenTable)
      .select('*')
      .eq('creator_unique_identifier', video.creator_unique_identifier)
      .maybeSingle()
    
    // If that fails, try to find by user_id (if we can get user_id from creator)
    // This is a fallback for older token records that might not have creator_unique_identifier
    if (tokenError || !tokens) {
      // For now, we'll return null - tokens should have creator_unique_identifier
      // If you need to support old tokens, you'd need to add a join or lookup
      tokens = null
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
      platform_tokens: tokens || null,
      has_tokens: !tokenError && !!tokens,
    })
  } catch (error) {
    console.error('n8n video-details query error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

