import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getAppUrl } from '@/lib/utils/app-url'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const resolvedParams = params instanceof Promise ? await params : params
    const videoId = resolvedParams.id
    const body = await request.json()
    const { platform, postType, scheduledAt } = body

    if (!platform) {
      return NextResponse.json(
        { error: 'Platform is required' },
        { status: 400 }
      )
    }

    // Get creator unique identifier
    const { data: profile } = await supabase
      .from('airpublisher_creator_profiles')
      .select('creator_unique_identifier')
      .eq('user_id', user.id)
      .single()

    if (!profile) {
      return NextResponse.json(
        { error: 'Creator profile not found' },
        { status: 404 }
      )
    }

    if (postType === 'schedule') {
      // Schedule the post
      if (!scheduledAt) {
        return NextResponse.json(
          { error: 'Scheduled time is required' },
          { status: 400 }
        )
      }

      const scheduledDate = new Date(scheduledAt)
      if (scheduledDate < new Date()) {
        return NextResponse.json(
          { error: 'Scheduled time must be in the future' },
          { status: 400 }
        )
      }

      // Insert into scheduled_posts table
      const { data: scheduledPost, error: scheduleError } = await (supabase
        .from('air_publisher_scheduled_posts') as any)
        .insert({
          video_id: videoId,
          creator_unique_identifier: (profile as any).creator_unique_identifier,
          platform: platform,
          scheduled_at: scheduledDate.toISOString(),
          status: 'pending',
        })
        .select()
        .single()

      if (scheduleError) {
        console.error('Error scheduling post:', scheduleError)
        return NextResponse.json(
          { error: 'Failed to schedule post', details: scheduleError.message },
          { status: 500 }
        )
      }

      // Update video status
      await (supabase
        .from('air_publisher_videos') as any)
        .update({ status: 'scheduled' })
        .eq('id', videoId)

      return NextResponse.json({
        success: true,
        scheduled_post: scheduledPost,
        message: 'Video scheduled successfully',
      })
    } else {
      // Post now - create scheduled post with immediate time
      // n8n cron will pick it up and post it immediately
      const now = new Date()
      
      // Insert into scheduled_posts table with immediate time
      const { data: scheduledPost, error: scheduleError } = await (supabase
        .from('air_publisher_scheduled_posts') as any)
        .insert({
          video_id: videoId,
          creator_unique_identifier: (profile as any).creator_unique_identifier,
          platform: platform,
          scheduled_at: now.toISOString(),
          status: 'pending',
        })
        .select()
        .single()

      if (scheduleError) {
        console.error('[publish] Error creating immediate scheduled post:', scheduleError)
        return NextResponse.json(
          { error: 'Failed to schedule post', details: scheduleError.message },
          { status: 500 }
        )
      }

      // Update video status to scheduled
      const { error: updateError } = await (supabase
        .from('air_publisher_videos') as any)
        .update({ 
          status: 'scheduled',
          scheduled_at: now.toISOString(),
        })
        .eq('id', videoId)

      if (updateError) {
        console.error('[publish] Error updating video status:', updateError)
        // Don't fail the request if status update fails
      }

      console.log('[publish] ✅ Video scheduled for immediate posting:', {
        videoId,
        platform,
        scheduledPost: scheduledPost?.id,
      })

      return NextResponse.json({
        success: true,
        scheduled_post: scheduledPost,
        message: 'Video queued for posting. n8n will process it shortly.',
      })
    }
  } catch (error) {
    console.error('Error in publish endpoint:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
