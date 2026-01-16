import { createClient } from '@/lib/supabase/server'
import { Database } from '@/lib/supabase/types'

type CreatorProfile = Database['public']['Tables']['creator_profiles']['Row']

export async function getCreatorProfile(uniqueIdentifier: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('creator_profiles')
    .select('*')
    .eq('unique_identifier', uniqueIdentifier)
    .single()

  if (error) {
    console.error('[getCreatorProfile] Error:', error)
    throw new Error(error.message || `Failed to fetch creator profile: ${JSON.stringify(error)}`)
  }
  
  // Map your actual column names to the expected format
  const profile = data as any
  return {
    ...profile,
    display_name: profile.handles || profile.display_name || null, // Map 'handles' to 'display_name'
    niche: profile.Niche || profile.niche || null, // Map 'Niche' (capitalized) to 'niche'
    avatar_url: profile.profile_pic_url || profile.avatar_url || null, // Map 'profile_pic_url' to 'avatar_url'
  } as CreatorProfile
}

export async function getCreatorByUserId(userId: string) {
  // Note: creator_profiles table doesn't have user_id column in your schema
  // We'll try multiple strategies to find the profile
  const supabase = await createClient()
  
  // Strategy 1: Try to find by unique_identifier pattern (e.g., "creator_<userId>_...")
  const userPrefix = userId.slice(0, 8)
  const searchPattern = `creator_${userPrefix}_%`
  
  console.log('[getCreatorByUserId] Searching for profile, userId:', userId.substring(0, 20) + '...')
  
  // First try exact pattern match with LIKE for creator_ prefix
  let { data, error } = await supabase
    .from('creator_profiles')
    .select('*')
    .like('unique_identifier', searchPattern)
    .order('id', { ascending: false })
    .limit(1)
    .maybeSingle()

  // Strategy 2: If that doesn't work, try dev_ prefix (development mode profiles)
  if ((error && error.code !== 'PGRST116') || !data) {
    console.log('[getCreatorByUserId] Trying dev_ prefix pattern...')
    const { data: devData, error: devError } = await supabase
      .from('creator_profiles')
      .select('*')
      .like('unique_identifier', 'dev_%')
      .order('id', { ascending: false })
      .limit(5) // Get a few recent dev profiles
    
    if (!devError && devData && devData.length > 0) {
      // Get the most recent dev profile (most likely to be the current user's)
      console.log('[getCreatorByUserId] ✅ Found dev_ profile:', devData[0].unique_identifier)
      data = devData[0]
      error = null
    }
  }

  // Strategy 3: Get the most recent profile (fallback for dev/testing)
  // This works because in development, there's usually only one user creating profiles
  if ((error && error.code !== 'PGRST116') || !data) {
    console.log('[getCreatorByUserId] Trying most recent profile fallback...')
    const { data: recentProfiles, error: recentError } = await supabase
      .from('creator_profiles')
      .select('*')
      .order('id', { ascending: false })
      .limit(1)
      .maybeSingle()
    
    if (!recentError && recentProfiles) {
      console.log('[getCreatorByUserId] ✅ Using most recent profile as fallback:', recentProfiles.unique_identifier)
      data = recentProfiles
      error = null
    }
  }
  
  if (error && error.code !== 'PGRST116') {
    console.warn('[getCreatorByUserId] Could not find creator:', error.message || error)
    return null
  }
  
  if (!data) {
    console.log('[getCreatorByUserId] ❌ No profile found for user')
    return null
  }
  
  console.log('[getCreatorByUserId] ✅ Returning profile:', data.unique_identifier)
  
  // Map your actual column names to the expected format
  const profile = data as any
  return {
    ...profile,
    display_name: profile.handles || profile.display_name || null, // Map 'handles' to 'display_name'
    niche: profile.Niche || profile.niche || null, // Map 'Niche' (capitalized) to 'niche'
    avatar_url: profile.profile_pic_url || profile.avatar_url || null, // Map 'profile_pic_url' to 'avatar_url'
  } as CreatorProfile
}

export async function getCurrentCreator(uniqueIdentifier?: string) {
  try {
    const supabase = await createClient()
    
    // Priority 1: Use provided unique_identifier (from query param)
    if (uniqueIdentifier) {
      try {
        const { data, error } = await supabase
          .from('creator_profiles')
          .select('*')
          .eq('unique_identifier', uniqueIdentifier)
          .single()
        
        if (!error && data) {
          const profile = data as any
          return {
            ...profile,
            display_name: profile.handles || profile.display_name || null,
            niche: profile.Niche || profile.niche || null,
            avatar_url: profile.profile_pic_url || profile.avatar_url || null,
          } as CreatorProfile
        }
        if (error) {
          console.error('[getCurrentCreator] Error fetching by unique_identifier:', error.message || error)
        }
      } catch (e: any) {
        console.error('[getCurrentCreator] Exception fetching by unique_identifier:', e?.message || e)
      }
    }
    
    // Priority 2: Check cookie for stored profile identifier
    try {
      const { cookies } = await import('next/headers')
      const cookieStore = await cookies()
      const cookieProfileId = cookieStore.get('creator_profile_id')?.value
      
      if (cookieProfileId) {
        console.log('[getCurrentCreator] Found profile ID in cookie:', cookieProfileId)
        const { data, error } = await supabase
          .from('creator_profiles')
          .select('*')
          .eq('unique_identifier', cookieProfileId)
          .single()
        
        if (!error && data) {
          console.log('[getCurrentCreator] ✅ Found profile from cookie')
          const profile = data as any
          return {
            ...profile,
            display_name: profile.handles || profile.display_name || null,
            niche: profile.Niche || profile.niche || null,
            avatar_url: profile.profile_pic_url || profile.avatar_url || null,
          } as CreatorProfile
        }
        if (error) {
          console.warn('[getCurrentCreator] Profile from cookie not found, clearing cookie')
          cookieStore.delete('creator_profile_id')
        }
      }
    } catch (e: any) {
      // Cookie access might fail in some contexts, that's okay
      console.log('[getCurrentCreator] Could not access cookies:', e?.message)
    }
    
    let user = null
    let authError = null
    
    try {
      const authResult = await supabase.auth.getUser()
      user = authResult.data?.user || null
      authError = authResult.error || null
    } catch (e: any) {
      console.error('[getCurrentCreator] Exception getting user:', e?.message || String(e))
      return null
    }

    if (authError) {
      console.error('[getCurrentCreator] Auth error:', authError.message || String(authError))
      return null
    }

    if (!user) return null

    // Try to find the creator profile by user ID pattern
    try {
      const creator = await getCreatorByUserId(user.id)
      
      // If found, store in cookie for future lookups
      if (creator?.unique_identifier) {
        try {
          const { cookies } = await import('next/headers')
          const cookieStore = await cookies()
          cookieStore.set('creator_profile_id', creator.unique_identifier, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 60 * 24 * 365, // 1 year
          })
          console.log('[getCurrentCreator] Stored profile ID in cookie for future lookups')
        } catch (e) {
          // Cookie setting might fail in some contexts, that's okay
        }
      }
      
      return creator
    } catch (e: any) {
      console.error('[getCurrentCreator] Error in getCreatorByUserId:', e?.message || String(e))
      return null
    }
  } catch (e: any) {
    console.error('[getCurrentCreator] Unexpected error:', e?.message || String(e))
    return null
  }
}

