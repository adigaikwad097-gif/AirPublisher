import { createClient } from '@/lib/supabase/server'
import { Database } from '@/lib/supabase/types'

type Video = Database['public']['Tables']['air_publisher_videos']['Row']
type VideoInsert = Database['public']['Tables']['air_publisher_videos']['Insert']
type VideoUpdate = Database['public']['Tables']['air_publisher_videos']['Update']

export async function getVideosByCreator(creatorUniqueIdentifier: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('air_publisher_videos')
    .select('*')
    .eq('creator_unique_identifier', creatorUniqueIdentifier)
    .order('created_at', { ascending: false })

  if (error) {
    // If table doesn't exist, return empty array instead of throwing
    if (error.code === '42P01' || error.message?.includes('does not exist')) {
      console.warn('[videos] Table air_publisher_videos does not exist yet. Run the migration: supabase/migrations/001_create_air_publisher_tables.sql')
      return []
    }
    console.error('[videos] Error:', error)
    throw new Error(error.message || `Database error: ${JSON.stringify(error)}`)
  }
  return (data || []) as Video[]
}

export async function getVideoById(id: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('air_publisher_videos')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    // If table doesn't exist, return null instead of throwing
    if (error.code === '42P01' || error.message?.includes('does not exist')) {
      console.warn('[videos] Table air_publisher_videos does not exist yet. Run the migration: supabase/migrations/001_create_air_publisher_tables.sql')
      return null
    }
    // If not found (PGRST116), return null
    if (error.code === 'PGRST116') {
      return null
    }
    console.error('[videos] Error:', error)
    throw new Error(error.message || `Database error: ${JSON.stringify(error)}`)
  }
  return data as Video
}

export async function createVideo(video: VideoInsert) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('air_publisher_videos')
    .insert(video)
    .select()
    .single()

  if (error) {
    // If table doesn't exist, provide helpful error message
    if (error.code === '42P01' || error.message?.includes('does not exist')) {
      const errorMsg = 'Table air_publisher_videos does not exist. Please run the migration: supabase/migrations/001_create_air_publisher_tables.sql or see SETUP_TABLES.md'
      console.error('[videos]', errorMsg)
      throw new Error(errorMsg)
    }
    console.error('[videos] Error:', error)
    throw new Error(error.message || `Database error: ${JSON.stringify(error)}`)
  }
  return data as Video
}

export async function updateVideo(id: string, updates: VideoUpdate) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('air_publisher_videos')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    // If table doesn't exist, provide helpful error message
    if (error.code === '42P01' || error.message?.includes('does not exist')) {
      const errorMsg = 'Table air_publisher_videos does not exist. Please run the migration: supabase/migrations/001_create_air_publisher_tables.sql or see SETUP_TABLES.md'
      console.error('[videos]', errorMsg)
      throw new Error(errorMsg)
    }
    // If not found (PGRST116), return null
    if (error.code === 'PGRST116') {
      return null
    }
    console.error('[videos] Error:', error)
    throw new Error(error.message || `Database error: ${JSON.stringify(error)}`)
  }
  return data as Video
}

export async function getScheduledVideos(creatorUniqueIdentifier?: string) {
  const supabase = await createClient()
  let query = supabase
    .from('air_publisher_videos')
    .select('*')
    .eq('status', 'scheduled')
    .not('scheduled_at', 'is', null)
    .order('scheduled_at', { ascending: true })

  if (creatorUniqueIdentifier) {
    query = query.eq('creator_unique_identifier', creatorUniqueIdentifier)
  }

  const { data, error } = await query

  if (error) {
    // If table doesn't exist, return empty array instead of throwing
    if (error.code === '42P01' || error.message?.includes('does not exist')) {
      console.warn('[videos] Table air_publisher_videos does not exist yet. Run the migration: supabase/migrations/001_create_air_publisher_tables.sql')
      return []
    }
    console.error('[videos] Error:', error)
    throw new Error(error.message || `Database error: ${JSON.stringify(error)}`)
  }
  return (data || []) as Video[]
}

