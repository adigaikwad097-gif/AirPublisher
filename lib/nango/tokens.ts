/**
 * Nango Token Management
 * Syncs tokens from Nango to Supabase
 */

import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { Database } from '@/lib/supabase/types'
import { getNangoClient } from './client'
import type { Platform } from './client'

export interface NangoConnection {
  id: string
  connection_id: string
  provider: string
  credentials: {
    type: 'oauth2'
    access_token: string
    refresh_token?: string
    expires_at?: number
    raw: Record<string, any>
  }
  metadata?: Record<string, any>
}

/**
 * Get connection from Nango
 */
export async function getNangoConnection(
  userId: string,
  platform: Platform
): Promise<NangoConnection | null> {
  const nango = getNangoClient()
  const connectionId = `${userId}_${platform}`
  const provider = platform === 'youtube' ? 'google' : platform === 'instagram' ? 'facebook' : 'tiktok'

  try {
    const connection = await nango.getConnection(provider, connectionId)
    return connection as NangoConnection
  } catch (error: any) {
    if (error.status === 404) {
      return null
    }
    throw error
  }
}

/**
 * Sync Nango connection to Supabase token table
 */
export async function syncNangoConnectionToSupabase(
  userId: string,
  creatorUniqueIdentifier: string,
  platform: Platform,
  connection: NangoConnection
): Promise<void> {
  const serviceClient = createServiceClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { credentials, metadata } = connection
  const expiresAt = credentials.expires_at
    ? new Date(credentials.expires_at * 1000).toISOString()
    : null

  // Map to platform-specific token table structure
  if (platform === 'youtube') {
    const tokenData: Record<string, any> = {
      user_id: userId,
      creator_unique_identifier: creatorUniqueIdentifier,
      google_access_token: credentials.access_token,
      google_refresh_token: credentials.refresh_token || null,
      token_type: 'Bearer',
      expires_at: expiresAt,
      updated_at: new Date().toISOString(),
      // Extract channel info from metadata if available
      channel_id: metadata?.channel_id || null,
      handle: metadata?.channel_title || null,
    }

    // Check if exists
    const { data: existing } = await serviceClient
      .from('youtube_tokens')
      .select('user_id')
      .eq('user_id', userId)
      .maybeSingle()

    if (existing) {
      await serviceClient
        .from('youtube_tokens')
        .update(tokenData)
        .eq('user_id', userId)
    } else {
      await serviceClient
        .from('youtube_tokens')
        .insert(tokenData)
    }
  } else if (platform === 'instagram') {
    const tokenData: Record<string, any> = {
      user_id: userId,
      creator_unique_identifier: creatorUniqueIdentifier,
      access_token: credentials.access_token,
      expires_at: expiresAt,
      updated_at: new Date().toISOString(),
      instagram_id: metadata?.instagram_business_account_id || null,
      username: metadata?.username || null,
      page_id: metadata?.page_id || null,
    }

    const { data: existing } = await serviceClient
      .from('instagram_tokens')
      .select('user_id')
      .eq('user_id', userId)
      .maybeSingle()

    if (existing) {
      await serviceClient
        .from('instagram_tokens')
        .update(tokenData)
        .eq('user_id', userId)
    } else {
      await serviceClient
        .from('instagram_tokens')
        .insert(tokenData)
    }
  } else if (platform === 'tiktok') {
    const tokenData: Record<string, any> = {
      user_id: userId,
      creator_unique_identifier: creatorUniqueIdentifier,
      access_token: credentials.access_token,
      refresh_token: credentials.refresh_token || null,
      expires_at: expiresAt,
      updated_at: new Date().toISOString(),
      tiktok_open_id: metadata?.open_id || null,
      display_name: metadata?.display_name || null,
    }

    const { data: existing } = await serviceClient
      .from('tiktok_tokens')
      .select('user_id')
      .eq('user_id', userId)
      .maybeSingle()

    if (existing) {
      await serviceClient
        .from('tiktok_tokens')
        .update(tokenData)
        .eq('user_id', userId)
    } else {
      await serviceClient
        .from('tiktok_tokens')
        .insert(tokenData)
    }
  }
}

/**
 * Get tokens from Supabase (synced from Nango)
 */
export async function getPlatformTokens(
  creatorUniqueIdentifier: string,
  platform: Platform
): Promise<any> {
  const supabase = await createClient()
  const tableName = `${platform}_tokens`

  const { data, error } = await supabase
    .from(tableName)
    .select('*')
    .eq('creator_unique_identifier', creatorUniqueIdentifier)
    .maybeSingle()

  if (error || !data) {
    return null
  }

  return data
}


