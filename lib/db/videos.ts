import { createClient } from '@/lib/supabase/server'
import { Database } from '@/lib/supabase/types'

type Video = Database['public']['Tables']['air_publisher_videos']['Row']

export async function getVideosByCreator(creatorUniqueIdentifier: string): Promise<Video[]> {
  const supabase = await createClient()

  const { data: videos, error } = await (supabase
    .from('air_publisher_videos') as any)
    .select('*')
    .eq('creator_unique_identifier', creatorUniqueIdentifier)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching videos by creator:', error)
    return []
  }

  return videos || []
}

export async function getAllPostedVideos(): Promise<Video[]> {
  const supabase = await createClient()

  const { data: videos, error } = await (supabase
    .from('air_publisher_videos') as any)
    .select('*')
    .eq('status', 'posted')
    .order('posted_at', { ascending: false })

  if (error) {
    console.error('Error fetching posted videos:', error)
    return []
  }

  return videos || []
}

export async function getVideoById(videoId: string): Promise<Video | null> {
  const supabase = await createClient()

  const { data: video, error } = await (supabase
    .from('air_publisher_videos') as any)
    .select('*')
    .eq('id', videoId)
    .single()

  if (error || !video) {
    return null
  }

  return video as Video
}

export async function incrementVideoViews(videoId: string): Promise<Video | null> {
  const supabase = await createClient()

  // First get the current video to check if it exists
  const { data: video, error: fetchError } = await (supabase
    .from('air_publisher_videos') as any)
    .select('*')
    .eq('id', videoId)
    .single()

  if (fetchError || !video) {
    return null
  }

  // Increment views (if views column exists, otherwise just return the video)
  const currentViews = (video as any).views || 0
  const { data: updatedVideo, error: updateError } = await (supabase
    .from('air_publisher_videos') as any)
    .update({ views: currentViews + 1, updated_at: new Date().toISOString() })
    .eq('id', videoId)
    .select()
    .single()

  if (updateError) {
    console.error('Error incrementing video views:', updateError)
    return video as Video
  }

  return updatedVideo as Video
}

export async function getScheduledVideos(creatorUniqueIdentifier?: string): Promise<Video[]> {
  const supabase = await createClient()

  let query = (supabase
    .from('air_publisher_videos') as any)
    .select('*')
    .eq('status', 'scheduled')
    .order('scheduled_at', { ascending: true })

  if (creatorUniqueIdentifier) {
    query = query.eq('creator_unique_identifier', creatorUniqueIdentifier)
  }

  const { data: videos, error } = await query

  if (error) {
    console.error('Error fetching scheduled videos:', error)
    return []
  }

  return videos || []
}
