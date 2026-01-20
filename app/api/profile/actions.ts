'use server'

import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { Database } from '@/lib/supabase/types'
import { cookies } from 'next/headers'

// Helper to store profile ID in cookie
async function setProfileCookie(uniqueIdentifier: string) {
  try {
    const cookieStore = await cookies()
    cookieStore.set('creator_profile_id', uniqueIdentifier, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 365, // 1 year
    })
    console.log('[setProfileCookie] Stored profile ID in cookie:', uniqueIdentifier)
  } catch (e) {
    console.warn('[setProfileCookie] Could not set cookie:', e)
  }
}

export async function createProfileAction(profile: {
  display_name?: string | null
  niche?: string | null
  avatar_url?: string | null // This maps to profile_pic_url in your table
  user_id?: string | null // Optional: pass user ID from client if server can't detect session
}) {
  const supabase = await createClient()
  
  // Use getUser() directly (more reliable - validates token with Supabase server)
  // This is recommended by Supabase docs for server-side auth
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()
  
  // Also try getSession as fallback for debugging
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession()
  
  if (sessionError && process.env.NODE_ENV === 'development') {
    console.warn('[createProfileAction] Session error (non-critical):', sessionError)
  }

  console.log('[createProfileAction] Session exists:', !!session)
  console.log('[createProfileAction] User exists:', !!user)
  console.log('[createProfileAction] Auth error:', authError?.message || null)
  console.log('[createProfileAction] Client-provided user_id:', profile.user_id || null)

  // Use client-provided user_id if server can't detect session (development mode workaround)
  let userId = user?.id || profile.user_id || null
  
  // In development, if we have a user_id from client, use it even if server can't detect session
  const isDevelopment = process.env.NODE_ENV === 'development'
  
  if (!userId) {
    if (authError && !isDevelopment) {
      console.error('[createProfileAction] Auth error:', authError)
      throw new Error(`Authentication error: ${authError.message}`)
    }
    
    if (!isDevelopment) {
      console.error('[createProfileAction] No user found in session')
      throw new Error('Unauthorized: Please sign in to create a profile. If you just signed in, try refreshing the page.')
    } else {
      // Development mode: try to continue with service role if we have user_id from client
      if (profile.user_id) {
        console.warn('[createProfileAction] ⚠️ Development mode: Using client-provided user_id:', profile.user_id)
        userId = profile.user_id
      } else {
        throw new Error('No user ID available. Please sign in and try again.')
      }
    }
  }

  console.log('[createProfileAction] Creating profile for user:', userId, user?.email || 'email not available')

  // Insert directly into airpublisher_creator_profiles (main profile table)
  const profileData: any = {
    user_id: userId,
    handles: profile.display_name || `user_${userId.slice(0, 8)}`, // handles is NOT NULL
  }
  
  if (profile.niche !== undefined) {
    profileData.Niche = profile.niche || null // Use 'Niche' (capitalized)
  }
  if (profile.avatar_url !== undefined) {
    profileData.profile_pic_url = profile.avatar_url || null // Use profile_pic_url
  }

  console.log('[createProfileAction] Inserting profile data into airpublisher_creator_profiles:', { ...profileData, user_id: userId })

  const { data, error } = await (supabase
    .from('airpublisher_creator_profiles') as any)
    .insert(profileData)
    .select()
    .single()

  if (error) {
    console.error('Profile creation error:', error)
    console.error('Error details:', JSON.stringify(error, null, 2))
    
    // If RLS error, try with service role
    if (error.code === '42501' && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.log('Trying with service role key...')
      const serviceClient = createServiceClient<Database>(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      )
      
      const { data: serviceResult, error: serviceError } = await (serviceClient
        .from('airpublisher_creator_profiles') as any)
        .insert(profileData)
        .select()
        .single()
      
      if (serviceError) {
        throw new Error(`Failed to create profile: ${serviceError.message}. Please check RLS policies in Supabase.`)
      }
      
      // Store in cookie
      if (serviceResult?.creator_unique_identifier) {
        await setProfileCookie(serviceResult.creator_unique_identifier)
      }
      
      console.log('[createProfileAction] ✅ Profile created successfully (service role):', {
        unique_identifier: serviceResult?.creator_unique_identifier,
        handles: serviceResult?.handles,
        user_id: userId,
      })
      
      return {
        unique_identifier: serviceResult.creator_unique_identifier,
        handles: serviceResult.handles,
        Niche: serviceResult.Niche,
        profile_pic_url: serviceResult.profile_pic_url,
      }
    }
    
    throw new Error(error.message || 'Failed to create profile')
  }

  // Store unique_identifier in cookie for persistence across page loads
  if (data?.creator_unique_identifier) {
    await setProfileCookie(data.creator_unique_identifier)
  }

  console.log('[createProfileAction] ✅ Profile created successfully:', {
    unique_identifier: data?.creator_unique_identifier,
    handles: data?.handles,
    user_id: userId,
  })

  return {
    unique_identifier: data.creator_unique_identifier,
    handles: data.handles,
    Niche: data.Niche,
    profile_pic_url: data.profile_pic_url,
  }
}
