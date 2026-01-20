import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * Debug endpoint to check videos in database
 * Only works in development mode
 */
export async function GET() {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'Only available in development' }, { status: 403 })
  }

  try {
    const supabase = await createClient()
    
    // Get all videos
    const { data: allVideos, error: allError } = await supabase
      .from('air_publisher_videos')
      .select('id, title, status, creator_unique_identifier, created_at, views')
      .order('created_at', { ascending: false })
      .limit(20)
    
    // Get videos by status
    const { data: draftVideos, error: draftError } = await supabase
      .from('air_publisher_videos')
      .select('id, title, status')
      .eq('status', 'draft')
      .limit(10)
    
    const { data: postedVideos, error: postedError } = await supabase
      .from('air_publisher_videos')
      .select('id, title, status')
      .eq('status', 'posted')
      .limit(10)
    
    // Get current creator
    const { data: { user } } = await supabase.auth.getUser()
    
    return NextResponse.json({
      user: {
        id: user?.id || null,
        email: user?.email || null,
      },
      allVideos: allVideos || [],
      allVideosCount: allVideos?.length || 0,
      draftVideos: draftVideos || [],
      draftCount: draftVideos?.length || 0,
      postedVideos: postedVideos || [],
      postedCount: postedVideos?.length || 0,
      errors: {
        all: allError?.message || null,
        draft: draftError?.message || null,
        posted: postedError?.message || null,
      },
      note: 'Discover page only shows videos with status="posted". Videos uploaded via form have status="draft".',
    })
  } catch (error: any) {
    return NextResponse.json({
      error: error.message || String(error),
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    }, { status: 500 })
  }
}


