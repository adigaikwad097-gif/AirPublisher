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
      // Post now - trigger n8n webhook directly for instant posting
      const n8nWebhookUrl = process.env.N8N_WEBHOOK_URL_POST_VIDEO
      const n8nApiKey = process.env.N8N_API_KEY

      // Debug: Log all environment variables that might be related
      console.log('[publish] Environment check:', {
        hasN8N_WEBHOOK_URL_POST_VIDEO: !!n8nWebhookUrl,
        n8nWebhookUrlLength: n8nWebhookUrl?.length || 0,
        n8nWebhookUrlPreview: n8nWebhookUrl ? `${n8nWebhookUrl.substring(0, 50)}...` : 'NOT SET',
        hasN8N_API_KEY: !!n8nApiKey,
        nodeEnv: process.env.NODE_ENV,
        vercelEnv: process.env.VERCEL_ENV,
        allEnvKeys: Object.keys(process.env).filter(k => k.includes('N8N') || k.includes('WEBHOOK')).join(', '),
      })

      if (!n8nWebhookUrl) {
        console.error('[publish] ❌ N8N_WEBHOOK_URL_POST_VIDEO not configured!')
        console.error('[publish] Please set N8N_WEBHOOK_URL_POST_VIDEO in environment variables')
        console.error('[publish] Example: https://support-team.app.n8n.cloud/webhook/15ec8f2d-a77c-4407-8ab8-cd505284bb42')
        console.error('[publish] Current environment:', process.env.NODE_ENV, process.env.VERCEL_ENV)
        
        // Fallback: create scheduled post with immediate time
        const now = new Date()
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
            { 
              error: 'Failed to schedule post', 
              details: scheduleError.message,
              note: 'N8N_WEBHOOK_URL_POST_VIDEO is not configured. Please set it in Vercel environment variables for instant posting.',
            },
            { status: 500 }
          )
        }

        console.warn('[publish] ⚠️ Using scheduled post fallback (n8n webhook URL not configured)')
        return NextResponse.json({
          success: true,
          scheduled_post: scheduledPost,
          message: 'Video queued for posting. n8n will process it shortly.',
          warning: 'N8N_WEBHOOK_URL_POST_VIDEO is not configured. Set it in Vercel for instant posting.',
        })
      }

      // Get video details to send to n8n
      const { data: video, error: videoError } = await (supabase
        .from('air_publisher_videos') as any)
        .select('*')
        .eq('id', videoId)
        .single()

      if (videoError || !video) {
        return NextResponse.json(
          { error: 'Video not found' },
          { status: 404 }
        )
      }

      const webhookPayload = {
        video_id: videoId,
        creator_unique_identifier: (profile as any).creator_unique_identifier,
        platform: platform,
        trigger_type: 'immediate', // Indicates this is an immediate post, not scheduled
      }

      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      }

      // Add API key if configured
      if (n8nApiKey) {
        headers['x-n8n-api-key'] = n8nApiKey
      }

      console.log('[publish] Calling n8n webhook:', {
        url: n8nWebhookUrl,
        payload: webhookPayload,
        hasApiKey: !!n8nApiKey,
        headers: Object.keys(headers),
      })

      let response
      try {
        response = await fetch(n8nWebhookUrl, {
          method: 'POST',
          headers,
          body: JSON.stringify(webhookPayload),
        })
        console.log('[publish] Webhook response received:', {
          status: response.status,
          statusText: response.statusText,
          ok: response.ok,
        })
      } catch (fetchError: any) {
        console.error('[publish] Fetch error calling n8n webhook:', {
          error: fetchError.message,
          stack: fetchError.stack,
          url: n8nWebhookUrl,
        })
        return NextResponse.json(
          { 
            error: 'Failed to call n8n webhook',
            details: fetchError.message || 'Network error',
          },
          { status: 500 }
        )
      }

      if (!response.ok) {
        const errorText = await response.text()
        console.error('[publish] n8n webhook error:', {
          status: response.status,
          statusText: response.statusText,
          error: errorText,
        })
        return NextResponse.json(
          { 
            error: 'Failed to trigger n8n webhook',
            details: errorText || `HTTP ${response.status}: ${response.statusText}`,
          },
          { status: response.status || 500 }
        )
      }

      const result = await response.json().catch(() => ({ success: true }))
      console.log('[publish] ✅ Successfully triggered n8n webhook:', result)

      return NextResponse.json({
        success: true,
        message: 'Video posting triggered immediately',
        video_id: videoId,
        webhook_response: result,
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
