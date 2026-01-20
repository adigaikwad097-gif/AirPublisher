import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { Database } from '@/lib/supabase/types'

// Increase timeout for large video files (5 minutes)
export const maxDuration = 300

/**
 * Video streaming proxy endpoint
 * Fetches video from Dropbox and streams it to the client
 * This bypasses CORS issues with Dropbox shared links
 * 
 * Supports range requests for video seeking
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = params instanceof Promise ? await params : params
    const videoId = resolvedParams.id

    console.log('[stream] Fetching video URL for video:', videoId)

    const supabase = await createClient()

    // Get video URL from database
    let video = null
    let videoError = null
    
    const { data, error } = await supabase
      .from('air_publisher_videos')
      .select('video_url')
      .eq('id', videoId)
      .single()

    video = data
    videoError = error

    // If regular client fails, try service role (RLS might be blocking)
    if (videoError || !video || !video.video_url) {
      console.warn('[stream] Regular client failed, trying service role...', {
        error: videoError?.message,
        hasVideo: !!video,
        hasVideoUrl: !!video?.video_url,
      })

      if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
        try {
          const serviceClient = createServiceClient<Database>(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
          )

          const { data: serviceVideo, error: serviceError } = await serviceClient
            .from('air_publisher_videos')
            .select('video_url')
            .eq('id', videoId)
            .single()

          if (serviceError || !serviceVideo) {
            console.error('[stream] Service client also failed:', serviceError?.message || 'No video found')
            return NextResponse.json(
              { error: 'Video not found or no video URL', videoId },
              { status: 404 }
            )
          }

          video = serviceVideo
          console.log('[stream] ✅ Found video URL via service role')
        } catch (e: any) {
          console.error('[stream] Service role exception:', e?.message || e)
          return NextResponse.json(
            { error: 'Failed to fetch video URL', videoId },
            { status: 500 }
          )
        }
      } else {
        return NextResponse.json(
          { error: 'Video not found or no video URL', videoId },
          { status: 404 }
        )
      }
    }

    if (!video || !video.video_url) {
      console.error('[stream] No video URL found for video:', videoId)
      return NextResponse.json(
        { error: 'Video URL not found', videoId },
        { status: 404 }
      )
    }

    // Convert Dropbox URL to direct download format
    let videoUrl = video.video_url
    
    console.log('[stream] Original video URL:', videoUrl?.substring(0, 100) + '...')
    
    // Replace ?dl=0 with ?dl=1 for direct download
    if (videoUrl.includes('?dl=0')) {
      videoUrl = videoUrl.replace('?dl=0', '?dl=1')
    } else if (!videoUrl.includes('?dl=')) {
      videoUrl = videoUrl + (videoUrl.includes('?') ? '&dl=1' : '?dl=1')
    }
    
    console.log('[stream] Converted video URL:', videoUrl?.substring(0, 100) + '...')

    // Handle range requests for video seeking
    const range = request.headers.get('range')
    const headers: HeadersInit = {
      'User-Agent': 'Mozilla/5.0',
    }

    if (range) {
      headers['Range'] = range
    }

    // Fetch video from Dropbox
    console.log('[stream] Fetching video from Dropbox...')
    const videoResponse = await fetch(videoUrl, { headers })

    if (!videoResponse.ok) {
      const errorText = await videoResponse.text().catch(() => 'Could not read error response')
      console.error('[stream] Dropbox fetch failed:', {
        status: videoResponse.status,
        statusText: videoResponse.statusText,
        url: videoUrl?.substring(0, 100),
        errorText: errorText?.substring(0, 200),
      })
      return NextResponse.json(
        { 
          error: 'Failed to fetch video from Dropbox',
          status: videoResponse.status,
          statusText: videoResponse.statusText,
        },
        { status: 502 }
      )
    }

    console.log('[stream] ✅ Successfully fetched video from Dropbox')

    // Get video content type and size
    const contentType = videoResponse.headers.get('content-type') || 'video/mp4'
    const contentLength = videoResponse.headers.get('content-length')
    const acceptRanges = videoResponse.headers.get('accept-ranges') || 'bytes'

    // For large files, stream the response instead of loading into memory
    // This prevents memory issues and timeouts
    if (!videoResponse.body) {
      return NextResponse.json(
        { error: 'No video content received from Dropbox' },
        { status: 502 }
      )
    }

    // Stream the video response directly to the client
    const stream = videoResponse.body

    // Handle range requests
    if (range && videoResponse.status === 206) {
      // Partial content response
      const contentRange = videoResponse.headers.get('content-range')
      return new NextResponse(stream, {
        status: 206,
        headers: {
          'Content-Type': contentType,
          'Content-Length': videoResponse.headers.get('content-length') || '',
          'Content-Range': contentRange || '',
          'Accept-Ranges': acceptRanges,
          'Cache-Control': 'public, max-age=3600',
        },
      })
    }

    // Full video response - stream it
    return new NextResponse(stream, {
      headers: {
        'Content-Type': contentType,
        'Content-Length': contentLength || '',
        'Accept-Ranges': acceptRanges,
        'Cache-Control': 'public, max-age=3600',
      },
    })
  } catch (error: any) {
    console.error('[stream] Error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to stream video' },
      { status: 500 }
    )
  }
}

