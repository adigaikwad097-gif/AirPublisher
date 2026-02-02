import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { getValidYouTubeAccessToken } from '@/lib/youtube/tokens'
import { getValidInstagramAccessToken } from '@/lib/instagram/tokens'

// Force dynamic rendering - this route uses request body
export const dynamic = 'force-dynamic'

/**
 * API endpoint for n8n to refresh platform access tokens
 * 
 * This endpoint allows n8n to refresh expired access tokens via HTTP
 * without needing to call the full video-details endpoint
 * 
 * POST /api/n8n/refresh-token
 * 
 * Body:
 * {
 *   "platform": "youtube" | "instagram" | "tiktok",
 *   "creator_unique_identifier": "creator-id"
 * }
 * 
 * Response:
 * {
 *   "success": true,
 *   "access_token": "new_access_token",
 *   "expires_at": "2024-01-01T12:00:00Z",
 *   "requires_reconnection": false
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // Note: No API key required - token refresh is allowed for any creator
    // Security: Gets creator from authenticated session
    
    // Parse request body
    const body = await request.json()
    const { platform, creator_unique_identifier: providedCreatorId } = body

    if (!platform) {
      return NextResponse.json(
        { error: 'Missing required field: platform' },
        { status: 400 }
      )
    }

    // Get creator_unique_identifier from session if not provided
    let creator_unique_identifier = providedCreatorId
    
    if (!creator_unique_identifier) {
      const supabase = await createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        return NextResponse.json(
          { error: 'Unauthorized - must be logged in or provide creator_unique_identifier' },
          { status: 401 }
        )
      }

      // Get creator profile
      const { data: profile } = await (supabase
        .from('airpublisher_creator_profiles') as any)
        .select('unique_identifier')
        .eq('user_id', user.id)
        .maybeSingle()

      if (!profile) {
        return NextResponse.json(
          { error: 'Creator profile not found' },
          { status: 404 }
        )
      }

      creator_unique_identifier = (profile as any).unique_identifier
    }

    if (!['youtube', 'instagram', 'tiktok'].includes(platform)) {
      return NextResponse.json(
        { error: 'Invalid platform. Must be one of: youtube, instagram, tiktok' },
        { status: 400 }
      )
    }

    // Create Supabase service client
    const serviceClient = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Get tokens from database
    const newTokenTable = `airpublisher_${platform}_tokens`
    const oldTokenTable = `${platform}_tokens`
    
    // Try new table first
    let { data: tokens, error: tokenError } = await (serviceClient
      .from(newTokenTable) as any)
      .select('*')
      .eq('creator_unique_identifier', creator_unique_identifier)
      .maybeSingle()
    
    // Fallback to old table if new table doesn't have tokens
    if (tokenError || !tokens) {
      const { data: oldTokens } = await (serviceClient
        .from(oldTokenTable) as any)
        .select('*')
        .eq('creator_unique_identifier', creator_unique_identifier)
        .maybeSingle()
      
      if (oldTokens) {
        tokens = oldTokens
        tokenError = null
      }
    }

    if (tokenError || !tokens) {
      return NextResponse.json(
        { error: `No ${platform} tokens found for creator` },
        { status: 404 }
      )
    }

    // Refresh token based on platform
    let refreshedAccessToken: string | null = null
    let expiresAt: string | null = null

    if (platform === 'youtube') {
      refreshedAccessToken = await getValidYouTubeAccessToken(
        tokens,
        creator_unique_identifier
      )
      
      if (refreshedAccessToken) {
        // Get updated token from database to get expires_at
        const { data: updatedTokens } = await (serviceClient
          .from(newTokenTable) as any)
          .select('expires_at')
          .eq('creator_unique_identifier', creator_unique_identifier)
          .maybeSingle()
        
        expiresAt = updatedTokens?.expires_at || tokens.expires_at || null
      } else {
        return NextResponse.json(
          {
            error: 'YouTube token expired and could not be refreshed. Please reconnect your YouTube account.',
            requires_reconnection: true
          },
          { status: 401 }
        )
      }
    } else if (platform === 'instagram') {
      refreshedAccessToken = await getValidInstagramAccessToken(
        tokens,
        creator_unique_identifier
      )
      
      if (refreshedAccessToken) {
        // Get updated token from database to get expires_at
        const { data: updatedTokens } = await (serviceClient
          .from(newTokenTable) as any)
          .select('expires_at')
          .eq('creator_unique_identifier', creator_unique_identifier)
          .maybeSingle()
        
        expiresAt = updatedTokens?.expires_at || tokens.expires_at || null
      } else {
        return NextResponse.json(
          {
            error: 'Instagram token expired and could not be refreshed. Please reconnect your Instagram account.',
            requires_reconnection: true
          },
          { status: 401 }
        )
      }
    } else if (platform === 'tiktok') {
      // TikTok tokens don't typically expire, but check if we have a valid token
      refreshedAccessToken = tokens.tiktok_access_token || tokens.access_token || null
      expiresAt = tokens.expires_at || null
      
      if (!refreshedAccessToken) {
        return NextResponse.json(
          {
            error: 'No TikTok access token found. Please reconnect your TikTok account.',
            requires_reconnection: true
          },
          { status: 401 }
        )
      }
    }

    if (!refreshedAccessToken) {
      return NextResponse.json(
        {
          error: 'Failed to refresh access token',
          requires_reconnection: true
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      access_token: refreshedAccessToken,
      expires_at: expiresAt,
      requires_reconnection: false,
      platform,
    })
  } catch (error) {
    console.error('Error in refresh-token endpoint:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

