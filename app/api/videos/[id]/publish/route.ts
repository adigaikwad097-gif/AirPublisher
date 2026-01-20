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
    const { data: video, error: videoError } = await supabase
      .from('air_publisher_videos')
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
      // Post now - update platform and trigger immediate post
      await updateVideoAction(videoId, {
        platform_target: platform,
        status: 'scheduled',
        scheduled_at: new Date().toISOString(),
      })

      // Trigger immediate post webhook if not internal
      if (platform !== 'internal') {
        try {
          const triggerUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/trigger/post-video`
          await fetch(triggerUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ video_id: videoId }),
          })
        } catch (webhookError) {
          console.warn('[publish] Webhook trigger failed (cron will handle it):', webhookError)
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


