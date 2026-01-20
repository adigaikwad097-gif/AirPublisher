import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCurrentCreator } from '@/lib/db/creator'

/**
 * Debug endpoint to check profile lookup
 * Only works in development mode
 */
export async function GET() {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'Only available in development' }, { status: 403 })
  }

  try {
    const supabase = await createClient()
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    // Get all profiles (for debugging)
    const { data: allProfiles, error: profilesError } = await supabase
      .from('creator_profiles')
      .select('id, unique_identifier, handles, Niche, created_at')
      .order('id', { ascending: false })
      .limit(10)
    
    // Try getCurrentCreator
    const currentCreator = await getCurrentCreator()
    
    // Check cookies
    const { cookies } = await import('next/headers')
    const cookieStore = await cookies()
    const cookieProfileId = cookieStore.get('creator_profile_id')?.value
    
    return NextResponse.json({
      user: {
        id: user?.id || null,
        email: user?.email || null,
        hasUser: !!user,
      },
      authError: authError?.message || null,
      cookie: {
        creator_profile_id: cookieProfileId || null,
        hasCookie: !!cookieProfileId,
      },
      currentCreator: currentCreator ? {
        unique_identifier: currentCreator.unique_identifier,
        display_name: currentCreator.display_name || (currentCreator as any).handles,
        found: true,
      } : null,
      allProfiles: allProfiles || [],
      profilesError: profilesError?.message || null,
      profileCount: allProfiles?.length || 0,
    })
  } catch (error: any) {
    return NextResponse.json({
      error: error.message || String(error),
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    }, { status: 500 })
  }
}


