import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { verifyN8nWebhook } from '@/lib/webhooks/n8n'

/**
 * Webhook endpoint for n8n to report video upload/processing completion
 * Called by n8n after uploading video to Dropbox (or other storage)
 * 
 * Expected payload from n8n:
 * {
 *   "video_id": "uuid",
 *   "video_url": "https://www.dropbox.com/...", // Dropbox shared link URL
 *   "dropbox_path": "/airpublisher/creator_xxx/video.mp4", // Optional: Dropbox path
 *   "thumbnail_url": "https://..." (optional),
 *   "processing_status": "completed" | "failed",
 *   "error_message": "..." (if failed)
 * }
 */
export async function POST(request: Request) {
  try {
    // Verify webhook signature
    const isValid = await verifyN8nWebhook(request)
    if (!isValid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const requestBody = await request.json()
    
    // Handle nested body structure from n8n (sometimes data is in body.body)
    const body = requestBody.body || requestBody
    
    const {
      video_id,
      video_url,
      dropbox_path, // Optional: Dropbox file path
      thumbnail_url,
      processing_status,
      error_message,
    } = body

    console.log('[upload-complete] Received webhook from n8n:', {
      rawBody: requestBody,
      extractedBody: body,
      video_id,
      has_video_url: !!video_url,
      dropbox_path,
      processing_status,
    })

    if (!video_id || !processing_status) {
      return NextResponse.json(
        {
          error:
            'Missing required fields: video_id, processing_status',
        },
        { status: 400 }
      )
    }

    if (!['completed', 'failed'].includes(processing_status)) {
      return NextResponse.json(
        {
          error: 'Invalid processing_status. Must be "completed" or "failed"',
        },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // First, check if video exists
    console.log('[upload-complete] Checking if video exists:', video_id)
    const { data: existingVideo, error: checkError } = await (supabase
      .from('air_publisher_videos') as any)
      .select('id, creator_unique_identifier, status, video_url')
      .eq('id', video_id)
      .maybeSingle()

    if (checkError) {
      console.error('[upload-complete] Error checking video:', {
        video_id,
        error: checkError,
      })
      return NextResponse.json(
        { 
          error: 'Failed to check video',
          details: checkError.message,
          video_id,
        },
        { status: 500 }
      )
    }

    if (!existingVideo) {
      console.error('[upload-complete] Video not found in database:', video_id)
      console.error('[upload-complete] This might be a test/retry with an old video ID')
      console.error('[upload-complete] Attempting to create video record if it does not exist')
      
      // If video doesn't exist, try to create it (in case it was deleted or never created)
      // This is a fallback - normally the video should exist before upload
      if (processing_status === 'completed' && video_url) {
        try {
          const { data: newVideo, error: createError } = await (supabase
            .from('air_publisher_videos') as any)
            .insert({
              id: video_id,
              video_url: video_url,
              status: 'draft',
              creator_unique_identifier: 'unknown', // Will need to be updated
            })
            .select()
            .maybeSingle()
          
          if (createError || !newVideo) {
            console.error('[upload-complete] Could not create video:', createError)
            return NextResponse.json(
              { 
                error: 'Video not found and could not be created',
                video_id,
                message: 'Video does not exist in database and creation failed. Please ensure video is created before upload.',
                details: createError?.message,
              },
              { status: 404 }
            )
          }
          
          console.log('[upload-complete] ✅ Created missing video record:', newVideo.id)
          return NextResponse.json({
            success: true,
            video_id: newVideo.id,
            video_url: newVideo.video_url || video_url,
            status: newVideo.status || 'draft',
            processing_status,
            message: `Video processing ${processing_status} (video record was created)`,
          }, { status: 200 })
        } catch (createException: any) {
          console.error('[upload-complete] Exception creating video:', createException)
          return NextResponse.json(
            { 
              error: 'Video not found',
              video_id,
              message: 'Video does not exist in database. It may have been deleted or the ID is incorrect.',
            },
            { status: 404 }
          )
        }
      }
      
      return NextResponse.json(
        { 
          error: 'Video not found',
          video_id,
          message: 'Video does not exist in database. It may have been deleted or the ID is incorrect.',
        },
        { status: 404 }
      )
    }

    console.log('[upload-complete] Video found:', {
      id: existingVideo.id,
      current_video_url: existingVideo.video_url,
      status: existingVideo.status,
    })

    const updates: any = {}

    if (processing_status === 'completed') {
      if (video_url) updates.video_url = video_url
      if (thumbnail_url) updates.thumbnail_url = thumbnail_url
      // Video is ready, can be scheduled or posted
    } else if (processing_status === 'failed') {
      updates.status = 'failed'
      if (error_message) {
        console.error(`Video processing failed for ${video_id}:`, error_message)
      }
    }

    console.log('[upload-complete] Updating video with:', updates)

    // Update the video - use service role if needed to bypass RLS
    let updateResult
    try {
      updateResult = await (supabase
        .from('air_publisher_videos') as any)
        .update(updates)
        .eq('id', video_id)
        .select()
        .maybeSingle()
    } catch (updateException: any) {
      console.error('[upload-complete] Exception during update:', updateException)
      // Try with service role client if regular client fails
      if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
        console.log('[upload-complete] Retrying with service role client...')
        const { createClient: createServiceClient } = await import('@supabase/supabase-js')
        const serviceClient = createServiceClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!
        )
        updateResult = await (serviceClient
          .from('air_publisher_videos') as any)
          .update(updates)
          .eq('id', video_id)
          .select()
          .maybeSingle()
      } else {
        throw updateException
      }
    }

    const { data: updatedVideos, error: updateError } = updateResult || { data: null, error: null }

    if (updateError) {
      console.error('[upload-complete] Error updating video:', {
        video_id,
        updateError,
        errorCode: updateError.code,
        errorMessage: updateError.message,
        errorDetails: updateError.details,
        errorHint: updateError.hint,
        updates,
      })
      return NextResponse.json(
        { 
          error: 'Failed to update video',
          details: updateError.message,
          video_id,
        },
        { status: 500 }
      )
    }

    // Get the updated video (handle array response)
    const video = Array.isArray(updatedVideos) ? updatedVideos[0] : updatedVideos

    if (!video) {
      console.error('[upload-complete] Video not found after update:', video_id)
      // Try to fetch it again to see what happened
      const { data: recheckVideo } = await (supabase
        .from('air_publisher_videos') as any)
        .select('id')
        .eq('id', video_id)
        .maybeSingle()
      
      if (recheckVideo) {
        console.log('[upload-complete] Video still exists but update returned no data')
        // Update succeeded but select failed - return success anyway
        return NextResponse.json({
          success: true,
          video_id,
          video_url: video_url || existingVideo.video_url,
          status: existingVideo.status,
          processing_status,
          message: `Video processing ${processing_status} (update applied but could not verify)`,
        }, { status: 200 })
      } else {
        return NextResponse.json(
          { 
            error: 'Video not found after update',
            video_id,
            message: 'Video was not found in database after update attempt',
          },
          { status: 404 }
        )
      }
    }

    console.log('[upload-complete] ✅ Video updated successfully:', {
      video_id: video.id,
      video_url: video.video_url,
      status: video.status,
    })

    // Return a simple, clean response that n8n can parse
    const response = {
      success: true,
      video_id: video.id,
      video_url: video.video_url || null,
      status: video.status || 'draft',
      processing_status,
      message: `Video processing ${processing_status}`,
    }

    console.log('[upload-complete] Sending response to n8n:', response)

    return NextResponse.json(response, { 
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    })
  } catch (error) {
    console.error('n8n upload-complete webhook error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}


