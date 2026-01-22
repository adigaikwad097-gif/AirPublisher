import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { verifyN8nWebhook } from '@/lib/webhooks/n8n'
import { calculateScore } from '@/lib/db/leaderboard'

/**
 * Webhook endpoint for n8n to send performance metrics
 * Called by n8n after collecting metrics from platforms
 * 
 * Expected payload from n8n:
 * {
 *   "video_id": "uuid",
 *   "platform": "youtube" | "instagram" | "tiktok",
 *   "platform_post_id": "platform-specific-id",
 *   "metrics": {
 *     "views": 1000,
 *     "likes": 50,
 *     "comments": 10,
 *     "shares": 5,
 *     "estimated_revenue": 10.50
 *   }
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
    const { video_id, platform, platform_post_id, metrics } = body

    if (!video_id || !metrics) {
      return NextResponse.json(
        { error: 'Missing required fields: video_id, metrics' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Get video to find creator
    const { data: video, error: videoError } = await (supabase
      .from('air_publisher_videos') as any)
      .select('creator_unique_identifier')
      .eq('id', video_id)
      .single()

    if (videoError || !video) {
      return NextResponse.json({ error: 'Video not found' }, { status: 404 })
    }

    // Update or create metrics entry
    // You might want to create a separate video_metrics table
    // For now, we'll aggregate into leaderboards

    // Get current leaderboard entry
    const { data: leaderboard } = await (supabase
      .from('air_leaderboards') as any)
      .select('*')
      .eq('creator_unique_identifier', video.creator_unique_identifier)
      .eq('period', 'all_time')
      .single()

    const leaderboardData = leaderboard as any
    const currentViews = leaderboardData?.total_views || 0
    const currentLikes = leaderboardData?.total_likes || 0
    const currentComments = leaderboardData?.total_comments || 0
    const currentRevenue = Number(leaderboardData?.estimated_revenue || 0)

    // Aggregate metrics (in production, you'd want to track per-video metrics)
    const newViews = currentViews + (metrics.views || 0)
    const newLikes = currentLikes + (metrics.likes || 0)
    const newComments = currentComments + (metrics.comments || 0)
    const newRevenue = currentRevenue + (metrics.estimated_revenue || 0)

    const score = calculateScore(newViews, newLikes, newComments, newRevenue)

    // Update all-time leaderboard
    await (supabase.from('air_leaderboards') as any).upsert(
      {
        creator_unique_identifier: video.creator_unique_identifier,
        period: 'all_time',
        total_views: newViews,
        total_likes: newLikes,
        total_comments: newComments,
        estimated_revenue: newRevenue,
        score,
        rank: 0, // Will be recalculated by leaderboard calculation job
      },
      {
        onConflict: 'creator_unique_identifier,period',
      }
    )

    return NextResponse.json({
      success: true,
      message: 'Metrics updated',
    })
  } catch (error) {
    console.error('n8n metrics webhook error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}


