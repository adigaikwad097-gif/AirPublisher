import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCurrentCreator } from '@/lib/db/creator'

// Force dynamic rendering - this route uses cookies and request.url
export const dynamic = 'force-dynamic'

/**
 * Initiate Instagram OAuth via Supabase Auth
 * Uses Supabase's Facebook provider with Instagram scopes
 */
export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    let user = null
    let authError = null
    
    try {
      const authResult = await supabase.auth.getUser()
      user = authResult.data?.user || null
      authError = authResult.error || null
      
      console.log('[Instagram OAuth] Auth check:', {
        hasUser: !!user,
        userEmail: user?.email,
        error: authError?.message || null,
      })
    } catch (error: any) {
      console.error('[Instagram OAuth] Auth check exception:', error?.message || String(error))
      authError = error
    }

    // In development, allow OAuth even without user (for testing)
    const isDevelopment = process.env.NODE_ENV === 'development'
    
    if (!isDevelopment && (!user || authError)) {
      console.error('[Instagram OAuth] Auth failed, redirecting to login')
      return NextResponse.redirect(new URL('/login', request.url))
    }

    // Try to get creator profile (but don't require it)
    let creator = null
    try {
      creator = await getCurrentCreator()
    } catch (error: any) {
      console.warn('[Instagram OAuth] Could not get creator profile:', error?.message || String(error))
      // Continue anyway - we can still connect accounts
    }

    // If no creator, we'll use user ID for connection
    if (!creator && !user) {
      return NextResponse.redirect(
        new URL('/settings/connections?error=no_user_or_creator', request.url)
      )
    }

    // Build redirect URL
    const redirectUrl = new URL('/api/auth/instagram-supabase/callback', request.url)
    
    // Use Supabase Auth for Facebook OAuth with Instagram scopes
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'facebook',
      options: {
        scopes: 'email,public_profile,pages_show_list,pages_read_engagement,pages_manage_metadata,pages_manage_posts,instagram_basic,instagram_content_publish',
        redirectTo: redirectUrl.toString(),
      },
    })

    if (error) {
      console.error('Supabase OAuth error:', error)
      return NextResponse.redirect(
        new URL(`/settings/connections?error=${encodeURIComponent(error.message)}`, request.url)
      )
    }

    // Redirect to OAuth URL
    if (data.url) {
      return NextResponse.redirect(data.url)
    }

    return NextResponse.json({ error: 'Failed to initiate OAuth' }, { status: 500 })
  } catch (error: any) {
    console.error('Instagram Supabase OAuth error:', error)
    return NextResponse.json(
      { error: 'Failed to initiate Instagram OAuth' },
      { status: 500 }
    )
  }
}

