import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { verifyN8nWebhook } from '@/lib/webhooks/n8n'

/**
 * Webhook endpoint for n8n to report video upload/processing completion
 * Called by n8n after processing uploaded video (transcoding, thumbnail generation, etc.)
 * 
 * Expected payload from n8n:
 * {
 *   "video_id": "uuid",
 *   "video_url": "https://storage.supabase.co/...",
 *   "thumbnail_url": "https://storage.supabase.co/...",
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

    const body = await request.json()
    const {
      video_id,
      video_url,
      thumbnail_url,
      processing_status,
      error_message,
    } = body

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

    const { data: video, error: updateError } = await supabase
      .from('air_publisher_videos')
      .update(updates)
      .eq('id', video_id)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating video:', updateError)
      return NextResponse.json(
        { error: 'Failed to update video' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      video,
      message: `Video processing ${processing_status}`,
    })
  } catch (error) {
    console.error('n8n upload-complete webhook error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

