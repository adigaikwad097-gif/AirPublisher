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

    // Check if video exists - completely bypass TypeScript type checking
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await (serviceClient
      .from('air_publisher_videos') as any)
      .select('*')
      .eq('id', videoId)
      .maybeSingle() as Promise<{ data: any; error: any }>)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const videoData: any = result?.data
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const error: any = result?.error

    if (error) {
      return NextResponse.json({
        exists: false,
        error: error?.message || 'Unknown error',
        code: error?.code || 'UNKNOWN',
      })
    }

    if (!videoData) {
      return NextResponse.json({
        exists: false,
        message: 'Video not found in database',
        videoId,
      })
    }

    // Extract properties with explicit any casting to avoid TypeScript errors
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const video: any = videoData

    return NextResponse.json({
      exists: true,
      video: {
        id: String(video?.id ?? ''),
        title: String(video?.title ?? ''),
        status: String(video?.status ?? ''),
        creator_unique_identifier: String(video?.creator_unique_identifier ?? ''),
        platform_target: String(video?.platform_target ?? ''),
        created_at: String(video?.created_at ?? ''),
        posted_at: video?.posted_at ? String(video.posted_at) : null,
      },
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to check video' },
      { status: 500 }
    )
  }
}


