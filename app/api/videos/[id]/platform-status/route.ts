import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { Database } from '@/lib/supabase/types'
import { getValidYouTubeAccessToken } from '@/lib/youtube/tokens'
import { getValidInstagramAccessToken } from '@/lib/instagram/tokens'

/**
 * Check platform token status for a video's creator
 * Returns which platforms are connected and if tokens are valid
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = params instanceof Promise ? await params : params
    const videoId = resolvedParams.id

    const supabase = await createClient()
    const serviceClient = createServiceClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Get video to find creator
    const { data: video, error: videoError } = await (serviceClient
      .from('air_publisher_videos') as any)
      .select('creator_unique_identifier')
      .eq('id', videoId)
      .single()

    if (videoError || !video) {
      return NextResponse.json(
        { error: 'Video not found' },
        { status: 404 }
      )
    }

    const creatorId = video.creator_unique_identifier

    // Check each platform
    const platforms = [
      { platform: 'internal' as const, name: 'Air Publisher' },
      { platform: 'youtube' as const, name: 'YouTube' },
      { platform: 'instagram' as const, name: 'Instagram' },
      { platform: 'tiktok' as const, name: 'TikTok' },
    ]

    const platformStatuses = await Promise.all(
      platforms.map(async ({ platform }) => {
        if (platform === 'internal') {
          // Internal (Air Publisher) is always available
          return {
            platform,
            connected: true,
            tokenExpired: false,
          }
        }

        // Check for tokens in new table first
        const newTable = `airpublisher_${platform}_tokens`
        const oldTable = `${platform}_tokens`

        let tokens: any = null
        let tokenError = null

        // Try new table
        const { data: newTokens, error: newError } = await (serviceClient
          .from(newTable) as any)
          .select('*')
          .eq('creator_unique_identifier', creatorId)
          .maybeSingle()

        if (newTokens && !newError) {
          tokens = newTokens
        } else {
          // Try old table
          const { data: oldTokens, error: oldError } = await (serviceClient
            .from(oldTable) as any)
            .select('*')
            .eq('creator_unique_identifier', creatorId)
            .maybeSingle()

          if (oldTokens && !oldError) {
            tokens = oldTokens
          } else {
            tokenError = newError || oldError
          }
        }

        if (!tokens) {
          return {
            platform,
            connected: false,
            tokenExpired: false,
          }
        }

        // Check if token is valid (not expired)
        let tokenValid = false
        let tokenExpired = false

        try {
          if (platform === 'youtube') {
            const validToken = await getValidYouTubeAccessToken(creatorId)
            tokenValid = !!validToken
            tokenExpired = !validToken
          } else if (platform === 'instagram') {
            const validToken = await getValidInstagramAccessToken(creatorId)
            tokenValid = !!validToken
            tokenExpired = !validToken
          } else if (platform === 'tiktok') {
            // Check TikTok token expiration
            const tokenData = tokens as any
            const expiresAt = tokenData.expires_at
            if (expiresAt) {
              const expirationDate = new Date(expiresAt)
              // Add 5 minute buffer for expiration check
              const bufferTime = 5 * 60 * 1000 // 5 minutes in milliseconds
              tokenExpired = expirationDate.getTime() < (Date.now() + bufferTime)
              tokenValid = !tokenExpired && !!tokens.access_token
            } else {
              // If no expiration, assume valid if token exists
              tokenValid = !!tokens.access_token
            }
          }
        } catch (error) {
          console.error(`[platform-status] Error checking ${platform} token:`, error)
          tokenExpired = true
          tokenValid = false
        }

        return {
          platform,
          connected: !!tokens,
          tokenExpired: !tokenValid,
        }
      })
    )

    return NextResponse.json({
      platforms: platformStatuses,
    })
  } catch (error: any) {
    console.error('[platform-status] Error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to check platform status' },
      { status: 500 }
    )
  }
}

