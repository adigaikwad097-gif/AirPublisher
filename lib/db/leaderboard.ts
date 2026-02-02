import { createClient } from '@/lib/supabase/server'
import { Database } from '@/lib/supabase/types'

type LeaderboardEntry = Database['public']['Tables']['air_leaderboards']['Row']
type LeaderboardInsert = Database['public']['Tables']['air_leaderboards']['Insert']

export async function getLeaderboard(
  period: 'daily' | 'weekly' | 'all_time',
  limit: number = 100
) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('air_leaderboards')
    .select('*')
    .eq('period', period)
    .order('score', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('Error fetching leaderboard:', error)
    return []
  }

  if (!data || data.length === 0) {
    return []
  }

  // Fetch creator profiles separately
  const creatorIds = (data as any[]).map((entry: any) => entry.creator_unique_identifier)
  const { data: profiles, error: profileError } = await supabase
    .from('creator_profiles')
    .select('unique_identifier, handles, profile_pic_url, Niche')
    .in('unique_identifier', creatorIds)
  
  if (profileError) {
    console.error('Error fetching creator profiles:', profileError)
  }

  const profileMap = new Map(
    (profiles as any[])?.map((p: any) => [p.unique_identifier, p]) || []
  )

  return (data as any[]).map((entry: any, index: number) => {
    const profile = profileMap.get(entry.creator_unique_identifier) as any
    return {
      ...entry,
      rank: entry.rank || index + 1, // Use existing rank or calculate from index
      creator_profiles: {
        unique_identifier: entry.creator_unique_identifier,
        display_name: profile?.handles || null, // Map 'handles' to 'display_name'
        avatar_url: profile?.profile_pic_url || null, // Map 'profile_pic_url' to 'avatar_url'
        niche: profile?.Niche || null, // Map 'Niche' (capitalized) to 'niche'
      },
    }
  }) as (LeaderboardEntry & {
    rank: number
    creator_profiles: {
      unique_identifier: string
      display_name: string | null
      avatar_url: string | null
      niche: string | null
    }
  })[]
}

export async function getCreatorRank(
  creatorUniqueIdentifier: string,
  period: 'daily' | 'weekly' | 'all_time'
) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('air_leaderboards')
    .select('*')
    .eq('creator_unique_identifier', creatorUniqueIdentifier)
    .eq('period', period)
    .single()

  if (error && error.code !== 'PGRST116') throw error
  return data as LeaderboardEntry | null
}

export async function getLeaderboardByNiche(
  niche: string,
  period: 'daily' | 'weekly' | 'all_time',
  limit: number = 50
) {
  const supabase = await createClient()
  
  // First get creators in this niche
  // Note: Your table uses 'Niche' (capitalized)
  const { data: creators } = await supabase
    .from('creator_profiles')
    .select('unique_identifier')
    .eq('Niche', niche) // Use 'Niche' (capitalized)

  if (!creators || creators.length === 0) {
    return []
  }

  const creatorIds = (creators as any[]).map((c: any) => c.unique_identifier)

  // Then get leaderboard entries for these creators
  const { data, error } = await supabase
    .from('air_leaderboards')
    .select('*')
    .eq('period', period)
    .in('creator_unique_identifier', creatorIds)
    .order('score', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('Error fetching niche leaderboard:', error)
    return []
  }

  if (!data || data.length === 0) {
    return []
  }

  // Fetch creator profiles
  const { data: profiles, error: profileError } = await supabase
    .from('creator_profiles')
    .select('unique_identifier, handles, profile_pic_url, Niche')
    .in('unique_identifier', creatorIds)
  
  if (profileError) {
    console.error('Error fetching creator profiles:', profileError)
  }

  const profileMap = new Map(
    (profiles as any[])?.map((p: any) => [p.unique_identifier, p]) || []
  )

  return (data as any[]).map((entry: any, index: number) => {
    const profile = profileMap.get(entry.creator_unique_identifier) as any
    return {
      ...entry,
      rank: entry.rank || index + 1, // Use existing rank or calculate from index
      creator_profiles: {
        unique_identifier: entry.creator_unique_identifier,
        display_name: profile?.handles || null, // Map 'handles' to 'display_name'
        avatar_url: profile?.profile_pic_url || null, // Map 'profile_pic_url' to 'avatar_url'
        niche: profile?.Niche || null, // Map 'Niche' (capitalized) to 'niche'
      },
    }
  }) as (LeaderboardEntry & {
    rank: number
    creator_profiles: {
      unique_identifier: string
      display_name: string | null
      avatar_url: string | null
      niche: string | null
    }
  })[]
}

/**
 * Calculate leaderboard score based on:
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
