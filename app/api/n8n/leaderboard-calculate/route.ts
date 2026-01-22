import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { verifyN8nWebhook } from '@/lib/webhooks/n8n'
import { calculateScore } from '@/lib/db/leaderboard'

/**
 * Endpoint for n8n to trigger leaderboard calculation
 * n8n can call this after collecting metrics from all platforms
 * 
 * This endpoint recalculates ranks for all periods based on current metrics
 */
export async function POST(request: Request) {
  try {
    // Verify webhook signature
    const isValid = await verifyN8nWebhook(request)
    if (!isValid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = await createClient()

    // Get all leaderboard entries (they should already have aggregated metrics)
    const periods: ('daily' | 'weekly' | 'all_time')[] = [
      'daily',
      'weekly',
      'all_time',
    ]

    for (const period of periods) {
      const { data: entries, error: entriesError } = await (supabase
        .from('air_leaderboards') as any)
        .select('*')
        .eq('period', period)
        .order('score', { ascending: false })

      if (entriesError) {
        console.error(`Error fetching ${period} leaderboard:`, entriesError)
        continue
      }

      // Recalculate ranks
      (entries as any[])?.forEach((entry: any, index: number) => {
        entry.rank = index + 1
      })

      // Update ranks
      for (const entry of (entries || []) as any[]) {
        await (supabase
          .from('air_leaderboards') as any)
          .update({ rank: entry.rank })
          .eq('id', entry.id)
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Leaderboard ranks recalculated',
    })
  } catch (error) {
    console.error('n8n leaderboard-calculate error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}


