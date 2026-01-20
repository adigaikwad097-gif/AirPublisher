'use server'

import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { getCurrentCreator } from '@/lib/db/creator'
import { createVideo, updateVideo } from '@/lib/db/videos'
import { Database } from '@/lib/supabase/types'

type VideoInsert = Database['public']['Tables']['air_publisher_videos']['Insert']
type VideoUpdate = Database['public']['Tables']['air_publisher_videos']['Update']

export async function createVideoAction(video: VideoInsert) {
  console.log('[createVideoAction] Starting video creation...')
  
  const creator = await getCurrentCreator()
  if (!creator) {
    console.error('[createVideoAction] No creator found - unauthorized')
    throw new Error('Unauthorized: Please create a creator profile first')
  }

  console.log('[createVideoAction] Creator found:', creator.unique_identifier)

  // Ensure the creator_unique_identifier matches
  // Note: Don't include 'views' if column doesn't exist yet
  const videoData: VideoInsert = {
    ...video,
    creator_unique_identifier: creator.unique_identifier,
    // Only include views if column exists (handled by migration)
    // views will default to 0 in database
  } as any // Type assertion to allow flexibility during migration

  console.log('[createVideoAction] Video data to insert:', {
    ...videoData,
    creator_unique_identifier: creator.unique_identifier,
  })

  // Try with regular client first (respects RLS if user is authenticated)
  try {
    console.log('[createVideoAction] Attempting to create video with regular client...')
    const result = await createVideo(videoData)
    console.log('[createVideoAction] ✅ Video created successfully with regular client:', result.id)
    return result
  } catch (error: any) {
    console.error('[createVideoAction] Regular client error:', error)
    console.error('[createVideoAction] Error details:', {
      message: error?.message,
      code: error?.code,
      details: error?.details,
      hint: error?.hint,
    })
    
    // If RLS blocks it (e.g., in development mode without auth), use service role
    if (
      error.message?.includes('row-level security') || 
      error.message?.includes('RLS') ||
      error.code === '42501' ||
      error.code === 'PGRST301'
    ) {
      console.log('[createVideoAction] RLS blocked, using service role client')
      
      // Use service role to bypass RLS (we've already verified ownership)
      const serviceClient = createServiceClient<Database>(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      )

      if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
        console.error('[createVideoAction] Service role key not configured!')
        throw new Error('Service role key not configured. Please add SUPABASE_SERVICE_ROLE_KEY to .env.local')
      }

      console.log('[createVideoAction] Attempting to create video with service role client...')
      const { data, error: serviceError } = await serviceClient
        .from('air_publisher_videos')
        .insert(videoData)
        .select()
        .single()

      if (serviceError) {
        console.error('[createVideoAction] Service client error:', serviceError)
        console.error('[createVideoAction] Service error details:', {
          message: serviceError.message,
          code: serviceError.code,
          details: serviceError.details,
          hint: serviceError.hint,
        })
        throw new Error(serviceError.message || `Failed to create video: ${JSON.stringify(serviceError)}`)
      }

      console.log('[createVideoAction] ✅ Video created successfully with service role:', data.id)
      return data as any
    }
    
    // Re-throw other errors with more details
    console.error('[createVideoAction] Unexpected error:', error)
    throw new Error(error.message || `Failed to create video: ${JSON.stringify(error)}`)
  }
}

