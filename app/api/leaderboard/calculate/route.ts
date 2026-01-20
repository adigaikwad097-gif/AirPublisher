import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { calculateScore } from '@/lib/db/leaderboard'

/**
 * Calculate and update leaderboard scores
 * This should be called via cron job or scheduled function
 */
export async function POST(request: Request) {
  try {
    // TODO: Leaderboard calculation temporarily disabled
    // Return early to skip leaderboard functionality for now
    return NextResponse.json({ 
      success: true, 
      message: 'Leaderboard calculation is temporarily disabled' 
    })

    // Verify service role key (for cron jobs)
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = await createClient()

    // Get all posted videos with their performance metrics
    // Aggregate views from air_publisher_videos table
    const { data: videos, error: videosError } = await (supabase
      .from('air_publisher_videos') as any)
      .select('creator_unique_identifier, id, views, posted_at')
      .eq('status', 'posted')

    if (videosError) throw videosError

    // Calculate date ranges for daily/weekly periods
    const now = new Date()
    const dailyStart = new Date(now.getTime() - 24 * 60 * 60 * 1000) // 24 hours ago
    const weeklyStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) // 7 days ago

    // Aggregate metrics by creator and period
    type CreatorMetrics = {
      allTime: { views: number; likes: number; comments: number; revenue: number }
      weekly: { views: number; likes: number; comments: number; revenue: number }
      daily: { views: number; likes: number; comments: number; revenue: number }
    }
    const creatorMetrics: Record<string, CreatorMetrics> = {}

    // Aggregate views from videos
    (videos as any[])?.forEach((video: any) => {
      const creatorId = video.creator_unique_identifier
      if (!creatorMetrics[creatorId]) {
        creatorMetrics[creatorId] = {
          allTime: { views: 0, likes: 0, comments: 0, revenue: 0 },
          weekly: { views: 0, likes: 0, comments: 0, revenue: 0 },
          daily: { views: 0, likes: 0, comments: 0, revenue: 0 },
        }
      }

      const videoViews = video.views || 0
      const postedAt = video.posted_at ? new Date(video.posted_at) : null

      // All-time: sum all videos
      creatorMetrics[creatorId].allTime.views += videoViews

      // Weekly: only videos posted in last 7 days
      if (postedAt && postedAt >= weeklyStart) {
        creatorMetrics[creatorId].weekly.views += videoViews
      }

      // Daily: only videos posted in last 24 hours
      if (postedAt && postedAt >= dailyStart) {
        creatorMetrics[creatorId].daily.views += videoViews
      }

      // TODO: Likes, comments, and revenue would come from platform APIs via n8n
      // For now, these remain at 0 until n8n webhooks update them
    })

    // Calculate scores and update leaderboards for each period
    const periods: ('daily' | 'weekly' | 'all_time')[] = [
      'daily',
      'weekly',
      'all_time',
    ]

    for (const period of periods) {
      const entries = Object.entries(creatorMetrics).map(
        ([creatorUniqueIdentifier, metrics]) => {
          // Get metrics for the current period
          const periodMetrics =
            period === 'daily'
              ? metrics.daily
              : period === 'weekly'
              ? metrics.weekly
              : metrics.allTime

          const score = calculateScore(
            periodMetrics.views,
            periodMetrics.likes,
            periodMetrics.comments,
            periodMetrics.revenue
          )

          return {
            creator_unique_identifier: creatorUniqueIdentifier,
            total_views: periodMetrics.views,
            total_likes: periodMetrics.likes,
            total_comments: periodMetrics.comments,
            estimated_revenue: periodMetrics.revenue,
            score,
            period,
            rank: 0, // Will be calculated after sorting
          }
        }
      )

      // Sort by score and assign ranks
      entries.sort((a, b) => b.score - a.score)
      entries.forEach((entry, index) => {
        entry.rank = index + 1
      })

      // Upsert leaderboard entries
      for (const entry of entries) {
        const { error: upsertError } = await supabase
          .from('air_leaderboards')
          .upsert(
            {
              creator_unique_identifier: entry.creator_unique_identifier,
              period: entry.period,
              total_views: entry.total_views,
              total_likes: entry.total_likes,
              total_comments: entry.total_comments,
              estimated_revenue: entry.estimated_revenue,
              score: entry.score,
              rank: entry.rank,
            },
            {
              onConflict: 'creator_unique_identifier,period',
            }
          )

        if (upsertError) {
          console.error('Error upserting leaderboard:', upsertError)
        }
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Leaderboard calculation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

