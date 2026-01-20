import { NextResponse } from 'next/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { Database } from '@/lib/supabase/types'

/**
 * Debug endpoint to check if a video exists in the database
 * Uses service role to bypass RLS
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = params instanceof Promise ? await params : params
    const videoId = resolvedParams.id

    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json(
        { error: 'Service role key not configured' },
        { status: 500 }
      )
    }

    const serviceClient = createServiceClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Check if video exists
    const { data: video, error } = await serviceClient
      .from('air_publisher_videos')
      .select('*')
      .eq('id', videoId)
      .maybeSingle()

    if (error) {
      return NextResponse.json({
        exists: false,
        error: error.message,
        code: error.code,
      })
    }

    if (!video) {
      return NextResponse.json({
        exists: false,
        message: 'Video not found in database',
        videoId,
      })
    }

    return NextResponse.json({
      exists: true,
      video: {
        id: video.id,
        title: video.title,
        status: video.status,
        creator_unique_identifier: video.creator_unique_identifier,
        platform_target: video.platform_target,
        created_at: video.created_at,
        posted_at: video.posted_at,
      },
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to check video' },
      { status: 500 }
    )
  }
}


