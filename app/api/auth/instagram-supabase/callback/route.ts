import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { Database } from '@/lib/supabase/types'
import { getCurrentCreator } from '@/lib/db/creator'

// Force dynamic rendering - this route uses cookies and request.url
export const dynamic = 'force-dynamic'

/**
 * Instagram OAuth callback via Supabase Auth
 * Extracts tokens, exchanges for long-lived token, gets Instagram Business Account ID
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
    } catch (error: any) {
      console.error('[Instagram Callback] Auth check exception:', error?.message || String(error))
      authError = error
    }

    // In development, allow callback even without user (for testing)
    const isDevelopment = process.env.NODE_ENV === 'development'
    
    if (!isDevelopment && (!user || authError)) {
      return NextResponse.redirect(new URL('/login', request.url))
    }

    // Try to get creator profile (but don't require it)
    let creator = null
    try {
      creator = await getCurrentCreator()
    } catch (error: any) {
      console.warn('[Instagram Callback] Could not get creator profile:', error?.message || String(error))
    }

    // If no user and no creator, we can't proceed
    if (!user && !creator) {
      return NextResponse.redirect(
        new URL('/settings/connections?error=no_user_or_creator', request.url)
      )
    }

    // Use creator unique_identifier if available, otherwise generate one from user ID
    const creatorUniqueIdentifier = creator?.unique_identifier || (user ? `creator_${user.id.slice(0, 8)}_${Date.now()}` : null)
    
    if (!creatorUniqueIdentifier) {
      return NextResponse.redirect(
        new URL('/settings/connections?error=no_identifier', request.url)
      )
    }

    // Get session to extract provider tokens
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session?.provider_token) {
      return NextResponse.redirect(
        new URL('/settings/connections?error=no_tokens', request.url)
      )
    }

    const appId = process.env.META_APP_ID || process.env.INSTAGRAM_APP_ID
    const appSecret = process.env.META_APP_SECRET || process.env.INSTAGRAM_APP_SECRET

    if (!appId || !appSecret) {
      return NextResponse.redirect(
        new URL('/settings/connections?error=oauth_not_configured', request.url)
      )
    }

    // Step 1: Exchange short-lived token for long-lived token
    const longLivedResponse = await fetch(
      `https://graph.facebook.com/v18.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${appId}&client_secret=${appSecret}&fb_exchange_token=${session.provider_token}`
    )

    const longLivedData = await longLivedResponse.json()
    const longLivedToken = longLivedData.access_token
    const expiresAt = longLivedData.expires_in
      ? new Date(Date.now() + longLivedData.expires_in * 1000).toISOString()
      : null

    if (!longLivedToken) {
      return NextResponse.redirect(
        new URL('/settings/connections?error=long_lived_token_failed', request.url)
      )
    }

    // Step 2: Get Pages
    const pagesResponse = await fetch(
      `https://graph.facebook.com/v18.0/me/accounts?access_token=${longLivedToken}`
    )
    const pagesData = await pagesResponse.json()

    // Step 3: Get Instagram Business Account ID
    let instagramBusinessAccountId: string | null = null
    let username: string | null = null
    let pageId: string | null = null

    if (pagesData.data && pagesData.data.length > 0) {
      for (const page of pagesData.data) {
        const igAccountResponse = await fetch(
          `https://graph.facebook.com/v18.0/${page.id}?fields=instagram_business_account&access_token=${longLivedToken}`
        )
        const igAccountData = await igAccountResponse.json()

        if (igAccountData.instagram_business_account) {
          instagramBusinessAccountId = igAccountData.instagram_business_account.id
          pageId = page.id

          // Get username
          const igUserResponse = await fetch(
            `https://graph.facebook.com/v18.0/${instagramBusinessAccountId}?fields=username&access_token=${longLivedToken}`
          )
          const igUserData = await igUserResponse.json()
          username = igUserData.username || null
          break
        }
      }
    }

    if (!instagramBusinessAccountId) {
      return NextResponse.redirect(
        new URL('/settings/connections?error=no_instagram_business_account', request.url)
      )
    }

    // Step 4: Store tokens in Supabase
    const serviceClient = createServiceClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const tokenData: Record<string, any> = {
      user_id: user?.id || 'dev_user',
      creator_unique_identifier: creatorUniqueIdentifier,
      access_token: longLivedToken,
      expires_at: expiresAt,
      updated_at: new Date().toISOString(),
      instagram_id: instagramBusinessAccountId,
      instagram_business_account_id: instagramBusinessAccountId,
      username: username,
      page_id: pageId,
    }

    // Check if exists (by user_id if available, or by creator_unique_identifier)
    const lookupField = user?.id ? 'user_id' : 'creator_unique_identifier'
    const lookupValue = user?.id || creatorUniqueIdentifier
    
    const { data: existing } = await (serviceClient
      .from('instagram_tokens') as any)
      .select('user_id, creator_unique_identifier')
      .eq(lookupField, lookupValue)
      .maybeSingle()

    if (existing) {
      await (serviceClient
        .from('instagram_tokens') as any)
        .update(tokenData)
        .eq(lookupField, lookupValue)
    } else {
      await (serviceClient
        .from('instagram_tokens') as any)
        .insert(tokenData)
    }

    return NextResponse.redirect(
      new URL('/settings/connections?success=instagram_connected', request.url)
    )
  } catch (error: any) {
    console.error('Instagram Supabase callback error:', error)
    return NextResponse.redirect(
      new URL(`/settings/connections?error=${encodeURIComponent(error.message)}`, request.url)
    )
  }
}

