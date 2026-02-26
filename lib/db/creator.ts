import { supabase } from '@/lib/supabase/client'
import { getCreatorId } from '@/lib/auth/session'

export interface CreatorProfile {
  unique_identifier: string
  display_name: string | null
  niche: string | null
  avatar_url: string | null
  created_at: string
  updated_at: string
}

export async function getCreatorProfile(uniqueIdentifier: string): Promise<CreatorProfile> {
  const { data, error } = await (supabase
    .from('creator_profiles'))
    .select('*')
    .eq('unique_identifier', uniqueIdentifier)
    .maybeSingle()

  if (error || !data) {
    console.error('[getCreatorProfile] Error:', error)
    throw new Error(error?.message || `Failed to fetch creator profile: ${JSON.stringify(error)}`)
  }

  return {
    unique_identifier: data.unique_identifier,
    display_name: data.handles,
    niche: data.Niche,
    avatar_url: data.profile_pic_url,
    created_at: data.created_at,
    updated_at: data.updated_at,
  }
}

export async function getCreatorByUserId(userId: string): Promise<CreatorProfile | null> {
  console.log('[getCreatorByUserId] Searching for userId:', userId)

  // Always try service role first to bypass RLS issues
  const serviceKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY || import.meta.env.SUPABASE_SERVICE_ROLE_KEY
  if (serviceKey) {
    try {
      const { createClient: createServiceClient } = await import('@supabase/supabase-js')
      const serviceClient = createServiceClient(
        import.meta.env.VITE_SUPABASE_URL,
        serviceKey
      )

      console.log('[getCreatorByUserId] Querying with service role client...')
      const { data, error } = await (serviceClient
        .from('creator_profiles'))
        .select('*')
        .eq('user_id', userId)
        .maybeSingle()

      if (error && error.code !== 'PGRST116') {
        console.error('[getCreatorByUserId] Service role error:', error)
      } else if (data) {
        console.log('[getCreatorByUserId] ✅ Found profile via service role:', data.unique_identifier)
        return {
          unique_identifier: data.unique_identifier,
          display_name: data.handles,
          niche: data.Niche,
          avatar_url: data.profile_pic_url,
          created_at: data.created_at,
          updated_at: data.updated_at,
        }
      }
    } catch (e: any) {
      console.error('[getCreatorByUserId] Service role exception:', e?.message || e)
    }
  }

  // Fallback to regular client
  console.log('[getCreatorByUserId] Trying regular client as fallback...')

  const { data, error } = await (supabase
    .from('creator_profiles'))
    .select('*')
    .eq('user_id', userId)
    .maybeSingle()

  if (!error && data) {
    console.log('[getCreatorByUserId] ✅ Found profile via regular client:', data.unique_identifier)
    return {
      unique_identifier: data.unique_identifier,
      display_name: data.handles,
      niche: data.Niche,
      avatar_url: data.profile_pic_url,
      created_at: data.created_at,
      updated_at: data.updated_at,
    }
  }

  console.log('[getCreatorByUserId] ❌ No profile found for userId:', userId)
  return null
}

export async function getCurrentCreator(uniqueIdentifier?: string) {
  try {
    // Priority 1: Use provided unique_identifier (from query param)
    if (uniqueIdentifier) {
      try {
        console.log('[getCurrentCreator] Looking up by provided unique_identifier:', uniqueIdentifier)
        const { data, error } = await (supabase
          .from('creator_profiles'))
          .select('*')
          .eq('unique_identifier', uniqueIdentifier)
          .maybeSingle()

        if (!error && data) {
          console.log('[getCurrentCreator] ✅ Found profile by provided unique_identifier')
          return {
            unique_identifier: data.unique_identifier,
            display_name: data.handles,
            niche: data.Niche,
            avatar_url: data.profile_pic_url,
            created_at: data.created_at,
            updated_at: data.updated_at,
          }
        }
        if (error) {
          console.error('[getCurrentCreator] Error fetching by unique_identifier:', error.message || error)
        }
      } catch (e: any) {
        console.error('[getCurrentCreator] Exception fetching by unique_identifier:', e?.message || e)
      }
    }

    // Priority 2: Check localStorage+cookie for stored profile identifier (Primary seamless auth method)
    if (!uniqueIdentifier) {
      const sessionId = getCreatorId()
      if (sessionId) {
        uniqueIdentifier = sessionId
        console.log('[getCurrentCreator] Found unique_identifier in session:', uniqueIdentifier)
      }
    }

    // If we have an identifier (from param or cookie), VALIDATE it exists in the DB
    if (uniqueIdentifier) {
      console.log('[getCurrentCreator] Validating unique_identifier:', uniqueIdentifier)
      try {
        const { data, error } = await (supabase
          .from('creator_profiles'))
          .select('*')
          .eq('unique_identifier', uniqueIdentifier)
          .maybeSingle()

        if (error) {
          console.error('[getCurrentCreator] ⚠️ Validation returned error:', error)
          console.error('[getCurrentCreator] Error details:', JSON.stringify(error, null, 2))
        }

        if (data && !error) {
          console.log('[getCurrentCreator] ✅ Validated profile exists for:', uniqueIdentifier)
          return {
            unique_identifier: data.unique_identifier,
            display_name: data.handles,
            niche: data.Niche,
            avatar_url: data.profile_pic_url,
            created_at: data.created_at,
            updated_at: data.updated_at,
          }
        } else {
          console.warn('[getCurrentCreator] ❌ Identifier provided but no profile found in DB')
          console.warn('[getCurrentCreator] Data was:', data)
        }
      } catch (e) {
        console.error('[getCurrentCreator] Validation exception:', e)
      }
    }

    // Priority 3: Fallback to Supabase Auth (Legacy / Admin access)
    // We keep this just in case there are still explicit logins occurring, but it's not the main flow anymore.
    let user = null
    try {
      const authResult = await supabase.auth.getUser()
      user = authResult.data?.user || null
      if (user) {
        console.log('[getCurrentCreator] Found authenticated Supabase user, attempting lookup by user_id...')
        return await getCreatorByUserId(user.id)
      }
    } catch (e) {
      // Ignore auth errors
    }

    // No creator profile found
    console.log('[getCurrentCreator] ❌ No creator profile found (checked param, cookie, and auth)')
    return null
  } catch (e: any) {
    console.error('[getCurrentCreator] Unexpected error:', e?.message || String(e))
    return null
  }
}

