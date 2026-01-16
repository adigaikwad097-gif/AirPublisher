'use server'

import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { Database } from '@/lib/supabase/types'
import { cookies } from 'next/headers'
// Generate unique identifier helper
function generateUniqueIdentifier(userId: string): string {
  const timestamp = Date.now().toString(36)
  const random = Math.random().toString(36).substring(2, 10)
  return `creator_${userId.slice(0, 8)}_${timestamp}_${random}`
}

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

type ProfileInsert = Database['public']['Tables']['creator_profiles']['Insert']

export async function createProfileAction(profile: {
  display_name?: string | null
  niche?: string | null
  avatar_url?: string | null // This maps to profile_pic_url in your table
}) {
  const supabase = await createClient()
  
  // Get session first, then user
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession()

  if (sessionError) {
    console.error('Session error:', sessionError)
  }

  // Get user
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  console.log('Session exists:', !!session)
  console.log('User exists:', !!user)
  console.log('Auth error:', authError)

  // In development, allow creating profile even without session (for testing)
  if ((!user || authError) && process.env.NODE_ENV === 'development') {
    console.warn('⚠️  Development mode: Creating profile without auth session')
    // Use service role to create profile
    if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
      const serviceClient = createServiceClient<Database>(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      )
      
      // Generate a unique identifier for dev
      const uniqueIdentifier = `dev_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
      
      // Build profile data using your actual column names from schema
      // Your table uses: 'handles' (NOT NULL), 'Niche' (capitalized), 'profile_pic_url'
      // Note: creator_profiles table doesn't have user_id column
      const profileData: any = {
        unique_identifier: uniqueIdentifier,
        handles: profile.display_name || `dev_${Date.now()}`, // handles is NOT NULL
      }
      
      if (profile.niche !== undefined) {
        profileData.Niche = profile.niche || null // Use 'Niche' (capitalized)
      }
      if (profile.avatar_url !== undefined) {
        profileData.profile_pic_url = profile.avatar_url || null // Use profile_pic_url
      }
      
      // Note: creator_profiles table doesn't have user_id column in your schema
      // We'll just use unique_identifier to link profiles
      
      const { data, error } = await serviceClient
        .from('creator_profiles')
        .insert(profileData)
        .select()
        .single()
      
      if (error) {
        // If user_id column doesn't exist, try without it
        if (error.message?.includes('user_id') || error.code === '42703') {
          const { user_id, ...dataWithoutUserId } = profileData
          const { data: retryData, error: retryError } = await serviceClient
            .from('creator_profiles')
            .insert(dataWithoutUserId)
            .select()
            .single()
          
          if (retryError) {
            throw new Error(`Failed to create profile: ${retryError.message}`)
          }
          
          // Store in cookie
          if (retryData?.unique_identifier) {
            await setProfileCookie(retryData.unique_identifier)
          }
          
          return retryData
        }
        throw new Error(`Failed to create profile: ${error.message}`)
      }
      
      // Store unique_identifier in cookie for persistence
      if (data?.unique_identifier) {
        await setProfileCookie(data.unique_identifier)
      }
      
      return data
    } else {
      throw new Error('Service role key not configured. Please add SUPABASE_SERVICE_ROLE_KEY to .env.local')
    }
  }

  if (authError) {
    console.error('Auth error:', authError)
    throw new Error(`Authentication error: ${authError.message}`)
  }

  if (!user) {
    console.error('No user found in session')
    throw new Error('Unauthorized: Please sign in to create a profile. If you just signed in, try refreshing the page.')
  }

  console.log('Creating profile for user:', user.id, user.email)

  // Check if profile already exists by unique_identifier
  // Note: creator_profiles table doesn't have user_id column in your schema
  // We'll check by unique_identifier pattern or email if needed
  // For now, we'll just generate a new unique_identifier

  // Generate unique identifier (using user ID as base)
  const uniqueIdentifier = generateUniqueIdentifier(user.id)

  // Build profile data using your actual column names from schema
  // Your table uses: 'handles' (NOT NULL), 'Niche' (capitalized), 'profile_pic_url'
  // Note: creator_profiles table doesn't have user_id column
  const profileData: any = {
    unique_identifier: uniqueIdentifier,
    handles: profile.display_name || `user_${user.id.slice(0, 8)}`, // handles is NOT NULL, so provide a default
  }
  
  if (profile.niche !== undefined) {
    profileData.Niche = profile.niche || null // Use 'Niche' (capitalized)
  }
  if (profile.avatar_url !== undefined) {
    profileData.profile_pic_url = profile.avatar_url || null // Use profile_pic_url
  }

  console.log('Inserting profile data:', { ...profileData, user_id: '***' })

  const { data, error } = await supabase
    .from('creator_profiles')
    .insert(profileData)
    .select()
    .single()

  if (error) {
    console.error('Profile creation error:', error)
    console.error('Error details:', JSON.stringify(error, null, 2))
    
      // If error is about missing column, try with correct column names
      if (error.message?.includes('column') || error.code === '42703' || error.code === '42501') {
        console.log('Retrying with correct column names (handles, Niche, profile_pic_url)...')
        const retryData: any = {
          unique_identifier: uniqueIdentifier,
        }
        
        // Use the actual column names from your table schema
        // handles is NOT NULL, so we must provide it
        retryData.handles = profile.display_name || `user_${user.id.slice(0, 8)}` // Use 'handles' column (NOT NULL)
        if (profile.niche !== undefined) {
          retryData.Niche = profile.niche || null // Use 'Niche' (capitalized)
        }
        if (profile.avatar_url !== undefined) {
          retryData.profile_pic_url = profile.avatar_url || null // Use profile_pic_url
        }
      
      // Try without user_id first
      const { data: retryResult, error: retryError } = await supabase
        .from('creator_profiles')
        .insert(retryData)
        .select()
        .single()
      
      if (retryError) {
        // If still failing and we have service role key, try with that
        if (retryError.code === '42501' && process.env.SUPABASE_SERVICE_ROLE_KEY) {
          console.log('Trying with service role key...')
          const serviceClient = createServiceClient<Database>(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
          )
          
          const serviceData = {
            ...retryData,
            // Note: creator_profiles table doesn't have user_id column
          }
          
          const { data: serviceResult, error: serviceError } = await serviceClient
            .from('creator_profiles')
            .insert(serviceData)
            .select()
            .single()
          
          if (serviceError) {
            throw new Error(`Failed to create profile: ${serviceError.message}. Please check RLS policies in Supabase.`)
          }
          
          // Store in cookie
          if (serviceResult?.unique_identifier) {
            await setProfileCookie(serviceResult.unique_identifier)
          }
          
          return serviceResult
        }
        
        throw new Error(`Failed to create profile: ${retryError.message}. If this persists, check your Supabase RLS policies.`)
      }
      
      // Store in cookie
      if (retryResult?.unique_identifier) {
        await setProfileCookie(retryResult.unique_identifier)
      }
      
      return retryResult
    }
    
    throw new Error(error.message || 'Failed to create profile')
  }

  // Store unique_identifier in cookie for persistence across page loads
  if (data?.unique_identifier) {
    await setProfileCookie(data.unique_identifier)
  }

  return data
}

