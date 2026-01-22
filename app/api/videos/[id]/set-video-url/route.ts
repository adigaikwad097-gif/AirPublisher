import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { getCurrentCreator } from '@/lib/db/creator'
import { Database } from '@/lib/supabase/types'
import { updateVideo } from '@/lib/db/videos'

const BUCKET_NAME = 'air-publisher-videos'

/**
 * Manually set video_url for a video based on storage path
 * This is a fallback if the upload route didn't update the video_url
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = params instanceof Promise ? await params : params
    const videoId = resolvedParams.id

    if (!videoId) {
      return NextResponse.json(
        { error: 'Video ID is required' },
        { status: 400 }
      )
    }

    // Verify ownership
    const creator = await getCurrentCreator()
    if (!creator) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const supabase = await createClient()
    const serviceClient = createServiceClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Get video to find creator and check ownership
    let video = null
    let videoError = null
    
    console.log('[set-video-url] Looking up video:', videoId)
    
    try {
      const { data: regularVideo, error: regularError } = await (supabase
        .from('air_publisher_videos') as any)
        .select('creator_unique_identifier, id, title')
        .eq('id', videoId)
        .single()
      
      if (regularVideo) {
        video = regularVideo as any
        console.log('[set-video-url] ✅ Found video via regular client')
      } else if (regularError) {
        videoError = regularError
        console.warn('[set-video-url] Regular client error:', regularError.message)
      }
    } catch (e: any) {
      console.warn('[set-video-url] Regular client exception:', e?.message || e)
      videoError = e
    }

    // If regular client failed, try service role
    if (!video && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.log('[set-video-url] Trying service role client...')
      try {
        const { data: serviceVideo, error: serviceError } = await (serviceClient
          .from('air_publisher_videos') as any)
          .select('creator_unique_identifier, id, title')
          .eq('id', videoId)
          .single()
        
        if (serviceError) {
          console.error('[set-video-url] Service client error:', serviceError)
          videoError = serviceError
        } else if (serviceVideo) {
          video = serviceVideo as any
          console.log('[set-video-url] ✅ Found video via service role')
        }
      } catch (e: any) {
        console.error('[set-video-url] Service client exception:', e?.message || e)
        videoError = e
      }
    }

    if (!video) {
      console.error('[set-video-url] Video not found:', {
        videoId,
        regularError: videoError?.message || null,
        creatorId: creator.unique_identifier,
      })
      return NextResponse.json(
        { 
          error: 'Video not found',
          videoId,
          details: videoError?.message || 'Video does not exist in database',
        },
        { status: 404 }
      )
    }

    // Verify ownership - cast video to any to avoid TypeScript errors
    const videoData = video as any
    console.log('[set-video-url] Checking ownership:', {
      videoCreatorId: videoData.creator_unique_identifier,
      currentCreatorId: creator.unique_identifier,
      match: videoData.creator_unique_identifier === creator.unique_identifier,
    })
    
    if (videoData.creator_unique_identifier !== creator.unique_identifier) {
      console.error('[set-video-url] Ownership mismatch')
      return NextResponse.json(
        { 
          error: 'Unauthorized: You do not own this video',
          videoCreatorId: videoData.creator_unique_identifier,
          currentCreatorId: creator.unique_identifier,
        },
        { status: 403 }
      )
    }

    // List files in the creator's folder to find the video
    const { data: files, error: listError } = await serviceClient.storage
      .from(BUCKET_NAME)
      .list(videoData.creator_unique_identifier, {
        limit: 100,
        sortBy: { column: 'created_at', order: 'desc' },
      })

    if (listError) {
      console.error('[set-video-url] Error listing files:', listError)
      return NextResponse.json(
        { error: 'Failed to list files in storage' },
        { status: 500 }
      )
    }

    // Find file that matches this video ID
    const videoFile = files?.find((file) => file.name.startsWith(videoId))

    if (!videoFile) {
      return NextResponse.json(
        { 
          error: 'Video file not found in storage',
          hint: `Looking for files in folder: ${videoData.creator_unique_identifier}`,
          availableFiles: files?.map(f => f.name) || [],
        },
        { status: 404 }
      )
    }

    // Generate public URL
    const storagePath = `${videoData.creator_unique_identifier}/${videoFile.name}`
    const { data: { publicUrl } } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(storagePath)

    console.log('[set-video-url] Setting video_url:', {
      videoId,
      storagePath,
      publicUrl,
    })

    // Update video record - try updateVideo first, if it fails, use service role directly
    let updatedVideo = null
    try {
      updatedVideo = await updateVideo(videoId, {
        video_url: publicUrl,
      })
      
      if (!updatedVideo) {
        console.warn('[set-video-url] updateVideo returned null, trying direct service role update...')
        // If updateVideo returned null, try direct service role update
        const { data: directUpdate, error: directError } = await (serviceClient
          .from('air_publisher_videos') as any)
          .update({ video_url: publicUrl })
          .eq('id', videoId)
          .select()
          .single()
        
        if (directError) {
          console.error('[set-video-url] Direct service role update error:', directError)
          throw new Error(directError.message || 'Failed to update video URL')
        }
        
        updatedVideo = directUpdate
        console.log('[set-video-url] ✅ Updated via direct service role:', {
          id: updatedVideo.id,
          video_url: updatedVideo.video_url,
        })
      } else {
        console.log('[set-video-url] ✅ Updated via updateVideo:', {
          id: updatedVideo.id,
          video_url: updatedVideo.video_url,
        })
      }
    } catch (updateError: any) {
      console.error('[set-video-url] Update failed, trying direct service role update...', updateError)
      // Fallback: direct service role update
      const { data: directUpdate, error: directError } = await (serviceClient
        .from('air_publisher_videos') as any)
        .update({ video_url: publicUrl })
        .eq('id', videoId)
        .select()
        .single()
      
      if (directError) {
        console.error('[set-video-url] Direct service role update also failed:', directError)
        throw new Error(directError.message || 'Failed to update video URL')
      }
      
      updatedVideo = directUpdate
      console.log('[set-video-url] ✅ Updated via direct service role (fallback):', {
        id: updatedVideo.id,
        video_url: updatedVideo.video_url,
      })
    }

    // Verify the update
    const { data: verifyVideo, error: verifyError } = await (serviceClient
      .from('air_publisher_videos') as any)
      .select('id, video_url')
      .eq('id', videoId)
      .single()

    if (verifyError || !verifyVideo) {
      console.error('[set-video-url] Failed to verify update:', verifyError)
      throw new Error('Update succeeded but verification failed')
    }

    const verifyVideoData = verifyVideo as any
    console.log('[set-video-url] ✅ Verification successful:', {
      id: verifyVideoData.id,
      video_url: verifyVideoData.video_url,
      matches: verifyVideoData.video_url === publicUrl,
    })

    return NextResponse.json({
      success: true,
      video_url: publicUrl,
      storage_path: storagePath,
      video: updatedVideo,
      verified: verifyVideo.video_url === publicUrl,
    })
  } catch (error: any) {
    console.error('[set-video-url] Error:', error)
    return NextResponse.json(
      {
        error: error.message || 'Failed to set video URL',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
      { status: 500 }
    )
  }
}

