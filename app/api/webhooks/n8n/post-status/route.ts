import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { verifyN8nWebhook } from '@/lib/webhooks/n8n'

/**
 * Webhook endpoint for n8n to report back post status
 * Called by n8n after attempting to post to a platform
 * 
 * Expected payload from n8n:
 * {
 *   "video_id": "uuid",
 *   "status": "posted" | "failed",
 *   "platform_post_id": "platform-specific-id" (optional),
 *   "platform_url": "https://..." (optional),
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
      status,
      platform_post_id,
      platform_url,
      error_message,
    } = body

    if (!video_id || !status) {
      return NextResponse.json(
        { error: 'Missing required fields: video_id, status' },
        { status: 400 }
      )
    }

    if (!['posted', 'failed'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status. Must be "posted" or "failed"' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Update video status
    const updates: any = {
      status,
    }

    if (status === 'posted') {
      updates.posted_at = new Date().toISOString()
      // Store platform post ID and URL if provided
      if (platform_post_id) {
        // You might want to add a platform_post_id column to the table
        // For now, we'll store it in a separate table or as metadata
      }
    }

    if (status === 'failed' && error_message) {
      // Store error message (you might want to add an error_message column)
      console.error(`Post failed for video ${video_id}:`, error_message)
    }

    const { data: video, error: updateError } = await (supabase
      .from('air_publisher_videos') as any)
      .update(updates)
      .eq('id', video_id)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating video status:', updateError)
      return NextResponse.json(
        { error: 'Failed to update video status' },
        { status: 500 }
      )
    }

    // If posted successfully, also create entry in creator_posts table
    if (status === 'posted' && platform_post_id) {
      const videoData = video as any
      await (supabase.from('creator_posts') as any).insert({
        creator_unique_identifier: videoData.creator_unique_identifier,
        platform: videoData.platform_target,
        post_id: platform_post_id,
        content_url: platform_url || videoData.video_url,
      })
    }

    return NextResponse.json({
      success: true,
      video,
    })
  } catch (error) {
    console.error('n8n post-status webhook error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}


