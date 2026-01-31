import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * API endpoint for n8n to update scheduled post status
 * 
 * This endpoint allows n8n to mark scheduled posts as:
 * - 'processing' - when starting to post
 * - 'posted' - when successfully posted
 * - 'failed' - when posting fails
 * 
 * POST /api/n8n/scheduled-posts/[id]/update-status
 * 
 * Body:
 * {
 *   "status": "processing" | "posted" | "failed",
 *   "error_message": "..." (optional, for failed status),
 *   "posted_at": "2024-01-01T12:00:00Z" (optional, for posted status)
 * }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    // Authenticate request
    const apiKey = request.headers.get('x-n8n-api-key')
    const authHeader = request.headers.get('authorization')
    const expectedApiKey = process.env.N8N_API_KEY

    if (!expectedApiKey) {
      return NextResponse.json(
        { error: 'N8N_API_KEY not configured' },
        { status: 500 }
      )
    }

    // Check authentication
    const providedKey = apiKey || authHeader?.replace('Bearer ', '')
    if (providedKey !== expectedApiKey) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get scheduled post ID from params
    const resolvedParams = params instanceof Promise ? await params : params
    const scheduledPostId = resolvedParams.id

    if (!scheduledPostId) {
      return NextResponse.json(
        { error: 'scheduled_post_id is required' },
        { status: 400 }
      )
    }

    // Parse request body
    const body = await request.json()
    const { status, error_message, posted_at } = body

    if (!status) {
      return NextResponse.json(
        { error: 'status is required' },
        { status: 400 }
      )
    }

    if (!['processing', 'posted', 'failed'].includes(status)) {
      return NextResponse.json(
        { error: 'status must be one of: processing, posted, failed' },
        { status: 400 }
      )
    }

    // Create Supabase client
    const supabase = await createClient()

    // Build update object
    const updates: {
      status: string
      error_message?: string | null
      posted_at?: string | null
      updated_at: string
    } = {
      status,
      updated_at: new Date().toISOString(),
    }

    // Add error message if provided
    if (error_message) {
      updates.error_message = error_message
    } else if (status !== 'failed') {
      // Clear error message if status is not failed
      updates.error_message = null
    }

    // Add posted_at if provided or if status is posted
    if (posted_at) {
      updates.posted_at = posted_at
    } else if (status === 'posted') {
      updates.posted_at = new Date().toISOString()
    } else if (status !== 'posted') {
      // Clear posted_at if status is not posted
      updates.posted_at = null
    }

    // Update scheduled post
    const { data, error } = await (supabase
      .from('air_publisher_scheduled_posts') as any)
      .update(updates)
      .eq('id', scheduledPostId)
      .select()
      .single()

    if (error) {
      console.error('Error updating scheduled post:', error)
      return NextResponse.json(
        { error: 'Failed to update scheduled post', details: error.message },
        { status: 500 }
      )
    }

    if (!data) {
      return NextResponse.json(
        { error: 'Scheduled post not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      scheduled_post: data,
    })
  } catch (error) {
    console.error('Error in update-status endpoint:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

