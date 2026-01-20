import { NextResponse } from 'next/server'
import { getCreatorProfile } from '@/lib/db/creator'

/**
 * Get creator profile by unique identifier
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ identifier: string }> | { identifier: string } }
) {
  try {
    const resolvedParams = params instanceof Promise ? await params : params
    const identifier = resolvedParams.identifier

    if (!identifier) {
      return NextResponse.json(
        { error: 'Creator identifier is required' },
        { status: 400 }
      )
    }

    const creator = await getCreatorProfile(identifier)

    // Map to expected format
    const profile = creator as any
    const mappedCreator = {
      ...profile,
      display_name: profile.handles || profile.display_name || null,
      niche: profile.Niche || profile.niche || null,
      avatar_url: profile.profile_pic_url || profile.avatar_url || null,
    }

    return NextResponse.json({ creator: mappedCreator })
  } catch (error: any) {
    console.error('[API] Error fetching creator:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch creator' },
      { status: 500 }
    )
  }
}


