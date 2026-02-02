import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CheckCircle2, XCircle, Youtube, Instagram, Music, LogOut } from 'lucide-react'
import { getCurrentCreator } from '@/lib/db/creator'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { Database } from '@/lib/supabase/types'
import { RefreshOnSuccess } from '@/components/settings/refresh-on-success'
import { RefreshTokenStatus } from '@/components/settings/refresh-token-status'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { SignOutButton } from '@/components/settings/sign-out-button'

export default async function ConnectionsPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string; error?: string }> | { success?: string; error?: string }
}) {
  const params = searchParams instanceof Promise ? await searchParams : searchParams
  
  // Check authentication first
  const supabase = await createClient()
  let user = null
  let authError = null
  
  try {
    const authResult = await supabase.auth.getUser()
    user = authResult.data?.user || null
    authError = authResult.error || null
    
    console.log('[ConnectionsPage] Auth check:', {
      hasUser: !!user,
      userEmail: user?.email,
      error: authError?.message || null,
    })
  } catch (error: any) {
    console.error('[ConnectionsPage] Auth check exception:', error?.message || String(error))
    authError = error
  }

  // In development, allow access even without auth (for testing)
  const isDevelopment = process.env.NODE_ENV === 'development'
  
  // Only redirect to login in production if not authenticated
  if (!isDevelopment && (!user || authError)) {
    console.error('[ConnectionsPage] Auth failed, redirecting to login:', {
      hasUser: !!user,
      error: authError?.message || 'Unknown error',
    })
    redirect('/login')
  }

  // In development, allow access even without user (for testing)
  // But show a message if no user
  if (!user && isDevelopment) {
    console.warn('[ConnectionsPage] No user found in development mode - allowing access for testing')
  }

  // Try to get creator profile (but don't redirect if not found - allow viewing connections)
  let creator = null
  try {
    creator = await getCurrentCreator()
  } catch (error: any) {
    console.error('[ConnectionsPage] Error fetching creator:', error?.message || String(error))
    // Don't redirect - allow user to connect accounts even without profile
  }

  // If no creator, show a message but still allow connection
  if (!creator) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-4xl font-extrabold mb-2 text-white">Platform Connections</h1>
          <p className="text-white/70 text-sm uppercase tracking-[0.4em]">
            Connect your social media accounts to enable automated publishing.
          </p>
        </div>
        <Card className="bg-white/5 border-white/10">
          <CardContent className="pt-6">
            <p className="text-[#89CFF0] mb-4">
              Please complete your creator profile first to link connections to your account.
            </p>
            <Link href="/setup">
              <Button className="bg-[#89CFF0] text-black hover:bg-[#89CFF0]/90">Set Up Profile</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Check which platforms are connected
  // Try new airpublisher_*_tokens tables first (by creator_unique_identifier), fallback to old tables (by user_id)
  // Use service role client as fallback if RLS blocks queries
  let youtubeTokens: { data: any; error: any } = { data: null, error: null }
  let instagramTokens: { data: any; error: any } = { data: null, error: null }
  let tiktokTokens: { data: any; error: any } = { data: null, error: null }

  // Create service role client for fallback
  const serviceClient = process.env.SUPABASE_SERVICE_ROLE_KEY
    ? createServiceClient<Database>(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      )
    : null


  if (creator?.unique_identifier) {
    // Try new tables with creator_unique_identifier (for YouTube, Instagram, TikTok)
    const [youtubeNew, instagramNew, tiktokNew] = await Promise.all([
      (supabase
        .from('airpublisher_youtube_tokens') as any)
        .select('user_id, creator_unique_identifier, channel_id, handle, channel_title, expires_at, google_refresh_token')
        .eq('creator_unique_identifier', creator.unique_identifier)
        .maybeSingle(),
      (supabase
        .from('airpublisher_instagram_tokens') as any)
        .select('user_id, creator_unique_identifier, instagram_id, username, expires_at, facebook_refresh_token')
        .eq('creator_unique_identifier', creator.unique_identifier)
        .maybeSingle(),
      (supabase
        .from('airpublisher_tiktok_tokens') as any)
        .select('user_id, creator_unique_identifier, tiktok_open_id, display_name, expires_at, tiktok_refresh_token')
        .eq('creator_unique_identifier', creator.unique_identifier)
        .maybeSingle(),
    ])

    // Log results for debugging
    console.log('[ConnectionsPage] Token lookup:', {
      creatorId: creator.unique_identifier,
      youtubeFound: !!youtubeNew.data,
      youtubeError: youtubeNew.error?.message || null,
      youtubeErrorCode: youtubeNew.error?.code || null,
      instagramFound: !!instagramNew.data,
      instagramError: instagramNew.error?.message || null,
      tiktokFound: !!tiktokNew.data,
      tiktokError: tiktokNew.error?.message || null,
    })

    // Use new table results if found
    youtubeTokens = youtubeNew.data ? youtubeNew : { data: null, error: youtubeNew.error }
    instagramTokens = instagramNew.data ? instagramNew : { data: null, error: instagramNew.error }
    tiktokTokens = tiktokNew.data ? tiktokNew : { data: null, error: tiktokNew.error }

    // If regular client failed (RLS or table doesn't exist), try service role
    if (!youtubeTokens.data && serviceClient && (youtubeNew.error || !youtubeNew.data)) {
      console.log('[ConnectionsPage] Trying service role for YouTube tokens...')
      const { data: serviceData, error: serviceError } = await (serviceClient
        .from('airpublisher_youtube_tokens') as any)
        .select('user_id, creator_unique_identifier, channel_id, handle, channel_title, expires_at, google_refresh_token')
        .eq('creator_unique_identifier', creator.unique_identifier)
        .maybeSingle()
      
      if (serviceData) {
        console.log('[ConnectionsPage] ✅ Found YouTube tokens via service role')
        youtubeTokens = { data: serviceData, error: null }
      } else if (serviceError) {
        console.error('[ConnectionsPage] Service role also failed:', serviceError)
      }
    }

    if (!instagramTokens.data && serviceClient && (instagramNew.error || !instagramNew.data)) {
      const { data: serviceData } = await (serviceClient
        .from('airpublisher_instagram_tokens') as any)
        .select('user_id, creator_unique_identifier, instagram_id, username, expires_at, facebook_refresh_token')
        .eq('creator_unique_identifier', creator.unique_identifier)
        .maybeSingle()
      if (serviceData) instagramTokens = { data: serviceData, error: null }
    }

    if (!tiktokTokens.data && serviceClient && (tiktokNew.error || !tiktokNew.data)) {
      const { data: serviceData } = await (serviceClient
        .from('airpublisher_tiktok_tokens') as any)
        .select('user_id, creator_unique_identifier, tiktok_open_id, display_name, expires_at, tiktok_refresh_token')
        .eq('creator_unique_identifier', creator.unique_identifier)
        .maybeSingle()
      if (serviceData) tiktokTokens = { data: serviceData, error: null }
    }
  }

  // Fallback to old tables if new tables didn't have tokens (or if no creator)
  if (!youtubeTokens.data && user) {
    const oldYoutube = await (supabase
      .from('youtube_tokens') as any)
      .select('user_id, channel_id, handle, expires_at')
      .eq('user_id', user.id)
      .maybeSingle()
    if (oldYoutube.data) {
      console.log('[ConnectionsPage] Found YouTube tokens in old table')
      youtubeTokens = oldYoutube
    } else if (serviceClient) {
      // Try service role for old table too
      const { data: serviceData } = await (serviceClient
        .from('youtube_tokens') as any)
        .select('user_id, channel_id, handle, expires_at')
        .eq('user_id', user.id)
        .maybeSingle()
      if (serviceData) youtubeTokens = { data: serviceData, error: null }
    }
  }

  if (!instagramTokens.data && user) {
    const oldInstagram = await (supabase
      .from('instagram_tokens') as any)
      .select('user_id, instagram_id, username, expires_at')
      .eq('user_id', user.id)
      .maybeSingle()
    if (oldInstagram.data) instagramTokens = oldInstagram
  }

  if (!tiktokTokens.data && user) {
    const oldTiktok = await (supabase
      .from('tiktok_tokens') as any)
      .select('user_id, tiktok_open_id, display_name, expires_at')
      .eq('user_id', user.id)
      .maybeSingle()
    if (oldTiktok.data) tiktokTokens = oldTiktok
  }

  // Final log
  console.log('[ConnectionsPage] Final token status:', {
    youtube: !!youtubeTokens.data,
    instagram: !!instagramTokens.data,
    tiktok: !!tiktokTokens.data,
  })

  const isYouTubeConnected = !!youtubeTokens.data
  const isInstagramConnected = !!instagramTokens.data
  const isTikTokConnected = !!tiktokTokens.data

  // Check if access tokens are expired (but can be auto-refreshed)
  const youtubeExpiresAt = (youtubeTokens.data as any)?.expires_at
  const instagramExpiresAt = (instagramTokens.data as any)?.expires_at
  const tiktokExpiresAt = (tiktokTokens.data as any)?.expires_at

  const isYouTubeExpired = isYouTubeConnected && youtubeExpiresAt
    ? new Date(youtubeExpiresAt) < new Date()
    : false
  const isInstagramExpired = isInstagramConnected && instagramExpiresAt
    ? new Date(instagramExpiresAt) < new Date()
    : false
  const isTikTokExpired = isTikTokConnected && tiktokExpiresAt
    ? new Date(tiktokExpiresAt) < new Date()
    : false

  // Check refresh token status (if refresh token is expired, user needs to reconnect)
  // For now, we'll check by trying to refresh - but this is expensive, so we'll do it client-side
  // Or we can check if refresh token exists
  const youtubeRefreshToken = (youtubeTokens.data as any)?.google_refresh_token
  const instagramRefreshToken = (instagramTokens.data as any)?.facebook_refresh_token
  const tiktokRefreshToken = (tiktokTokens.data as any)?.tiktok_refresh_token

  // If access token is expired but no refresh token, refresh token is likely expired/invalid
  const isYouTubeRefreshTokenExpired = isYouTubeConnected && isYouTubeExpired && !youtubeRefreshToken
  const isInstagramRefreshTokenExpired = isInstagramConnected && isInstagramExpired && !instagramRefreshToken
  const isTikTokRefreshTokenExpired = isTikTokConnected && isTikTokExpired && !tiktokRefreshToken

  return (
    <div className="space-y-8">
      <RefreshOnSuccess success={params?.success} />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-extrabold mb-2 text-white">Platform Connections</h1>
          <p className="text-white/70 text-sm uppercase tracking-[0.4em]">
            Connect your social media accounts to enable automated publishing.
          </p>
        </div>
        <div className="flex items-center gap-4">
          {user && (
            <div className="text-right">
              <p className="text-sm text-white/50">Signed in as</p>
              <p className="text-sm font-semibold text-white">{user.email}</p>
              {user.user_metadata?.full_name && (
                <p className="text-xs text-white/50">{user.user_metadata.full_name}</p>
              )}
            </div>
          )}
          <SignOutButton />
        </div>
      </div>

      {params?.success && (
        <Card className="bg-white/5 border-white/10">
          <CardContent className="pt-6 flex items-center gap-3">
            <CheckCircle2 className="h-6 w-6 text-[#89CFF0]" />
            <p className="text-sm text-[#89CFF0]">
              {params.success === 'youtube_connected' && 'YouTube connected successfully!'}
              {params.success === 'instagram_connected' && 'Instagram connected successfully!'}
              {params.success === 'tiktok_connected' && 'TikTok connected successfully!'}
            </p>
          </CardContent>
        </Card>
      )}

      {params?.error && (
        <Card className="bg-white/5 border-white/10">
          <CardContent className="pt-6 flex items-center gap-3">
            <XCircle className="h-6 w-6 text-red-400" />
            <p className="text-sm text-red-400">
              {params.error === 'no_tokens' && 'No tokens received. Please try again.'}
              {params.error === 'oauth_not_configured' && 'OAuth not configured. Please set up OAuth credentials in Supabase.'}
              {params.error === 'long_lived_token_failed' && 'Failed to get long-lived Instagram token. Please try again.'}
              {params.error === 'no_instagram_business_account' && 'No Instagram Business Account found. Please ensure your Instagram account is a Business/Creator account linked to a Facebook Page.'}
              {params.error || 'An error occurred. Please try again.'}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Platform Connection Cards */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* YouTube */}
        <Card className={`bg-white/5 border-white/10 ${isYouTubeConnected ? 'border-[#89CFF0]/30' : ''}`}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-500/20 rounded-lg">
                  <Youtube className="h-6 w-6 text-red-500" />
                </div>
                <div>
                  <CardTitle className="text-white">YouTube</CardTitle>
                  <CardDescription className="text-white/70">Connect your YouTube channel</CardDescription>
                </div>
              </div>
              {isYouTubeConnected && (
                <Badge 
                  variant={isYouTubeRefreshTokenExpired ? 'default' : 'success'} 
                  className={
                    isYouTubeRefreshTokenExpired 
                      ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' 
                      : isYouTubeExpired
                      ? 'bg-blue-500/20 text-blue-400 border-blue-500/30'
                      : 'bg-[#89CFF0]/20 text-[#89CFF0] border-[#89CFF0]/30'
                  }
                >
                  {isYouTubeRefreshTokenExpired ? 'Reconnect Required' : isYouTubeExpired ? 'Auto-Refresh' : 'Connected'}
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {isYouTubeConnected ? (
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-white/70">Channel:</p>
                  <p className="font-semibold text-white">{(youtubeTokens.data as any)?.handle || 'Connected'}</p>
                  {(youtubeTokens.data as any)?.channel_id && (
                    <p className="text-xs text-white/50">ID: {(youtubeTokens.data as any).channel_id}</p>
                  )}
                </div>
                <RefreshTokenStatus
                  platform="youtube"
                  isConnected={isYouTubeConnected}
                  accessTokenExpired={isYouTubeExpired}
                  hasRefreshToken={!!youtubeRefreshToken}
                />
                <a href="/api/auth/youtube">
                  <Button 
                    variant="outline" 
                    className={`w-full bg-white/10 text-white hover:bg-white/20 border-white/10 ${isYouTubeRefreshTokenExpired ? 'border-yellow-500/50 bg-yellow-500/10' : ''}`}
                  >
                    {isYouTubeRefreshTokenExpired ? 'Update Connection' : isYouTubeExpired ? 'Reconnect' : 'Update Connection'}
                  </Button>
                </a>
              </div>
            ) : (
              <a href="/api/auth/youtube">
                <Button 
                  className="w-full bg-red-500 hover:bg-red-600"
                >
                  Connect YouTube
                </Button>
              </a>
            )}
          </CardContent>
        </Card>

        {/* Instagram */}
        <Card className={`bg-white/5 border-white/10 ${isInstagramConnected ? 'border-[#89CFF0]/30' : ''}`}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-pink-500/20 rounded-lg">
                  <Instagram className="h-6 w-6 text-pink-500" />
                </div>
                <div>
                  <CardTitle className="text-white">Instagram</CardTitle>
                  <CardDescription className="text-white/70">Connect your Instagram account</CardDescription>
                </div>
              </div>
              {isInstagramConnected && (
                <Badge 
                  variant={isInstagramRefreshTokenExpired ? 'default' : 'success'} 
                  className={
                    isInstagramRefreshTokenExpired 
                      ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' 
                      : isInstagramExpired
                      ? 'bg-blue-500/20 text-blue-400 border-blue-500/30'
                      : 'bg-[#89CFF0]/20 text-[#89CFF0] border-[#89CFF0]/30'
                  }
                >
                  {isInstagramRefreshTokenExpired ? 'Reconnect Required' : isInstagramExpired ? 'Auto-Refresh' : 'Connected'}
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {isInstagramConnected ? (
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-white/70">Account:</p>
                  <p className="font-semibold text-white">@{(instagramTokens.data as any)?.username || 'Connected'}</p>
                  {(instagramTokens.data as any)?.instagram_id && (
                    <p className="text-xs text-white/50">ID: {(instagramTokens.data as any).instagram_id}</p>
                  )}
                </div>
                <RefreshTokenStatus
                  platform="instagram"
                  isConnected={isInstagramConnected}
                  accessTokenExpired={isInstagramExpired}
                  hasRefreshToken={!!instagramRefreshToken}
                />
                <a href="/api/auth/instagram">
                  <Button 
                    variant="outline" 
                    className={`w-full bg-white/10 text-white hover:bg-white/20 border-white/10 ${isInstagramRefreshTokenExpired ? 'border-yellow-500/50 bg-yellow-500/10' : ''}`}
                  >
                    {isInstagramRefreshTokenExpired ? 'Update Connection' : isInstagramExpired ? 'Reconnect' : 'Update Connection'}
                  </Button>
                </a>
              </div>
            ) : (
              <a href="/api/auth/instagram">
                <Button 
                  className="w-full bg-pink-500 hover:bg-pink-600"
                >
                  Connect Instagram
                </Button>
              </a>
            )}
          </CardContent>
        </Card>

        {/* TikTok */}
        <Card className={`bg-white/5 border-white/10 ${isTikTokConnected ? 'border-[#89CFF0]/30' : ''}`}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-black/20 rounded-lg">
                  <Music className="h-6 w-6 text-white" />
                </div>
                <div>
                  <CardTitle className="text-white">TikTok</CardTitle>
                  <CardDescription className="text-white/70">Connect your TikTok account</CardDescription>
                </div>
              </div>
              {isTikTokConnected && (
                <Badge 
                  variant={isTikTokRefreshTokenExpired ? 'default' : 'success'} 
                  className={
                    isTikTokRefreshTokenExpired 
                      ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' 
                      : isTikTokExpired
                      ? 'bg-blue-500/20 text-blue-400 border-blue-500/30'
                      : 'bg-[#89CFF0]/20 text-[#89CFF0] border-[#89CFF0]/30'
                  }
                >
                  {isTikTokRefreshTokenExpired ? 'Reconnect Required' : isTikTokExpired ? 'Auto-Refresh' : 'Connected'}
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {isTikTokConnected ? (
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-white/70">Account:</p>
                  <p className="font-semibold text-white">{(tiktokTokens.data as any)?.display_name || 'Connected'}</p>
                  {(tiktokTokens.data as any)?.tiktok_open_id && (
                    <p className="text-xs text-white/50">ID: {(tiktokTokens.data as any).tiktok_open_id}</p>
                  )}
                </div>
                <RefreshTokenStatus
                  platform="tiktok"
                  isConnected={isTikTokConnected}
                  accessTokenExpired={isTikTokExpired}
                  hasRefreshToken={!!tiktokRefreshToken}
                />
                <a href="/api/auth/tiktok">
                  <Button 
                    variant="outline" 
                    className={`w-full bg-white/10 text-white hover:bg-white/20 border-white/10 ${isTikTokRefreshTokenExpired ? 'border-yellow-500/50 bg-yellow-500/10' : ''}`}
                  >
                    {isTikTokRefreshTokenExpired ? 'Update Connection' : isTikTokExpired ? 'Reconnect' : 'Update Connection'}
                  </Button>
                </a>
              </div>
            ) : (
              <a href="/api/auth/tiktok">
                <Button 
                  className="w-full bg-black hover:bg-gray-800 text-white"
                >
                  Connect TikTok
                </Button>
              </a>
            )}
          </CardContent>
        </Card>

      </div>

      <Card className="bg-white/5 border-white/10">
        <CardHeader>
          <CardTitle className="text-white">Connection Notes</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-white/70">
            <li>• Click &quot;Connect&quot; to authorize AIR Publisher to post on your behalf</li>
            <li>• You&apos;ll be redirected to the platform to sign in and grant permissions</li>
            <li>• Your access tokens are securely stored and encrypted in Supabase</li>
            <li>• You can disconnect or reconnect at any time</li>
            <li>• Tokens may expire and need to be refreshed periodically</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
