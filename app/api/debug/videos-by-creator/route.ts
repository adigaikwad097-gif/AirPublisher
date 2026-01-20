import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { getCurrentCreator } from '@/lib/db/creator'
import { Database } from '@/lib/supabase/types'

/**
 * Debug endpoint to check videos for current creator
 * Only works in development mode
 */
export async function GET() {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'Only available in development' }, { status: 403 })
  }

  try {
    const creator = await getCurrentCreator()
    
    if (!creator) {
      return NextResponse.json({
        creator: null,
        error: 'No creator found',
      })
    }

    const supabase = await createClient()
    const serviceClient = createServiceClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    
    // Get videos with regular client (respects RLS)
    const { data: regularVideos, error: regularError } = await supabase
      .from('air_publisher_videos')
      .select('*')
      .eq('creator_unique_identifier', creator.unique_identifier)
      .order('created_at', { ascending: false })
    
    // Get videos with service role (bypasses RLS)
    const { data: serviceVideos, error: serviceError } = await serviceClient
      .from('air_publisher_videos')
      .select('*')
      .eq('creator_unique_identifier', creator.unique_identifier)
      .order('created_at', { ascending: false })
    
    // Also get all videos to see what's in the table
    const { data: allVideos, error: allError } = await serviceClient
      .from('air_publisher_videos')
      .select('id, title, creator_unique_identifier, status, created_at')
      .order('created_at', { ascending: false })
      .limit(20)
    
    return NextResponse.json({
      creator: {
        unique_identifier: creator.unique_identifier,
        display_name: (creator as any).handles || creator.display_name,
      },
      videos: {
        regularClient: {
          videos: regularVideos?.map((v: any) => ({
            id: v.id,
            title: v.title,
            creator_unique_identifier: v.creator_unique_identifier,
            status: v.status,
          })) || [],
          count: regularVideos?.length || 0,
          error: regularError?.message || null,
          errorCode: regularError?.code || null,
        },
        serviceClient: {
          videos: serviceVideos?.map((v: any) => ({
            id: v.id,
            title: v.title,
            creator_unique_identifier: v.creator_unique_identifier,
            status: v.status,
          })) || [],
          count: serviceVideos?.length || 0,
          error: serviceError?.message || null,
          errorCode: serviceError?.code || null,
        },
      },
      allVideosInTable: allVideos || [],
      allVideosCount: allVideos?.length || 0,
      allVideosError: allError?.message || null,
      note: 'If serviceClient finds videos but regularClient doesn\'t, RLS is blocking. Videos page should use service role fallback.',
    })
  } catch (error: any) {
    return NextResponse.json({
      error: error.message || String(error),
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    }, { status: 500 })
  }
}


