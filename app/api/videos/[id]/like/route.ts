import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCurrentCreator } from '@/lib/db/creator'

/**
 * Like/Unlike a video
 * POST: Toggle like status
 * GET: Check if current user liked the video
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = params instanceof Promise ? await params : params
    const videoId = resolvedParams.id

    const creator = await getCurrentCreator()
    if (!creator) {
      return NextResponse.json(
        { error: 'Unauthorized: Please create a creator profile first' },
        { status: 401 }
      )
    }

    const supabase = await createClient()

    // Check if already liked
    const { data: existingLike } = await (supabase
      .from('airpublisher_video_likes') as any)
      .select('id')
      .eq('video_id', videoId)
      .eq('creator_unique_identifier', creator.unique_identifier)
      .maybeSingle()

    if (existingLike) {
      // Unlike: Delete the like
      const { error } = await (supabase
        .from('airpublisher_video_likes') as any)
        .delete()
        .eq('id', existingLike.id)

      if (error) {
        throw error
      }

      // Get updated like count
      const { count } = await (supabase
        .from('airpublisher_video_likes') as any)
        .select('*', { count: 'exact', head: true })
        .eq('video_id', videoId)

      return NextResponse.json({
        liked: false,
        likeCount: count || 0,
      })
    } else {
      // Like: Insert new like
      const { error } = await (supabase
        .from('airpublisher_video_likes') as any)
        .insert({
          video_id: videoId,
          creator_unique_identifier: creator.unique_identifier,
        })

      if (error) {
        throw error
      }

      // Get updated like count
      const { count } = await (supabase
        .from('airpublisher_video_likes') as any)
        .select('*', { count: 'exact', head: true })
        .eq('video_id', videoId)

      return NextResponse.json({
        liked: true,
        likeCount: count || 0,
      })
    }
  } catch (error: any) {
    console.error('[like] Error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to toggle like' },
      { status: 500 }
    )
  }
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = params instanceof Promise ? await params : params
    const videoId = resolvedParams.id

    const creator = await getCurrentCreator()
    if (!creator) {
      return NextResponse.json({ liked: false, likeCount: 0 })
    }

    const supabase = await createClient()

    // Check if user liked the video
    const { data: like } = await (supabase
      .from('airpublisher_video_likes') as any)
      .select('id')
      .eq('video_id', videoId)
      .eq('creator_unique_identifier', creator.unique_identifier)
      .maybeSingle()

    // Get total like count
    const { count } = await (supabase
      .from('airpublisher_video_likes') as any)
      .select('*', { count: 'exact', head: true })
      .eq('video_id', videoId)

    return NextResponse.json({
      liked: !!like,
      likeCount: count || 0,
    })
  } catch (error: any) {
    console.error('[like] Error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to check like status' },
      { status: 500 }
    )
  }
}


