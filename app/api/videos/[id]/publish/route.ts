import { NextResponse } from 'next/server'
import { publishVideoAction, scheduleVideoAction } from '@/app/api/videos/actions'
import { updateVideoAction } from '@/app/api/videos/actions'
import { getCurrentCreator } from '@/lib/db/creator'
import { createClient } from '@/lib/supabase/server'

/**
 * Publish or schedule a video to a specific platform
 * 
 * Body:
 * {
 *   "platform": "internal" | "youtube" | "instagram" | "tiktok",
 *   "postType": "now" | "schedule",
 *   "scheduledAt": "2024-01-20T10:00:00Z" (optional, required if postType is "schedule")
 * }
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = params instanceof Promise ? await params : params
    const videoId = resolvedParams.id

    const body = await request.json()
    const { platform, postType, scheduledAt } = body

    if (!platform || !postType) {
      return NextResponse.json(
        { error: 'Missing required fields: platform, postType' },
        { status: 400 }
      )
    }

    if (postType === 'schedule' && !scheduledAt) {
      return NextResponse.json(
        { error: 'scheduledAt is required when postType is "schedule"' },
        { status: 400 }
      )
    }

    const creator = await getCurrentCreator()
    if (!creator) {
      return NextResponse.json(
        { error: 'Unauthorized: Please create a creator profile first' },
        { status: 401 }
      )
    }

    // Verify video ownership
    const supabase = await createClient()
    const { data: video, error: videoError } = await (supabase
      .from('air_publisher_videos') as any)
      .select('creator_unique_identifier, platform_target')
      .eq('id', videoId)
      .single()

    if (videoError || !video) {
      return NextResponse.json(
        { error: 'Video not found' },
        { status: 404 }
      )
    }

    if (video.creator_unique_identifier !== creator.unique_identifier) {
      return NextResponse.json(
        { error: 'Unauthorized: You do not own this video' },
        { status: 403 }
      )
    }

    // Update video with platform and schedule/post
    if (postType === 'schedule') {
      await scheduleVideoAction(videoId, scheduledAt, platform)
    } else {
      // Post now - update platform and trigger immediate post via n8n
      await updateVideoAction(videoId, {
        platform_target: platform,
        // Don't set status to 'scheduled' - n8n will update it to 'posted' when done
        // Keep status as 'draft' until n8n confirms posting
      })

      // Trigger immediate post webhook if not internal
      if (platform !== 'internal') {
        const n8nWebhookUrl = process.env.N8N_WEBHOOK_URL_POST_VIDEO || 
                              'https://support-team.app.n8n.cloud/webhook/15ec8f2d-a77c-4407-8ab8-cd505284bb42'
        
        try {
          const webhookPayload = {
            video_id: videoId,
            creator_unique_identifier: video.creator_unique_identifier,
            platform: platform,
            trigger_type: 'immediate',
          }

          const headers: HeadersInit = {
            'Content-Type': 'application/json',
          }

          // Add API key if configured
          const n8nApiKey = process.env.N8N_API_KEY
          if (n8nApiKey) {
            headers['x-n8n-api-key'] = n8nApiKey
          }

          console.log('[publish] Triggering n8n immediate post webhook:', {
            url: n8nWebhookUrl,
            video_id: videoId,
            platform: platform,
          })

          const webhookResponse = await fetch(n8nWebhookUrl, {
            method: 'POST',
            headers,
            body: JSON.stringify(webhookPayload),
          })

          if (!webhookResponse.ok) {
            const errorText = await webhookResponse.text()
            console.error('[publish] n8n webhook error:', errorText)
            throw new Error(`Failed to trigger n8n webhook: ${errorText}`)
          }

          const webhookResult = await webhookResponse.json().catch(() => ({ success: true }))
          console.log('[publish] ✅ Successfully triggered n8n webhook:', webhookResult)
        } catch (webhookError: any) {
          console.error('[publish] Webhook trigger failed:', webhookError)
          // Don't fail the request - n8n cron might still pick it up
          // But log the error so user knows
          throw new Error(`Failed to trigger immediate post: ${webhookError.message || 'Unknown error'}`)
        }
      } else {
        // Internal platform - mark as posted immediately
        await updateVideoAction(videoId, {
          status: 'posted',
          posted_at: new Date().toISOString(),
        })
      }
    }

    return NextResponse.json({
      success: true,
      message: postType === 'now' ? 'Video posted successfully' : 'Video scheduled successfully',
    })
  } catch (error: any) {
    console.error('[publish] Error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to publish video' },
      { status: 500 }
    )
  }
}


