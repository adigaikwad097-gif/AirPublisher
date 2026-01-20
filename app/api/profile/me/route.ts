import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { Database } from '@/lib/supabase/types'
import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'

async function setProfileCookie(uniqueIdentifier: string) {
  try {
    const cookieStore = await cookies()
    cookieStore.set('creator_profile_id', uniqueIdentifier, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 365, // 1 year
    })
    console.log('[profile/me] Stored profile ID in cookie:', uniqueIdentifier)
  } catch (e) {
    console.warn('[profile/me] Could not set cookie:', e)
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Try to get user from server
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (!user || authError) {
      // In dev mode, try to use service role to look up by any means
      if (process.env.NODE_ENV === 'development' && process.env.SUPABASE_SERVICE_ROLE_KEY) {
        console.log('[profile/me] Dev mode: Auth check failed, trying cookie lookup...')
        const cookieStore = await cookies()
        const cookieProfileId = cookieStore.get('creator_profile_id')?.value
        if (cookieProfileId) {
          const serviceClient = createServiceClient<Database>(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
          )
          const { data: profile } = await (serviceClient
            .from('airpublisher_creator_profiles') as any)
            .select('*')
            .eq('creator_unique_identifier', cookieProfileId)
            .maybeSingle()
          
          if (profile) {
            return NextResponse.json({
              success: true,
              profile: {
                unique_identifier: profile.creator_unique_identifier,
                handles: profile.handles,
                profile_pic_url: profile.profile_pic_url,
              },
            })
          }
        }
      }
      
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    // User is authenticated - fetch their profile
    const { data: profile, error: profileError } = await (supabase
      .from('airpublisher_creator_profiles') as any)
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle()

    if (profileError) {
      console.error('[profile/me] Error fetching profile:', profileError)
      return NextResponse.json(
        { error: 'Failed to fetch profile' },
        { status: 500 }
      )
    }

    if (!profile) {
      // No profile exists yet - user needs to create one
      return NextResponse.json(
        { error: 'Profile not found', needsSetup: true },
        { status: 404 }
      )
    }

    // Profile found - ensure cookie is set
    if (profile.creator_unique_identifier) {
      await setProfileCookie(profile.creator_unique_identifier)
    }

    return NextResponse.json({
      success: true,
      profile: {
        unique_identifier: profile.creator_unique_identifier,
        handles: profile.handles,
        Niche: profile.Niche,
        profile_pic_url: profile.profile_pic_url,
      },
    })
  } catch (error: any) {
    console.error('[profile/me] Exception:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

