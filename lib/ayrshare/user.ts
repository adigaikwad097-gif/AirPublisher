/**
 * Ayrshare User Profile Management
 * Handles creating and managing Ayrshare profiles for each user
 */

import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { Database } from '@/lib/supabase/types'

export interface AyrshareUserProfile {
  id: string
  user_id: string
  creator_unique_identifier: string
  ayrshare_profile_id: string
  ayrshare_profile_key: string | null
  created_at: string
  updated_at: string
}

/**
 * Get Ayrshare profile for a user
 */
export async function getAyrshareProfile(
  creatorUniqueIdentifier: string
): Promise<AyrshareUserProfile | null> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('ayrshare_profiles')
    .select('*')
    .eq('creator_unique_identifier', creatorUniqueIdentifier)
    .maybeSingle()

  if (error) {
    console.error('Error fetching Ayrshare profile:', error)
    return null
  }

  return data as AyrshareUserProfile | null
}

/**
 * Create Ayrshare profile for a user
 * This should be called when user first signs up or visits settings
 */
export async function createAyrshareProfile(
  userId: string,
  creatorUniqueIdentifier: string,
  profileName: string,
  email?: string
): Promise<AyrshareUserProfile | null> {
  const masterApiKey = process.env.AYRSHARE_API_KEY
  if (!masterApiKey) {
    throw new Error('AYRSHARE_API_KEY not configured')
  }

  // Check if profile already exists
  const existing = await getAyrshareProfile(creatorUniqueIdentifier)
  if (existing) {
    return existing
  }

  // Create profile via Ayrshare API
  // Note: This requires Business Plan
  const response = await fetch('https://api.ayrshare.com/api/profiles', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${masterApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      profileName: profileName,
      email: email,
    }),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Unknown error' }))
    console.error('Error creating Ayrshare profile:', error)
    
    // If Business Plan not available, return null (user can still use master API key)
    if (response.status === 403 || response.status === 401) {
      console.warn('Ayrshare Business Plan may not be enabled. Using master API key for all users.')
      return null
    }
    
    throw new Error(`Failed to create Ayrshare profile: ${error.message || response.statusText}`)
  }

  const data = await response.json()
  const { profileId, profileKey } = data

  // Store in database
  const serviceClient = createServiceClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: profile, error: insertError } = await serviceClient
    .from('ayrshare_profiles')
    .insert({
      user_id: userId,
      creator_unique_identifier: creatorUniqueIdentifier,
      ayrshare_profile_id: profileId,
      ayrshare_profile_key: profileKey || null,
    })
    .select()
    .single()

  if (insertError) {
    console.error('Error storing Ayrshare profile:', insertError)
    throw new Error('Failed to store Ayrshare profile')
  }

  return profile as AyrshareUserProfile
}

/**
 * Get or create Ayrshare profile for a user
 */
export async function getOrCreateAyrshareProfile(
  userId: string,
  creatorUniqueIdentifier: string,
  profileName: string,
  email?: string
): Promise<AyrshareUserProfile | null> {
  // Try to get existing profile
  const existing = await getAyrshareProfile(creatorUniqueIdentifier)
  if (existing) {
    return existing
  }

  // Create new profile
  try {
    return await createAyrshareProfile(userId, creatorUniqueIdentifier, profileName, email)
  } catch (error: any) {
    console.error('Error creating Ayrshare profile:', error)
    // If creation fails (e.g., no Business Plan), return null
    // App can fall back to using master API key
    return null
  }
}


