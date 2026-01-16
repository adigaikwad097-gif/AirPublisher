import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { verifyN8nWebhook } from '@/lib/webhooks/n8n'

/**
 * Query endpoint for n8n to fetch scheduled posts that need to be published
 * n8n can poll this endpoint or use it in a scheduled workflow
 * 
 * Query params:
 * - limit: number of posts to fetch (default: 50)
 * - before: ISO timestamp - only fetch posts scheduled before this time
 */
export async function GET(request: Request) {
  try {
    // Verify webhook signature
    const isValid = await verifyN8nWebhook(request)
    if (!isValid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50')
    const before = searchParams.get('before') || new Date().toISOString()

    const supabase = await createClient()

    // Get scheduled videos that are due
    const { data: videos, error } = await supabase
      .from('air_publisher_videos')
      .select(`
        *,
        creator_profiles!inner (
          unique_identifier,
          display_name
        )
      `)
      .eq('status', 'scheduled')
      .not('scheduled_at', 'is', null)
      .lte('scheduled_at', before)
      .order('scheduled_at', { ascending: true })
      .limit(limit)

    if (error) {
      console.error('Error fetching scheduled posts:', error)
      return NextResponse.json(
        { error: 'Failed to fetch scheduled posts' },
        { status: 500 }
      )
    }

    // Format response for n8n
    const posts = videos?.map((video) => ({
      video_id: video.id,
      creator_unique_identifier: video.creator_unique_identifier,
      platform: video.platform_target,
      video_url: video.video_url,
      title: video.title,
      description: video.description,
      thumbnail_url: video.thumbnail_url,
      scheduled_at: video.scheduled_at,
    })) || []

    return NextResponse.json({
      success: true,
      count: posts.length,
      posts,
    })
  } catch (error) {
    console.error('n8n scheduled-posts query error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

