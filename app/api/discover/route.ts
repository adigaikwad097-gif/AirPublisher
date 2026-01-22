import { NextResponse } from 'next/server'
import { getAllPostedVideos } from '@/lib/db/videos'
import { getCreatorProfile } from '@/lib/db/creator'

// Force dynamic rendering - this route uses request.url
export const dynamic = 'force-dynamic'

type FilterType = 'latest' | 'top' | 'trending'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const filter = (searchParams.get('filter') || 'latest') as FilterType
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = 20
    const offset = (page - 1) * limit

    // Get videos based on filter
    let videos
    if (filter === 'latest') {
      // Latest: Order by created_at DESC
      videos = await getAllPostedVideos(limit, offset)
      // Sort by created_at DESC (newest first)
      videos.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    } else if (filter === 'top') {
      // Top: Order by views DESC
      videos = await getAllPostedVideos(limit, offset)
      // Sort by views (already done in getAllPostedVideos, but ensure it's correct)
      videos.sort((a, b) => (b.views || 0) - (a.views || 0))
    } else if (filter === 'trending') {
      // Trending: Order by views in last 7 days / created_at
      videos = await getAllPostedVideos(limit, offset)
      // For now, same as top (can be enhanced with time-based scoring)
      videos.sort((a, b) => (b.views || 0) - (a.views || 0))
    } else {
      videos = await getAllPostedVideos(limit, offset)
    }

    // Log video URLs for debugging
    console.log('[discover API] Videos with URLs:', videos.map(v => ({
      id: v.id,
      title: v.title,
      hasVideoUrl: !!v.video_url,
      videoUrl: v.video_url?.substring(0, 50) + '...',
    })))

    // Fetch creator profiles for each video
    const videoWithCreators = await Promise.all(
      videos.map(async (video) => {
        try {
          const creator = await getCreatorProfile(video.creator_unique_identifier)
          return {
            ...video,
            creator: {
              unique_identifier: creator.unique_identifier,
              display_name: (creator as any).handles || creator.display_name || 'Unknown Creator',
              avatar_url: (creator as any).profile_pic_url || creator.avatar_url,
              niche: (creator as any).Niche || creator.niche,
            },
          }
        } catch {
          return {
            ...video,
            creator: {
              unique_identifier: video.creator_unique_identifier,
              display_name: 'Unknown Creator',
              avatar_url: null,
              niche: null,
            },
          }
        }
      })
    )

    return NextResponse.json({
      videos: videoWithCreators,
      filter,
      page,
      hasMore: videoWithCreators.length >= limit,
    })
  } catch (error: any) {
    console.error('[discover API] Error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch videos' },
      { status: 500 }
    )
  }
}

