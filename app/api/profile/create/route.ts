import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { Database } from '@/lib/supabase/types'
import { cookies } from 'next/headers'

// Force dynamic rendering - this route uses cookies
export const dynamic = 'force-dynamic'

async function setProfileCookie(uniqueIdentifier: string) {
  try {
    const cookieStore = await cookies()
    cookieStore.set('creator_profile_id', uniqueIdentifier, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 365, // 1 year
    })
    console.log('[setProfileCookie] Stored profile ID in cookie:', uniqueIdentifier)
  } catch (e) {
    console.warn('[setProfileCookie] Could not set cookie:', e)
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { display_name, niche, avatar_url, user_id: clientUserId } = body

    // TEMPORARY: Skip server-side session detection - use client-provided user_id
    // This avoids cookie issues during development
    if (!clientUserId) {
      return NextResponse.json(
        { error: 'User ID is required. Please sign in and try again.' },
        { status: 401 }
      )
    }

    // Validate user exists in Supabase using service role
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json(
        { error: 'Server configuration error. Service role key not found.' },
        { status: 500 }
      )
    }

    const serviceClient = createServiceClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Verify user exists in Supabase Auth
    const { data: authUser, error: userError } = await serviceClient.auth.admin.getUserById(clientUserId)
    if (userError || !authUser) {
      console.error('[API Profile Create] Invalid user ID:', userError?.message)
      return NextResponse.json(
        { error: 'Invalid user ID. Please sign in again.' },
        { status: 401 }
      )
    }

    console.log('[API Profile Create] ✅ Validated user exists:', authUser.user.email)
    const userId = clientUserId

    console.log('[API Profile Create] Creating profile for user:', userId)

    const profileData: any = {
      user_id: userId,
      handles: display_name || `user_${userId.slice(0, 8)}`,
    }
    
    // Note: Niche should be stored in creator_profiles table (shared schema), not here
    // airpublisher_creator_profiles only stores AIR Publisher specific fields
    if (avatar_url !== undefined) {
      profileData.profile_pic_url = avatar_url || null
    }

    // Use service role directly (bypasses RLS and session detection)
    console.log('[API Profile Create] Using service role to create profile')
    const result = await (serviceClient
      .from('airpublisher_creator_profiles') as any)
      .insert(profileData)
      .select()
      .single()

    if (result.error) {
      console.error('[API Profile Create] Error:', result.error)
      return NextResponse.json(
        { error: result.error.message || 'Failed to create profile' },
        { status: 500 }
      )
    }

    // Store in cookie
    if (result.data?.creator_unique_identifier) {
      await setProfileCookie(result.data.creator_unique_identifier)
    }

    return NextResponse.json({
      success: true,
      profile: {
        unique_identifier: result.data.creator_unique_identifier,
        handles: result.data.handles,
        profile_pic_url: result.data.profile_pic_url,
      },
    })
  } catch (error: any) {
    console.error('[API Profile Create] Exception:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

