import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { verifyN8nWebhook } from '@/lib/webhooks/n8n'

/**
 * Query endpoint for n8n to fetch videos that need to be posted immediately
 * This includes:
 * 1. Scheduled videos that are due (scheduled_at <= now)
 * 2. Draft videos that were just published (status='scheduled' with immediate scheduled_at)
 * 
 * Query params:
 * - limit: number of posts to fetch (default: 50)
 * - before: ISO timestamp - only fetch posts scheduled before this time (default: now)
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

    // Get scheduled videos that are due (including immediate posts)
    // Try new airpublisher_creator_profiles table first, fallback to creator_profiles
    let { data: videos, error } = await (supabase
      .from('air_publisher_videos') as any)
      .select(`
        *,
        airpublisher_creator_profiles!inner (
          unique_identifier,
          user_id
        )
      `)
      .eq('status', 'scheduled')
      .not('scheduled_at', 'is', null)
      .lte('scheduled_at', before)
      .order('scheduled_at', { ascending: true })
      .limit(limit)

    // If new table query fails, try old table
    if (error || !videos || videos.length === 0) {
      const { data: fallbackVideos, error: fallbackError } = await (supabase
        .from('air_publisher_videos') as any)
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
      
      if (fallbackVideos) {
        videos = fallbackVideos
        error = null
      }
    }

    if (error) {
      console.error('Error fetching pending posts:', error)
      return NextResponse.json(
        { error: 'Failed to fetch pending posts' },
        { status: 500 }
      )
    }

    // Format response for n8n
    const posts = (videos as any[])?.map((video: any) => ({
      video_id: video.id,
      creator_unique_identifier: video.creator_unique_identifier,
      platform: video.platform_target,
      video_url: video.video_url,
      title: video.title,
      description: video.description,
      thumbnail_url: video.thumbnail_url,
      scheduled_at: video.scheduled_at,
      // Indicate if this is an immediate post (scheduled for now or in the past)
      is_immediate: new Date(video.scheduled_at) <= new Date(),
    })) || []

    return NextResponse.json({
      success: true,
      count: posts.length,
      posts,
    })
  } catch (error) {
    console.error('n8n pending-posts query error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}


