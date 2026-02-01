import { createClient } from '@/lib/supabase/server'
import { Database } from '@/lib/supabase/types'

type LeaderboardEntry = Database['public']['Tables']['air_leaderboards']['Row']

export async function getCreatorRank(
  creatorUniqueIdentifier: string,
  period: 'daily' | 'weekly' | 'all_time'
): Promise<LeaderboardEntry | null> {
  const supabase = await createClient()

  const { data: entry, error } = await (supabase
    .from('air_leaderboards') as any)
    .select('*')
    .eq('creator_unique_identifier', creatorUniqueIdentifier)
    .eq('period', period)
    .single()

  if (error || !entry) {
    return null
  }

  return entry as LeaderboardEntry
}

export async function getLeaderboard(
  period: 'daily' | 'weekly' | 'all_time',
  limit: number = 100
): Promise<LeaderboardEntry[]> {
  const supabase = await createClient()

  const { data: entries, error } = await (supabase
    .from('air_leaderboards') as any)
    .select('*')
    .eq('period', period)
    .order('score', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('Error fetching leaderboard:', error)
    return []
  }

  return (entries || []) as LeaderboardEntry[]
}
