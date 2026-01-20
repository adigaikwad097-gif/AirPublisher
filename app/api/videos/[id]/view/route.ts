import { NextResponse } from 'next/server'
import { incrementVideoViews } from '@/lib/db/videos'

/**
 * Track a view for a video
 * Called when a user watches a video
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = params instanceof Promise ? await params : params
    const videoId = resolvedParams.id

    if (!videoId) {
      return NextResponse.json(
        { error: 'Video ID is required' },
        { status: 400 }
      )
    }

    // Increment view count
    const updatedVideo = await incrementVideoViews(videoId)

    if (!updatedVideo) {
      return NextResponse.json(
        { error: 'Video not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      views: updatedVideo.views,
    })
  } catch (error: any) {
    console.error('[API] Error tracking video view:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to track view' },
      { status: 500 }
    )
  }
}


