import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { Database } from '@/lib/supabase/types'

/**
 * Instagram OAuth callback
 * Instagram uses Facebook OAuth, so we need to:
 * 1. Exchange code for Facebook access token
 * 2. Get Instagram Business Account ID
 * 3. Get long-lived token
 * 4. Store in instagram_tokens table
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')
    const state = searchParams.get('state')
    const error = searchParams.get('error')

    if (error) {
      return NextResponse.redirect(
        new URL(`/settings/connections?error=${encodeURIComponent(error)}`, request.url)
      )
    }

    if (!code || !state) {
      return NextResponse.redirect(
        new URL('/settings/connections?error=missing_code', request.url)
      )
    }

    // Decode state
    let stateData: { creator_unique_identifier: string; user_id: string }
    try {
      stateData = JSON.parse(Buffer.from(state, 'base64url').toString())
    } catch {
      return NextResponse.redirect(
        new URL('/settings/connections?error=invalid_state', request.url)
      )
    }

    const appId = process.env.INSTAGRAM_APP_ID
    const appSecret = process.env.INSTAGRAM_APP_SECRET
    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/auth/instagram/callback`

    if (!appId || !appSecret) {
      return NextResponse.redirect(
        new URL('/settings/connections?error=oauth_not_configured', request.url)
      )
    }

    // Step 1: Exchange code for short-lived access token
    const tokenResponse = await fetch(
      `https://graph.facebook.com/v18.0/oauth/access_token?` +
      `client_id=${appId}&` +
      `client_secret=${appSecret}&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}&` +
      `code=${code}`,
      { method: 'GET' }
    )

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text()
      console.error('Token exchange error:', errorData)
      return NextResponse.redirect(
        new URL('/settings/connections?error=token_exchange_failed', request.url)
      )
    }

    const tokenData = await tokenResponse.json()
    const shortLivedToken = tokenData.access_token

    if (!shortLivedToken) {
      return NextResponse.redirect(
        new URL('/settings/connections?error=no_access_token', request.url)
      )
    }

    // Step 2: Exchange for long-lived token (60 days)
    const longLivedResponse = await fetch(
      `https://graph.facebook.com/v18.0/oauth/access_token?` +
      `grant_type=fb_exchange_token&` +
      `client_id=${appId}&` +
      `client_secret=${appSecret}&` +
      `fb_exchange_token=${shortLivedToken}`,
      { method: 'GET' }
    )

    let longLivedToken = shortLivedToken
    let expiresAt: string | null = null

    if (longLivedResponse.ok) {
      const longLivedData = await longLivedResponse.json()
      longLivedToken = longLivedData.access_token || shortLivedToken
      if (longLivedData.expires_in) {
        expiresAt = new Date(Date.now() + longLivedData.expires_in * 1000).toISOString()
      }
    }

    // Step 3: Get user's pages (to find Instagram Business Account)
    const pagesResponse = await fetch(
      `https://graph.facebook.com/v18.0/me/accounts?access_token=${longLivedToken}`
    )

    let instagramBusinessAccountId = null
    let pageId = null
    let username = null

    if (pagesResponse.ok) {
      const pagesData = await pagesResponse.json()
      if (pagesData.data && pagesData.data.length > 0) {
        // Get first page (you might want to let user select)
        pageId = pagesData.data[0].id
        
        // Get Instagram Business Account for this page
        const igAccountResponse = await fetch(
          `https://graph.facebook.com/v18.0/${pageId}?` +
          `fields=instagram_business_account&` +
          `access_token=${longLivedToken}`
        )

        if (igAccountResponse.ok) {
          const igData = await igAccountResponse.json()
          instagramBusinessAccountId = igData.instagram_business_account?.id || null
          
          if (instagramBusinessAccountId) {
            // Get Instagram account info
            const igInfoResponse = await fetch(
              `https://graph.facebook.com/v18.0/${instagramBusinessAccountId}?` +
              `fields=username&` +
              `access_token=${longLivedToken}`
            )
            if (igInfoResponse.ok) {
              const igInfo = await igInfoResponse.json()
              username = igInfo.username || null
            }
          }
        }
      }
    }

    // Step 4: Store tokens in database
    const serviceClient = createServiceClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data: existing } = await serviceClient
      .from('instagram_tokens')
      .select('user_id')
      .eq('user_id', stateData.user_id)
      .maybeSingle()

    const tokenRecord: any = {
      user_id: stateData.user_id,
      creator_unique_identifier: stateData.creator_unique_identifier, // Store for easier lookup
      instagram_id: instagramBusinessAccountId || 'pending',
      access_token: longLivedToken,
      username: username,
      updated_at: new Date().toISOString(),
      expires_at: expiresAt,
      instagram_business_account_id: instagramBusinessAccountId,
      page_id: pageId,
    }

    if (existing) {
      const { error: updateError } = await serviceClient
        .from('instagram_tokens')
        .update(tokenRecord)
        .eq('user_id', stateData.user_id)

      if (updateError) {
        console.error('Error updating Instagram tokens:', updateError)
        return NextResponse.redirect(
          new URL('/settings/connections?error=update_failed', request.url)
        )
      }
    } else {
      const { error: insertError } = await serviceClient
        .from('instagram_tokens')
        .insert(tokenRecord)

      if (insertError) {
        console.error('Error inserting Instagram tokens:', insertError)
        return NextResponse.redirect(
          new URL('/settings/connections?error=insert_failed', request.url)
        )
      }
    }

    return NextResponse.redirect(
      new URL('/settings/connections?success=instagram_connected', request.url)
    )
  } catch (error) {
    console.error('Instagram OAuth callback error:', error)
    return NextResponse.redirect(
      new URL('/settings/connections?error=callback_error', request.url)
    )
  }
}

