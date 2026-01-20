import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getNangoClient, getConnectionId, getProviderName, type Platform } from '@/lib/nango/client'

/**
 * Generate Nango OAuth URL for connecting a platform
 * 
 * Query params:
 * - platform: 'youtube' | 'instagram' | 'tiktok'
 */
export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const platform = searchParams.get('platform') as Platform

    if (!platform || !['youtube', 'instagram', 'tiktok'].includes(platform)) {
      return NextResponse.json(
        { error: 'Invalid platform. Must be youtube, instagram, or tiktok' },
        { status: 400 }
      )
    }

    const nango = getNangoClient()
    const connectionId = getConnectionId(user.id, platform)
    const provider = getProviderName(platform)

    // Generate OAuth URL
    // Nango will handle the OAuth flow and redirect back
    const publicKey = process.env.NANGO_PUBLIC_KEY
    if (!publicKey) {
      return NextResponse.json(
        { error: 'NANGO_PUBLIC_KEY not configured' },
        { status: 500 }
      )
    }

    // Get the OAuth URL from Nango
    // This will be used by the frontend to open the OAuth flow
    const authUrl = await nango.getAuthUrl(provider, connectionId, {
      // Optional: Add any additional params
    })

    return NextResponse.json({
      success: true,
      authUrl,
      connectionId,
      provider,
    })
  } catch (error: any) {
    console.error('Nango connect error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to generate OAuth URL' },
      { status: 500 }
    )
  }
}


