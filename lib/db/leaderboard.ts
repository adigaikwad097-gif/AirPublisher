import { supabase } from '@/lib/supabase/client'

export type LeaderboardEntry = {
  creator_unique_identifier: string
  display_name: string | null
  avatar_url: string | null
  niche: string | null
  total_views: number
  total_likes: number
  total_comments: number
  estimated_revenue: number
  score: number
  rank: number
}

export type LeaderboardPeriod = 'all_time' | 'last_7d'
export type LeaderboardSort = 'views' | 'revenue_views' | 'score'

/**
 * Fetch leaderboard data via the get_leaderboard RPC function.
 * Aggregates stats in real-time from air_publisher_videos + creator_profiles.
 */
export async function getLeaderboard(
  period: LeaderboardPeriod = 'all_time',
  niche: string | null = null,
  sortBy: LeaderboardSort = 'score',
  limit: number = 100
): Promise<LeaderboardEntry[]> {
  const { data, error } = await supabase.rpc('get_leaderboard', {
    p_period: period,
    p_niche: niche ?? undefined,
    p_sort_by: sortBy,
    p_limit: limit,
  })

  if (error) {
    console.error('Error fetching leaderboard:', error?.message || error)
    return []
  }

  return (data as LeaderboardEntry[]) || []
}

/**
 * Fetch all niches from the niches_list table for the niche filter dropdown.
 */
export async function getNiches(): Promise<{ niche_id: number; name: string }[]> {
  const { data, error } = await supabase
    .from('niches_list')
    .select('niche_id, name')
    .order('name', { ascending: true })

  if (error) {
    console.error('Error fetching niches:', error?.message || error)
    return []
  }

  return (data as { niche_id: number; name: string }[]) || []
}

/**
 * Calculate leaderboard score (client-side mirror of the SQL formula).
 * score = (views * 0.4) + (likes * 0.2) + (comments * 0.2) + (estimated_revenue * 2)
 */
export function calculateScore(
  views: number,
  likes: number,
  comments: number,
  estimatedRevenue: number
): number {
  return (
    views * 0.4 +
    likes * 0.2 +
    comments * 0.2 +
    estimatedRevenue * 2
  )
}
