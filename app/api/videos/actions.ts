'use server'

import { createClient } from '@/lib/supabase/server'
import { getCurrentCreator } from '@/lib/db/creator'
import { createVideo, updateVideo } from '@/lib/db/videos'
import { Database } from '@/lib/supabase/types'

type VideoInsert = Database['public']['Tables']['air_publisher_videos']['Insert']
type VideoUpdate = Database['public']['Tables']['air_publisher_videos']['Update']

export async function createVideoAction(video: VideoInsert) {
  const creator = await getCurrentCreator()
  if (!creator) {
    throw new Error('Unauthorized')
  }

  // Ensure the creator_unique_identifier matches
  const videoData: VideoInsert = {
    ...video,
    creator_unique_identifier: creator.unique_identifier,
  }

  return createVideo(videoData)
}

export async function updateVideoAction(id: string, updates: VideoUpdate) {
  const creator = await getCurrentCreator()
  if (!creator) {
    throw new Error('Unauthorized')
  }

  // Verify ownership
  const supabase = await createClient()
  const { data: video } = await supabase
    .from('air_publisher_videos')
    .select('creator_unique_identifier')
    .eq('id', id)
    .single()

  if (!video || video.creator_unique_identifier !== creator.unique_identifier) {
    throw new Error('Unauthorized')
  }

  return updateVideo(id, updates)
}

export async function scheduleVideoAction(
  id: string,
  scheduledAt: string,
  platformTarget: 'youtube' | 'instagram' | 'tiktok' | 'internal'
) {
  return updateVideoAction(id, {
    scheduled_at: scheduledAt,
    platform_target: platformTarget,
    status: 'scheduled',
  })
}

export async function postVideoAction(id: string) {
  // Update status to 'scheduled' with immediate time
  // n8n will pick this up and post it immediately
  const now = new Date()
  return updateVideoAction(id, {
    scheduled_at: now.toISOString(),
    status: 'scheduled',
  })
  // Note: n8n workflow will handle actual posting and update status via webhook
}

