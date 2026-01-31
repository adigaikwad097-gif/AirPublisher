import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    // Authenticate request
    const apiKey = request.headers.get('x-n8n-api-key')
    const authHeader = request.headers.get('authorization')
    const expectedApiKey = process.env.N8N_API_KEY

    if (!expectedApiKey) {
      return NextResponse.json(
        { error: 'N8N_API_KEY not configured' },
        { status: 500 }
      )
    }

    // Check authentication
    const providedKey = apiKey || authHeader?.replace('Bearer ', '')
    if (providedKey !== expectedApiKey) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Parse request body
    const body = await request.json()
    const {
      video_id,
      status,
      platform,
      platform_post_id,
      platform_post_url,
      youtube_url,
      instagram_url,
      tiktok_url,
      error_message,
      published_at
    } = body

    if (!video_id) {
      return NextResponse.json(
        { error: 'video_id is required' },
        { status: 400 }
      )
    }

    // Create Supabase client with service role for updates
    const supabase = await createClient()

    // Build update object
    const updates: {
      updated_at?: string
      status?: string
      posted_at?: string
      youtube_url?: string
      instagram_url?: string
      tiktok_url?: string
    } = {
      updated_at: new Date().toISOString()
    }

    // Update status
    if (status) {
      updates.status = status
    }

    // Update posted_at if status is 'posted'
    if (status === 'posted' && published_at) {
      updates.posted_at = published_at
    } else if (status === 'posted' && !updates.posted_at) {
      updates.posted_at = new Date().toISOString()
    }

    // Update platform URLs
    // Priority: specific platform URL fields > platform_post_url with platform detection
    if (youtube_url) {
      updates.youtube_url = youtube_url
    }
    if (instagram_url) {
      updates.instagram_url = instagram_url
    }
    if (tiktok_url) {
      updates.tiktok_url = tiktok_url
    }

    // If platform_post_url is provided but no specific URL field, use platform to determine which field
    if (platform_post_url && !youtube_url && !instagram_url && !tiktok_url) {
      if (platform === 'youtube') {
        updates.youtube_url = platform_post_url
      } else if (platform === 'instagram') {
        updates.instagram_url = platform_post_url
      } else if (platform === 'tiktok') {
        updates.tiktok_url = platform_post_url
      }
    }

    // Update video in database
    const { data, error } = await (supabase
      .from('air_publisher_videos') as any)
      .update(updates)
      .eq('id', video_id)
      .select()
      .single()

    if (error) {
      console.error('Error updating video:', error)
      return NextResponse.json(
        { error: 'Failed to update video', details: error.message },
        { status: 500 }
      )
    }

    if (!data) {
      return NextResponse.json(
        { error: 'Video not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      video: data,
      message: `Video ${video_id} updated successfully`
    })
  } catch (error) {
    console.error('Error in post-status webhook:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