export async function updateVideoAction(id: string, updates: VideoUpdate) {
  const creator = await getCurrentCreator()
  if (!creator) {
    throw new Error('Unauthorized')
  }

  // Verify ownership - try regular client first
  const supabase = await createClient()
  let video = null
  let videoError = null
  
  try {
    const { data, error } = await supabase
      .from('air_publisher_videos')
      .select('creator_unique_identifier')
      .eq('id', id)
      .single()
    
    video = data
    videoError = error
    
    if (error) {
      console.warn('[updateVideoAction] Regular client error fetching video:', error.message)
    }
  } catch (e: any) {
    console.warn('[updateVideoAction] Exception fetching video:', e?.message || e)
    videoError = e
  }

  // If regular client fails, try service role (RLS might be blocking)
  if (videoError || !video) {
    console.log('[updateVideoAction] Regular client failed, trying service role for ownership check...')
    
    if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
      try {
        const serviceClient = createServiceClient<Database>(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!
        )
        
        const { data: serviceVideo, error: serviceError } = await serviceClient
          .from('air_publisher_videos')
          .select('creator_unique_identifier')
          .eq('id', id)
          .single()
        
        if (serviceError || !serviceVideo) {
          console.error('[updateVideoAction] Service client also failed to find video:', serviceError?.message || 'Video not found')
          throw new Error('Unauthorized: Video not found')
        }
        
        video = serviceVideo
        console.log('[updateVideoAction] ✅ Found video via service role for ownership check')
      } catch (e: any) {
        console.error('[updateVideoAction] Service role ownership check exception:', e?.message || e)
        throw new Error('Unauthorized: Could not verify video ownership')
      }
    } else {
      throw new Error('Unauthorized: Could not verify video ownership (service role key not configured)')
    }
  }

  // Verify ownership
  if (!video || video.creator_unique_identifier !== creator.unique_identifier) {
    console.error('[updateVideoAction] Ownership mismatch:', {
      videoCreatorId: video?.creator_unique_identifier,
      currentCreatorId: creator.unique_identifier,
    })
    throw new Error('Unauthorized: You do not own this video')
  }

  console.log('[updateVideoAction] ✅ Ownership verified, updating video:', id, updates)
  const result = await updateVideo(id, updates)
  
  if (!result) {
    console.error('[updateVideoAction] ❌ updateVideo returned null - update may have failed')
    throw new Error('Failed to update video: updateVideo returned null')
  }
  
  console.log('[updateVideoAction] ✅ Video updated successfully:', {
    id: result.id,
    status: result.status,
    posted_at: result.posted_at,
  })
  
  return result
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

/**
 * Publish a video
 * - For 'internal' platform: sets status to 'posted' immediately
 * - For YouTube/Instagram/TikTok: sets status to 'scheduled' with immediate time
 *   (n8n workflow will pick it up and post to the platform)
 */
export async function publishVideoAction(id: string) {
  console.log('[publishVideoAction] Publishing video:', id)
  
  const creator = await getCurrentCreator()
  if (!creator) {
    throw new Error('Unauthorized: Please create a creator profile first')
  }

  // Get video to check platform_target
  const supabase = await createClient()
  const { data: video, error: videoError } = await supabase
    .from('air_publisher_videos')
    .select('platform_target, creator_unique_identifier')
    .eq('id', id)
    .single()

  if (videoError || !video) {
    throw new Error('Video not found')
  }

  // Verify ownership
  if (video.creator_unique_identifier !== creator.unique_identifier) {
    throw new Error('Unauthorized: You do not own this video')
  }

  const now = new Date()
  
  // For internal platform, mark as posted immediately
  // For YouTube/Instagram/TikTok, mark as scheduled (n8n will post it)
  const isInternal = video.platform_target === 'internal'
  
  const updates = isInternal
    ? {
        status: 'posted' as const,
        posted_at: now.toISOString(),
      }
    : {
        status: 'scheduled' as const,
        scheduled_at: now.toISOString(), // Immediate schedule - n8n will pick it up
      }
  
  console.log('[publishVideoAction] Updates to apply:', {
    ...updates,
    platform: video.platform_target,
    isInternal,
  })
  
  try {
    const result = await updateVideoAction(id, updates)
    console.log('[publishVideoAction] ✅ Video published successfully:', {
      id: result?.id,
      status: result?.status,
      platform: video.platform_target,
      scheduled_at: (result as any).scheduled_at,
      posted_at: (result as any).posted_at,
    })

    // If not internal platform, trigger n8n webhook for immediate posting
    if (!isInternal) {
      try {
        const triggerUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/trigger/post-video`
        await fetch(triggerUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ video_id: id }),
        })
        console.log('[publishVideoAction] ✅ Triggered immediate post webhook')
      } catch (webhookError) {
        // Don't fail the publish action if webhook fails - n8n cron will pick it up
        console.warn('[publishVideoAction] Webhook trigger failed (cron will handle it):', webhookError)
      }
    }

    return result
  } catch (error: any) {
    console.error('[publishVideoAction] ❌ Failed to publish video:', error)
    throw error
  }
}

