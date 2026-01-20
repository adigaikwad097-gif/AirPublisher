import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCreatorByUserId } from '@/lib/db/creator'
import { cookies } from 'next/headers'

/**
 * Debug endpoint to check profile lookup
 * GET /api/debug/profile-lookup
 */
export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({
        error: 'Not authenticated',
        authError: authError?.message,
      }, { status: 401 })
    }
    
    // Get cookie
    const cookieStore = await cookies()
    const cookieProfileId = cookieStore.get('creator_profile_id')?.value
    
    // Try to find profile
    const profile = await getCreatorByUserId(user.id)
    
    // Get all profiles with user prefix for debugging
    const userPrefix = user.id.slice(0, 8)
    const searchPattern = `creator_${userPrefix}_%`
    const { data: matchingProfiles } = await supabase
      .from('creator_profiles')
      .select('unique_identifier, handles, created_at')
      .like('unique_identifier', searchPattern)
      .order('created_at', { ascending: false })
      .limit(10)
    
    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        prefix: userPrefix,
      },
      cookie: {
        profileId: cookieProfileId || null,
      },
      profile: profile ? {
        unique_identifier: profile.unique_identifier,
        display_name: profile.display_name,
        handles: (profile as any).handles,
      } : null,
      matchingProfiles: matchingProfiles || [],
      searchPattern,
    })
  } catch (error: any) {
    return NextResponse.json({
      error: error.message || String(error),
    }, { status: 500 })
  }
}


