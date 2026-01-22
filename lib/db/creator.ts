import { createClient } from '@/lib/supabase/server'
import { Database } from '@/lib/supabase/types'

type CreatorProfile = Database['public']['Tables']['creator_profiles']['Row']

export async function getCreatorProfile(uniqueIdentifier: string) {
  const supabase = await createClient()
  
  // Try airpublisher_creator_profiles first (main table)
  let { data, error } = await (supabase
    .from('airpublisher_creator_profiles') as any)
    .select('*')
    .eq('creator_unique_identifier', uniqueIdentifier)
    .maybeSingle()

  // Fallback to creator_profiles if not found
  if (error || !data) {
    const { data: fallbackData, error: fallbackError } = await supabase
      .from('creator_profiles')
      .select('*')
      .eq('unique_identifier', uniqueIdentifier)
      .maybeSingle()
    
    if (fallbackData && !fallbackError) {
      data = fallbackData
      error = null
    }
  }

  if (error || !data) {
    console.error('[getCreatorProfile] Error:', error)
    throw new Error(error?.message || `Failed to fetch creator profile: ${JSON.stringify(error)}`)
  }
  
  // Map your actual column names to the expected format
  const profile = data as any
  return {
    unique_identifier: profile.creator_unique_identifier || profile.unique_identifier,
    display_name: profile.handles || profile.display_name || null, // Map 'handles' to 'display_name'
    niche: profile.Niche || profile.niche || null, // Map 'Niche' (capitalized) to 'niche'
    avatar_url: profile.profile_pic_url || profile.avatar_url || null, // Map 'profile_pic_url' to 'avatar_url'
    created_at: profile.created_at,
    updated_at: profile.updated_at,
  } as CreatorProfile
}

export async function getCreatorByUserId(userId: string) {
  console.log('[getCreatorByUserId] Searching for userId:', userId)
  
  // Always try service role first to bypass RLS issues
  // This ensures we can find the profile even if RLS is blocking
  if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
    try {
      const { createClient: createServiceClient } = await import('@supabase/supabase-js')
      const serviceClient = createServiceClient<Database>(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      )
      
      console.log('[getCreatorByUserId] Querying with service role client...')
      const { data: serviceProfile, error: serviceError } = await (serviceClient
        .from('airpublisher_creator_profiles') as any)
        .select('*')
        .eq('user_id', userId)
        .maybeSingle()
      
      if (serviceError) {
        if (serviceError.code === 'PGRST116') {
          console.log('[getCreatorByUserId] Service role: No profile found (PGRST116) for userId:', userId)
        } else {
          console.error('[getCreatorByUserId] Service role error:', {
            code: serviceError.code,
            message: serviceError.message,
            details: serviceError.details,
            hint: serviceError.hint,
          })
        }
      } else if (serviceProfile) {
        console.log('[getCreatorByUserId] ✅ Found profile via service role:', {
          creator_unique_identifier: serviceProfile.creator_unique_identifier,
          handles: serviceProfile.handles,
          user_id: serviceProfile.user_id,
        })
        const profile = serviceProfile as any
        return {
          unique_identifier: profile.creator_unique_identifier,
          display_name: profile.handles || null,
          niche: profile.Niche || null,
          avatar_url: profile.profile_pic_url || null,
          created_at: profile.created_at,
          updated_at: profile.updated_at,
        } as CreatorProfile
      } else {
        console.log('[getCreatorByUserId] Service role returned no data for userId:', userId)
      }
    } catch (e: any) {
      console.error('[getCreatorByUserId] Service role exception:', e?.message || e)
    }
  }
  
  // Fallback to regular client (in case service role is not configured)
  const supabase = await createClient()
  console.log('[getCreatorByUserId] Trying regular client as fallback...')
  
  const { data: profileData, error: profileError } = await (supabase
    .from('airpublisher_creator_profiles') as any)
    .select('*')
    .eq('user_id', userId)
    .maybeSingle()
  
  console.log('[getCreatorByUserId] Regular client result:', {
    found: !!profileData,
    unique_identifier: profileData?.creator_unique_identifier || null,
    error: profileError?.message || null,
    errorCode: profileError?.code || null,
  })

  if (!profileError && profileData) {
    console.log('[getCreatorByUserId] ✅ Found profile via regular client:', profileData.creator_unique_identifier)
    const profile = profileData as any
    return {
      unique_identifier: profile.creator_unique_identifier,
      display_name: profile.handles || null,
      niche: profile.Niche || null,
      avatar_url: profile.profile_pic_url || null,
      created_at: profile.created_at,
      updated_at: profile.updated_at,
    } as CreatorProfile
  }
  
  if (profileError && profileError.code !== 'PGRST116') {
    console.warn('[getCreatorByUserId] Regular client error:', {
      code: profileError.code,
      message: profileError.message,
      details: profileError.details,
    })
  }
  
  console.log('[getCreatorByUserId] ❌ No profile found for userId:', userId)
  return null
}

