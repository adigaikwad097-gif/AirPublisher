import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { calculateScore } from '@/lib/db/leaderboard'

/**
 * Calculate and update leaderboard scores
 * This should be called via cron job or scheduled function
 */
export async function POST(request: Request) {
  try {
    // Verify service role key (for cron jobs)
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = await createClient()

    // Get all posted videos with their performance metrics
    // In production, this would aggregate from platform APIs
    const { data: videos, error: videosError } = await supabase
      .from('air_publisher_videos')
      .select('creator_unique_identifier, id')
      .eq('status', 'posted')

    if (videosError) throw videosError

    // Aggregate metrics by creator
    const creatorMetrics: Record<
      string,
      {
        views: number
        likes: number
        comments: number
        revenue: number
      }
    > = {}

    // TODO: In production, fetch actual metrics from platform APIs
    // For now, using placeholder values
    videos?.forEach((video) => {
      if (!creatorMetrics[video.creator_unique_identifier]) {
        creatorMetrics[video.creator_unique_identifier] = {
          views: 0,
          likes: 0,
          comments: 0,
          revenue: 0,
        }
      }
      // Placeholder: would fetch from platform APIs
      creatorMetrics[video.creator_unique_identifier].views += 0
      creatorMetrics[video.creator_unique_identifier].likes += 0
      creatorMetrics[video.creator_unique_identifier].comments += 0
      creatorMetrics[video.creator_unique_identifier].revenue += 0
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
          const score = calculateScore(
            metrics.views,
            metrics.likes,
            metrics.comments,
            metrics.revenue
          )

          return {
            creator_unique_identifier: creatorUniqueIdentifier,
            total_views: metrics.views,
            total_likes: metrics.likes,
            total_comments: metrics.comments,
            estimated_revenue: metrics.revenue,
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

