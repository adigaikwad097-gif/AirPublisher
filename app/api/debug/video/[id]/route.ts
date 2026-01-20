import { NextResponse } from 'next/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { Database } from '@/lib/supabase/types'

// Helper function to safely extract video data
// Moved outside the handler to avoid ES5 strict mode issues
function getVideoData(result: unknown): {
  id: string
  title: string
  status: string
  creator_unique_identifier: string
  platform_target: string
  created_at: string
  posted_at: string | null
} | null {
  const r = result as { data?: any; error?: any }
  if (r.error) return null
  if (!r.data) return null
  const v = r.data as any
  return {
    id: String(v?.id ?? ''),
    title: String(v?.title ?? ''),
    status: String(v?.status ?? ''),
    creator_unique_identifier: String(v?.creator_unique_identifier ?? ''),
    platform_target: String(v?.platform_target ?? ''),
    created_at: String(v?.created_at ?? ''),
    posted_at: v?.posted_at ? String(v.posted_at) : null,
  }
}

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

    // Check if video exists - use helper function to avoid TypeScript type inference issues
    const queryResult = await (serviceClient
      .from('air_publisher_videos') as any)
      .select('*')
      .eq('id', videoId)
      .maybeSingle()

    const result = queryResult as { data?: any; error?: any }
    if (result.error) {
      return NextResponse.json({
        exists: false,
        error: result.error?.message || 'Unknown error',
        code: result.error?.code || 'UNKNOWN',
      })
    }

    const video = getVideoData(queryResult)
    if (!video) {
      return NextResponse.json({
        exists: false,
        message: 'Video not found in database',
        videoId,
      })
    }

    return NextResponse.json({
      exists: true,
      video,
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to check video' },
      { status: 500 }
    )
  }
}


