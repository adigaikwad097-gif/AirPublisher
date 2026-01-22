import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { verifyN8nWebhook } from '@/lib/webhooks/n8n'
import { createVideo } from '@/lib/db/videos'

/**
 * Webhook endpoint for n8n to receive AI-generated content from AIR Ideas
 * Called by n8n when AIR Ideas generates new content
 * 
 * Expected payload from n8n:
 * {
 *   "creator_unique_identifier": "creator-id",
 *   "title": "Generated Title",
 *   "description": "Generated description",
 *   "video_url": "https://...",
 *   "thumbnail_url": "https://..." (optional),
 *   "platform_suggestions": ["youtube", "instagram"] (optional)
 * }
 */
export async function POST(request: Request) {
  try {
    // Verify webhook signature
    const isValid = await verifyN8nWebhook(request)
    if (!isValid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      creator_unique_identifier,
      title,
      description,
      video_url,
      thumbnail_url,
      platform_suggestions,
    } = body

    if (!creator_unique_identifier || !title || !video_url) {
      return NextResponse.json(
        {
          error:
            'Missing required fields: creator_unique_identifier, title, video_url',
        },
        { status: 400 }
      )
    }

    // Verify creator exists
    const supabase = await createClient()
    const { data: creator, error: creatorError } = await supabase
      .from('creator_profiles')
      .select('unique_identifier')
      .eq('unique_identifier', creator_unique_identifier)
      .single()

    if (creatorError || !creator) {
      return NextResponse.json(
        { error: 'Creator not found' },
        { status: 404 }
      )
    }

    // Create draft video entry
    // Default to first platform suggestion or 'youtube'
    const platformTarget =
      (platform_suggestions && platform_suggestions[0]) || 'youtube'

    const video = await createVideo({
      creator_unique_identifier,
      source_type: 'ai_generated',
      title,
      description: description || null,
      video_url,
      thumbnail_url: thumbnail_url || null,
      platform_target: platformTarget as any,
      status: 'draft',
      views: 0,
      scheduled_at: null,
      posted_at: null,
    } as any)

    return NextResponse.json({
      success: true,
      video,
      message: 'AI-generated content imported as draft',
    })
  } catch (error) {
    console.error('n8n ai-content webhook error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}


