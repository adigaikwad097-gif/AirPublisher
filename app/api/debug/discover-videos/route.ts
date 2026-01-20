import { NextResponse } from 'next/server'
import { getAllPostedVideos } from '@/lib/db/videos'
import { getCreatorProfile } from '@/lib/db/creator'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { Database } from '@/lib/supabase/types'

/**
 * Debug endpoint to check what videos getAllPostedVideos returns
 * Only works in development mode
 */
export async function GET() {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'Only available in development' }, { status: 403 })
  }

  try {
    const serviceClient = createServiceClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Get all posted videos via getAllPostedVideos
    const videosFromFunction = await getAllPostedVideos(50, 0)

    // Get all posted videos directly via service client for comparison
    const { data: directVideos, error: directError } = await serviceClient
      .from('air_publisher_videos')
      .select('*')
      .eq('status', 'posted')
      .order('created_at', { ascending: false })
      .limit(50)

    return NextResponse.json({
      getAllPostedVideos: {
        count: videosFromFunction.length,
        videos: videosFromFunction.map(v => ({
          id: v.id,
          title: v.title,
          status: v.status,
          video_url: v.video_url ? 'SET' : 'NULL',
          creator_unique_identifier: v.creator_unique_identifier,
        })),
      },
      directServiceClient: {
        count: directVideos?.length || 0,
        videos: (directVideos || []).map((v: any) => ({
          id: v.id,
          title: v.title,
          status: v.status,
          video_url: v.video_url ? 'SET' : 'NULL',
          creator_unique_identifier: v.creator_unique_identifier,
        })),
        error: directError?.message || null,
      },
      note: 'Compare getAllPostedVideos with direct query. Both should show the same videos with status "posted".',
    })
  } catch (error: any) {
    return NextResponse.json({
      error: error.message || String(error),
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    }, { status: 500 })
  }
}


