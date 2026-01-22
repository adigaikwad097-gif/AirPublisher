import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCurrentCreator } from '@/lib/db/creator'
import { getCreatorProfile } from '@/lib/db/creator'

/**
 * Get comments for a video
 * GET: Fetch all comments for a video
 * POST: Add a new comment
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = params instanceof Promise ? await params : params
    const videoId = resolvedParams.id

    const supabase = await createClient()

    // Get all comments for the video
    const { data: comments, error } = await (supabase
      .from('airpublisher_video_comments') as any)
      .select('*')
      .eq('video_id', videoId)
      .order('created_at', { ascending: false })

    if (error) {
      throw error
    }

    // Fetch creator profiles for each comment
    const commentsWithCreators = await Promise.all(
      (comments || []).map(async (comment: any) => {
        try {
          const creator = await getCreatorProfile(comment.creator_unique_identifier)
          return {
            ...comment,
            creator: {
              unique_identifier: creator.unique_identifier,
              display_name: creator.display_name || 'Unknown Creator',
              avatar_url: creator.avatar_url,
            },
          }
        } catch {
          return {
            ...comment,
            creator: {
              unique_identifier: comment.creator_unique_identifier,
              display_name: 'Unknown Creator',
              avatar_url: null,
            },
          }
        }
      })
    )

    return NextResponse.json({ comments: commentsWithCreators })
  } catch (error: any) {
    console.error('[comments] Error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch comments' },
      { status: 500 }
    )
  }
}

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

    const { comment_text } = await request.json()

    if (!comment_text || comment_text.trim().length === 0) {
      return NextResponse.json(
        { error: 'Comment text is required' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Insert comment
    const { data: comment, error } = await (supabase
      .from('airpublisher_video_comments') as any)
      .insert({
        video_id: videoId,
        creator_unique_identifier: creator.unique_identifier,
        comment_text: comment_text.trim(),
      })
      .select()
      .single()

    if (error) {
      throw error
    }

    // Fetch creator profile for the comment
    const creatorProfile = await getCreatorProfile(creator.unique_identifier)

    return NextResponse.json({
      comment: {
        ...comment,
        creator: {
          unique_identifier: creatorProfile.unique_identifier,
          display_name: creatorProfile.display_name || 'Unknown Creator',
          avatar_url: creatorProfile.avatar_url,
        },
      },
    })
  } catch (error: any) {
    console.error('[comments] Error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to add comment' },
      { status: 500 }
    )
  }
}