export async function getCurrentCreator(uniqueIdentifier?: string) {
  try {
    const supabase = await createClient()
    
    // Priority 1: Use provided unique_identifier (from query param)
    if (uniqueIdentifier) {
      try {
        console.log('[getCurrentCreator] Looking up by provided unique_identifier:', uniqueIdentifier)
        const { data, error } = await (supabase
          .from('airpublisher_creator_profiles') as any)
          .select('*')
          .eq('creator_unique_identifier', uniqueIdentifier)
          .maybeSingle()
        
        if (!error && data) {
          console.log('[getCurrentCreator] ✅ Found profile by provided unique_identifier')
          const profile = data as any
          return {
            unique_identifier: profile.creator_unique_identifier,
            display_name: profile.handles || null,
            niche: profile.Niche || null,
            avatar_url: profile.profile_pic_url || null,
            created_at: profile.created_at,
            updated_at: profile.updated_at,
          } as CreatorProfile
        }
        if (error) {
          console.error('[getCurrentCreator] Error fetching by unique_identifier:', error.message || error)
        }
      } catch (e: any) {
        console.error('[getCurrentCreator] Exception fetching by unique_identifier:', e?.message || e)
      }
    }
    
    // Priority 2: Get authenticated user and find their creator profile by user_id
    // This is the main flow - user signs in, we get their user ID, then find their profile
    let user = null
    try {
      console.log('[getCurrentCreator] Getting authenticated user...')
      const authResult = await supabase.auth.getUser()
      user = authResult.data?.user || null
      
      if (user && user.id) {
        console.log('[getCurrentCreator] ✅ Found authenticated user:', {
          id: user.id,
          email: user.email,
        })
        
        // Use user ID to find creator profile
        const creator = await getCreatorByUserId(user.id)
        
        if (creator) {
          console.log('[getCurrentCreator] ✅ Found creator profile for user:', creator.unique_identifier)
          
          // Store profile ID in cookie for future lookups
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
            console.warn('[getCurrentCreator] Could not set cookie:', e)
          }
          
          return creator
        } else {
          console.log('[getCurrentCreator] ⚠️ No creator profile found for user ID:', user.id)
        }
      } else {
        console.log('[getCurrentCreator] ⚠️ No authenticated user found')
      }
    } catch (e: any) {
      console.error('[getCurrentCreator] Error getting user:', e?.message || e)
    }

    // Priority 3: Check cookie for stored profile identifier (fallback)
    // Only use if we have a user ID to validate it belongs to them
    if (user?.id) {
      try {
        const { cookies } = await import('next/headers')
        const cookieStore = await cookies()
        const cookieProfileId = cookieStore.get('creator_profile_id')?.value
        
        if (cookieProfileId) {
          console.log('[getCurrentCreator] Found profile ID in cookie, validating it belongs to user...')
          
          // Validate cookie profile belongs to current user
          const { data, error } = await (supabase
            .from('airpublisher_creator_profiles') as any)
            .select('*')
            .eq('user_id', user.id)
            .eq('creator_unique_identifier', cookieProfileId)
            .maybeSingle()
          
          if (!error && data) {
            console.log('[getCurrentCreator] ✅ Found profile from cookie (validated)')
            const profile = data as any
            return {
              unique_identifier: profile.creator_unique_identifier,
              display_name: profile.handles || null,
              niche: profile.Niche || null,
              avatar_url: profile.profile_pic_url || null,
              created_at: profile.created_at,
              updated_at: profile.updated_at,
            } as CreatorProfile
          } else {
            // Cookie profile doesn't belong to current user - clear it
            console.warn('[getCurrentCreator] ⚠️ Cookie profile does not belong to current user. Clearing cookie.')
            try {
              cookieStore.delete('creator_profile_id')
            } catch (e) {
              // Ignore cookie deletion errors
            }
          }
        }
      } catch (e: any) {
        // Cookie access might fail in some contexts, that's okay
        console.log('[getCurrentCreator] Could not access cookies:', e?.message)
      }
    }
    
    // No creator profile found for this user
    console.log('[getCurrentCreator] ❌ No creator profile found for authenticated user')
    return null
  } catch (e: any) {
    console.error('[getCurrentCreator] Unexpected error:', e?.message || String(e))
    return null
  }
}

