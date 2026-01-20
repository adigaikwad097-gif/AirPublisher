import { NextResponse } from 'next/server'
import { getVideoById } from '@/lib/db/videos'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { Database } from '@/lib/supabase/types'

/**
 * Get video by ID
 * Uses service role as fallback to bypass RLS if needed
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = params instanceof Promise ? await params : params
    const videoId = resolvedParams.id

    console.log('[API /videos/[id]] Fetching video:', videoId)

    if (!videoId) {
      console.error('[API /videos/[id]] No video ID provided')
      return NextResponse.json(
        { error: 'Video ID is required' },
        { status: 400 }
      )
    }

    // Try regular getVideoById first (has service role fallback built-in)
    let video = await getVideoById(videoId)

    // If still not found and we have service role key, try direct query
    if (!video && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.log('[API /videos/[id]] Video not found via regular client, trying direct service role query...')
      try {
        const serviceClient = createServiceClient<Database>(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!
        )
        
        const { data: serviceVideo, error: serviceError } = await serviceClient
          .from('air_publisher_videos')
          .select('*')
          .eq('id', videoId)
          .single()
        
        if (serviceError) {
          if (serviceError.code === 'PGRST116') {
            console.warn('[API /videos/[id]] Service role: Video not found (PGRST116):', videoId)
          } else {
            console.error('[API /videos/[id]] Service role query error:', serviceError)
          }
        } else if (serviceVideo) {
          console.log('[API /videos/[id]] ✅ Video found via service role:', serviceVideo.id)
          video = serviceVideo as any
        }
      } catch (e: any) {
        console.error('[API /videos/[id]] Service role query exception:', e?.message || e)
      }
    }

    if (!video) {
      console.warn('[API /videos/[id]] Video not found after all attempts:', videoId)
      return NextResponse.json(
        { error: 'Video not found', videoId },
        { status: 404 }
      )
    }

    console.log('[API /videos/[id]] ✅ Video found:', {
      id: video.id,
      title: video.title,
      status: video.status,
      creator: video.creator_unique_identifier,
    })

    return NextResponse.json({ video })
  } catch (error: any) {
    console.error('[API /videos/[id]] Error fetching video:', error)
    console.error('[API /videos/[id]] Error details:', {
      message: error?.message,
      stack: error?.stack,
      name: error?.name,
    })
    return NextResponse.json(
      { error: error.message || 'Failed to fetch video' },
      { status: 500 }
    )
  }
}

