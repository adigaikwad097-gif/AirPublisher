import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCurrentCreator } from '@/lib/db/creator'

/**
 * Endpoint to trigger immediate video posting via n8n webhook
 * Called when user clicks "Publish Now" - triggers n8n to post immediately
 * 
 * This endpoint:
 * 1. Verifies the video exists and user has permission
 * 2. Calls n8n webhook URL (if configured) to trigger immediate posting
 * 3. Or triggers n8n workflow directly
 * 
 * Request Body:
 * {
 *   "video_id": "uuid"
 * }
 */
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { video_id, platform } = body

    if (!video_id) {
      return NextResponse.json(
        { error: 'Missing video_id' },
        { status: 400 }
      )
    }

    const supabase = await createClient()
    const creator = await getCurrentCreator()

    if (!creator) {
      return NextResponse.json(
        { error: 'Unauthorized: Please create a creator profile first' },
        { status: 401 }
      )
    }

    // Get video and verify ownership
    const { data: video, error: videoError } = await (supabase
      .from('air_publisher_videos') as any)
      .select('*')
      .eq('id', video_id)
      .single()

    if (videoError || !video) {
      return NextResponse.json(
        { error: 'Video not found' },
        { status: 404 }
      )
    }

    // Verify ownership
    if (video.creator_unique_identifier !== creator.unique_identifier) {
      return NextResponse.json(
        { error: 'Unauthorized: You do not own this video' },
        { status: 403 }
      )
    }

    // Verify video is scheduled for posting (status = 'scheduled')
    if (video.status !== 'scheduled') {
      return NextResponse.json(
        { error: `Video status is "${video.status}", not "scheduled". Cannot trigger posting.` },
        { status: 400 }
      )
    }

    // Check if n8n webhook URL is configured
    const n8nWebhookUrl = process.env.N8N_WEBHOOK_URL_POST_VIDEO
    const n8nApiKey = process.env.N8N_API_KEY

    if (!n8nWebhookUrl) {
      // If no webhook URL, just return success (n8n cron will pick it up)
      console.log('[trigger-post-video] No N8N_WEBHOOK_URL_POST_VIDEO configured, relying on cron')
      return NextResponse.json({
        success: true,
        message: 'Video queued for posting (n8n cron will process it)',
        video_id: video.id,
      })
    }

    // Trigger n8n webhook to post immediately
    try {
      // Get platform from request body, video, or default to video's platform_target
      const targetPlatform = platform || video.platform_target || 'internal'
      
      const webhookPayload = {
        video_id: video.id,
        creator_unique_identifier: video.creator_unique_identifier,
        platform: targetPlatform,
        trigger_type: 'immediate', // Indicates this is an immediate post, not scheduled
      }

      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      }

      // Add API key if configured
      if (n8nApiKey) {
        headers['x-n8n-api-key'] = n8nApiKey
      }

      console.log('[trigger-post-video] Calling n8n webhook:', {
        url: n8nWebhookUrl,
        payload: webhookPayload,
        hasApiKey: !!n8nApiKey,
      })

      const webhookResponse = await fetch(n8nWebhookUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify(webhookPayload),
      })

      if (!webhookResponse.ok) {
        const errorText = await webhookResponse.text()
        console.error('[trigger-post-video] n8n webhook error:', errorText)
        return NextResponse.json(
          { 
            error: 'Failed to trigger n8n webhook',
            details: errorText,
          },
          { status: 500 }
        )
      }

      const webhookResult = await webhookResponse.json().catch(() => ({ success: true }))

      console.log('[trigger-post-video] ✅ Successfully triggered n8n webhook:', webhookResult)

      return NextResponse.json({
        success: true,
        message: 'Video posting triggered immediately',
        video_id: video.id,
        webhook_response: webhookResult,
      })
    } catch (error: any) {
      console.error('[trigger-post-video] Error calling n8n webhook:', error)
      // Don't fail - n8n cron will still pick it up
      return NextResponse.json({
        success: true,
        message: 'Video queued for posting (webhook call failed, but cron will process it)',
        video_id: video.id,
        warning: error.message,
      })
    }
  } catch (error) {
    console.error('[trigger-post-video] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

