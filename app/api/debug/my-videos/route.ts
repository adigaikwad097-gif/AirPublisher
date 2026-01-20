import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCurrentCreator } from '@/lib/db/creator'
import { getVideosByCreator } from '@/lib/db/videos'

/**
 * Debug endpoint to check why "My Videos" is empty
 * Only works in development mode
 */
export async function GET() {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'Only available in development' }, { status: 403 })
  }

  try {
    const supabase = await createClient()
    
    // Get current creator
    const creator = await getCurrentCreator()
    
    // Get videos via function
    const videos = creator ? await getVideosByCreator(creator.unique_identifier) : []
    
    // Also query directly to compare
    const { data: directVideos, error: directError } = creator ? await supabase
      .from('air_publisher_videos')
      .select('*')
      .eq('creator_unique_identifier', creator.unique_identifier)
      .order('created_at', { ascending: false }) : { data: null, error: null }
    
    // Get all videos (for comparison)
    const { data: allVideos, error: allError } = await supabase
      .from('air_publisher_videos')
      .select('id, title, creator_unique_identifier, status, created_at')
      .order('created_at', { ascending: false })
      .limit(20)
    
    return NextResponse.json({
      creator: creator ? {
        unique_identifier: creator.unique_identifier,
        display_name: (creator as any).handles || creator.display_name,
        found: true,
      } : null,
      videos: {
        viaFunction: videos.map(v => ({
          id: v.id,
          title: v.title,
          status: v.status,
          creator_unique_identifier: v.creator_unique_identifier,
        })),
        viaFunctionCount: videos.length,
        viaDirectQuery: directVideos?.map((v: any) => ({
          id: v.id,
          title: v.title,
          status: v.status,
          creator_unique_identifier: v.creator_unique_identifier,
        })) || [],
        viaDirectQueryCount: directVideos?.length || 0,
        directQueryError: directError?.message || null,
      },
      allVideos: allVideos || [],
      allVideosCount: allVideos?.length || 0,
      allVideosError: allError?.message || null,
      note: 'Check if creator_unique_identifier matches between creator and videos',
    })
  } catch (error: any) {
    return NextResponse.json({
      error: error.message || String(error),
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    }, { status: 500 })
  }
}


