import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getAyrshareProfile } from '@/lib/ayrshare/user'
import { generateConnectUrl } from '@/lib/ayrshare/connect'
import { verifyN8nWebhook } from '@/lib/webhooks/n8n'

/**
 * Generate Ayrshare connect URL for a user
 * This URL opens Ayrshare's OAuth page where users authorize their accounts
 * 
 * Query params:
 * - creator_unique_identifier: Required
 * - platforms: Optional comma-separated list (youtube,instagram,tiktok)
 * - redirect_url: Optional redirect after connection
 */
export async function GET(request: Request) {
  try {
    // Check if called by n8n (with auth) or by user (with session)
    const isN8n = await verifyN8nWebhook(request)
    
    if (!isN8n) {
      // Verify user session
      const supabase = await createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
    }

    const { searchParams } = new URL(request.url)
    const creatorUniqueIdentifier = searchParams.get('creator_unique_identifier')
    const platformsParam = searchParams.get('platforms')
    const redirectUrl = searchParams.get('redirect_url')

    if (!creatorUniqueIdentifier) {
      return NextResponse.json(
        { error: 'Missing required parameter: creator_unique_identifier' },
        { status: 400 }
      )
    }

    // Get user's Ayrshare profile
    const ayrshareProfile = await getAyrshareProfile(creatorUniqueIdentifier)
    if (!ayrshareProfile || !ayrshareProfile.ayrshare_profile_key) {
      return NextResponse.json(
        { error: 'Ayrshare profile not found. Please create a profile first.' },
        { status: 404 }
      )
    }

    // Get Ayrshare API key
    const ayrshareApiKey = process.env.AYRSHARE_API_KEY
    if (!ayrshareApiKey) {
      return NextResponse.json(
        { error: 'AYRSHARE_API_KEY not configured' },
        { status: 500 }
      )
    }

    // Parse platforms if provided
    const platforms = platformsParam
      ? platformsParam.split(',').map((p) => p.trim())
      : undefined

    // Generate connect URL
    const connectData = await generateConnectUrl(
      ayrshareProfile.ayrshare_profile_key,
      ayrshareApiKey,
      platforms,
      redirectUrl || undefined
    )

    return NextResponse.json({
      success: true,
      connectUrl: connectData.connectUrl,
      expiresAt: connectData.expiresAt,
    })
  } catch (error: any) {
    console.error('Ayrshare connect URL error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to generate connect URL' },
      { status: 500 }
    )
  }
}


