import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CheckCircle2, XCircle, Youtube, Instagram, Music, LogOut, Cloud } from 'lucide-react'
import { getCurrentCreator } from '@/lib/db/creator'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { Database } from '@/lib/supabase/types'
import { RefreshOnSuccess } from '@/components/settings/refresh-on-success'
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
          <h1 className="text-4xl font-extrabold mb-3">Platform Connections</h1>
          <p className="text-foreground/80 text-lg font-medium">
            Connect your social media accounts to enable automated publishing.
          </p>
        </div>
        <Card className="border-yellow-500/30 bg-yellow-500/10">
          <CardContent className="pt-6">
            <p className="text-yellow-400 mb-4">
              Please complete your creator profile first to link connections to your account.
            </p>
            <Link href="/setup">
              <Button>Set Up Profile</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Check which platforms are connected
  // Try new airpublisher_*_tokens tables first (by creator_unique_identifier), fallback to old tables (by user_id)
  // Use service role client as fallback if RLS blocks queries
  let youtubeTokens = { data: null, error: null }
  let instagramTokens = { data: null, error: null }
  let tiktokTokens = { data: null, error: null }
  let dropboxTokens = { data: null, error: null }

  // Create service role client for fallback
  const serviceClient = process.env.SUPABASE_SERVICE_ROLE_KEY
    ? createServiceClient<Database>(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      )
    : null

  // Check Dropbox configuration (uses App Key/Secret from env vars, no database needed)
  // Just check if env vars are set (we can't check this server-side, so we'll show as configured if we can query)
  const dropboxConfigured = !!(process.env.DROPBOX_APP_KEY || process.env.DROPBOX_CLIENT_ID) && 
                            !!(process.env.DROPBOX_APP_SECRET || process.env.DROPBOX_CLIENT_SECRET)
  
  // Set Dropbox as "connected" if env vars are configured
  dropboxTokens = dropboxConfigured ? { data: { is_configured: true }, error: null } : { data: null, error: null }

  if (creator?.unique_identifier) {
    // Try new tables with creator_unique_identifier (for YouTube, Instagram, TikTok)
    const [youtubeNew, instagramNew, tiktokNew] = await Promise.all([
      supabase
        .from('airpublisher_youtube_tokens')
        .select('user_id, creator_unique_identifier, channel_id, handle, channel_title, expires_at')
        .eq('creator_unique_identifier', creator.unique_identifier)
        .maybeSingle(),
      supabase
        .from('airpublisher_instagram_tokens')
        .select('user_id, creator_unique_identifier, instagram_id, username, expires_at')
        .eq('creator_unique_identifier', creator.unique_identifier)
        .maybeSingle(),
      supabase
        .from('airpublisher_tiktok_tokens')
        .select('user_id, creator_unique_identifier, tiktok_open_id, display_name, expires_at')
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
      const { data: serviceData, error: serviceError } = await serviceClient
        .from('airpublisher_youtube_tokens')
        .select('user_id, creator_unique_identifier, channel_id, handle, channel_title, expires_at')
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
      const { data: serviceData } = await serviceClient
        .from('airpublisher_instagram_tokens')
        .select('user_id, creator_unique_identifier, instagram_id, username, expires_at')
        .eq('creator_unique_identifier', creator.unique_identifier)
        .maybeSingle()
      if (serviceData) instagramTokens = { data: serviceData, error: null }
    }

    if (!tiktokTokens.data && serviceClient && (tiktokNew.error || !tiktokNew.data)) {
      const { data: serviceData } = await serviceClient
        .from('airpublisher_tiktok_tokens')
        .select('user_id, creator_unique_identifier, tiktok_open_id, display_name, expires_at')
        .eq('creator_unique_identifier', creator.unique_identifier)
        .maybeSingle()
      if (serviceData) tiktokTokens = { data: serviceData, error: null }
    }
  }

  // Fallback to old tables if new tables didn't have tokens (or if no creator)
  if (!youtubeTokens.data && user) {
    const oldYoutube = await supabase
      .from('youtube_tokens')
      .select('user_id, channel_id, handle, expires_at')
      .eq('user_id', user.id)
      .maybeSingle()
    if (oldYoutube.data) {
      console.log('[ConnectionsPage] Found YouTube tokens in old table')
      youtubeTokens = oldYoutube
    } else if (serviceClient) {
      // Try service role for old table too
      const { data: serviceData } = await serviceClient
        .from('youtube_tokens')
        .select('user_id, channel_id, handle, expires_at')
        .eq('user_id', user.id)
        .maybeSingle()
      if (serviceData) youtubeTokens = { data: serviceData, error: null }
    }
  }

  if (!instagramTokens.data && user) {
    const oldInstagram = await supabase
      .from('instagram_tokens')
      .select('user_id, instagram_id, username, expires_at')
      .eq('user_id', user.id)
      .maybeSingle()
    if (oldInstagram.data) instagramTokens = oldInstagram
  }

  if (!tiktokTokens.data && user) {
    const oldTiktok = await supabase
      .from('tiktok_tokens')
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
  const isDropboxConnected = !!dropboxTokens.data

  // Check if tokens are expired
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

  return (
    <div className="space-y-8">
      <RefreshOnSuccess success={params?.success} />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-extrabold mb-3">Platform Connections</h1>
          <p className="text-foreground/80 text-lg font-medium">
            Connect your social media accounts to enable automated publishing.
          </p>
        </div>
        <div className="flex items-center gap-4">
          {user && (
            <div className="text-right">
              <p className="text-sm text-foreground/60">Signed in as</p>
              <p className="text-sm font-semibold text-foreground">{user.email}</p>
              {user.user_metadata?.full_name && (
                <p className="text-xs text-foreground/50">{user.user_metadata.full_name}</p>
              )}
            </div>
          )}
          <SignOutButton />
        </div>
      </div>

      {params?.success && (
        <Card className="border-green-500/30 bg-green-500/10">
          <CardContent className="pt-6 flex items-center gap-3">
            <CheckCircle2 className="h-6 w-6 text-green-500" />
            <p className="text-sm text-green-400">
              {params.success === 'youtube_connected' && 'YouTube connected successfully!'}
              {params.success === 'instagram_connected' && 'Instagram connected successfully!'}
              {params.success === 'tiktok_connected' && 'TikTok connected successfully!'}
              {params.success === 'dropbox_connected' && 'Dropbox connected successfully!'}
            </p>
          </CardContent>
        </Card>
      )}

      {params?.error && (
        <Card className="border-red-500/30 bg-red-500/10">
          <CardContent className="pt-6 flex items-center gap-3">
            <XCircle className="h-6 w-6 text-red-500" />
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

      {/* Debug: Auth Status (Development Only) */}
      {process.env.NODE_ENV === 'development' && (
        <Card className="border-blue-500/30 bg-blue-500/10">
          <CardHeader>
            <CardTitle className="text-sm">Debug: Authentication Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div>
              <span className="text-foreground/60">User ID: </span>
              <span className="font-mono text-xs">{user?.id || 'Not found'}</span>
            </div>
            <div>
              <span className="text-foreground/60">Email: </span>
              <span>{user?.email || 'Not found'}</span>
            </div>
            <div>
              <span className="text-foreground/60">Auth Error: </span>
              <span className={authError ? 'text-red-400' : 'text-green-400'}>
                {authError?.message || 'None'}
              </span>
            </div>
            <div>
              <span className="text-foreground/60">Creator Profile: </span>
              <span>{creator ? `Found (${creator.unique_identifier})` : 'Not found'}</span>
            </div>
            <div>
              <span className="text-foreground/60">Session Status: </span>
              <span className={user ? 'text-green-400' : 'text-yellow-400'}>
                {user ? 'Authenticated' : 'No session detected'}
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Platform Connection Cards */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* YouTube */}
        <Card className={isYouTubeConnected ? 'border-green-500/30' : ''}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-500/20 rounded-lg">
                  <Youtube className="h-6 w-6 text-red-500" />
                </div>
                <div>
                  <CardTitle>YouTube</CardTitle>
                  <CardDescription>Connect your YouTube channel</CardDescription>
                </div>
              </div>
              {isYouTubeConnected && (
                <Badge variant={isYouTubeExpired ? 'default' : 'success'}>
                  {isYouTubeExpired ? 'Expired' : 'Connected'}
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {isYouTubeConnected ? (
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-foreground/70">Channel:</p>
                  <p className="font-semibold">{(youtubeTokens.data as any)?.handle || 'Connected'}</p>
                  {(youtubeTokens.data as any)?.channel_id && (
                    <p className="text-xs text-foreground/50">ID: {(youtubeTokens.data as any).channel_id}</p>
                  )}
                </div>
                {isYouTubeExpired && (
                  <p className="text-sm text-yellow-400">Your token has expired. Please reconnect.</p>
                )}
                <Link href="/api/auth/youtube">
                  <Button variant="outline" className="w-full">
                    {isYouTubeExpired ? 'Reconnect' : 'Update Connection'}
                  </Button>
                </Link>
              </div>
            ) : (
              <Link href="/api/auth/youtube">
                <Button className="w-full bg-red-500 hover:bg-red-600">
                  Connect YouTube
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>

        {/* Instagram */}
        <Card className={isInstagramConnected ? 'border-green-500/30' : ''}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-pink-500/20 rounded-lg">
                  <Instagram className="h-6 w-6 text-pink-500" />
                </div>
                <div>
                  <CardTitle>Instagram</CardTitle>
                  <CardDescription>Connect your Instagram account</CardDescription>
                </div>
              </div>
              {isInstagramConnected && (
                <Badge variant={isInstagramExpired ? 'default' : 'success'}>
                  {isInstagramExpired ? 'Expired' : 'Connected'}
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {isInstagramConnected ? (
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-foreground/70">Account:</p>
                  <p className="font-semibold">@{(instagramTokens.data as any)?.username || 'Connected'}</p>
                  {(instagramTokens.data as any)?.instagram_id && (
                    <p className="text-xs text-foreground/50">ID: {(instagramTokens.data as any).instagram_id}</p>
                  )}
                </div>
                {isInstagramExpired && (
                  <p className="text-sm text-yellow-400">Your token has expired. Please reconnect.</p>
                )}
                <Link href="/api/auth/instagram">
                  <Button variant="outline" className="w-full">
                    {isInstagramExpired ? 'Reconnect' : 'Update Connection'}
                  </Button>
                </Link>
              </div>
            ) : (
              <Link href="/api/auth/instagram">
                <Button className="w-full bg-pink-500 hover:bg-pink-600">
                  Connect Instagram
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>

        {/* TikTok */}
        <Card className={isTikTokConnected ? 'border-green-500/30' : ''}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-black/20 rounded-lg">
                  <Music className="h-6 w-6" />
                </div>
                <div>
                  <CardTitle>TikTok</CardTitle>
                  <CardDescription>Connect your TikTok account</CardDescription>
                </div>
              </div>
              {isTikTokConnected && (
                <Badge variant={isTikTokExpired ? 'default' : 'success'}>
                  {isTikTokExpired ? 'Expired' : 'Connected'}
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {isTikTokConnected ? (
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-foreground/70">Account:</p>
                  <p className="font-semibold">{(tiktokTokens.data as any)?.display_name || 'Connected'}</p>
                  {(tiktokTokens.data as any)?.tiktok_open_id && (
                    <p className="text-xs text-foreground/50">ID: {(tiktokTokens.data as any).tiktok_open_id}</p>
                  )}
                </div>
                {isTikTokExpired && (
                  <p className="text-sm text-yellow-400">Your token has expired. Please reconnect.</p>
                )}
                <Link href="/api/auth/tiktok">
                  <Button variant="outline" className="w-full">
                    {isTikTokExpired ? 'Reconnect' : 'Update Connection'}
                  </Button>
                </Link>
              </div>
            ) : (
              <Link href="/api/auth/tiktok">
                <Button className="w-full bg-black hover:bg-gray-800">
                  Connect TikTok
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>

        {/* Dropbox - Company Account (App Key/Secret) */}
        <Card className={isDropboxConnected ? 'border-green-500/30' : ''}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/20 rounded-lg">
                  <Cloud className="h-6 w-6 text-blue-500" />
                </div>
                <div>
                  <CardTitle>Dropbox Storage</CardTitle>
                  <CardDescription>Company-wide storage (App Key/Secret)</CardDescription>
                </div>
              </div>
              {isDropboxConnected && (
                <Badge variant="success">Configured</Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {isDropboxConnected ? (
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-foreground/70">Status:</p>
                  <p className="font-semibold">Dropbox configured</p>
                  <p className="text-xs text-foreground/50">
                    All creators upload to /airpublisher/creator_{'{id}'}/ automatically
                  </p>
                  <p className="text-xs text-foreground/40 mt-2">
                    Configured via DROPBOX_APP_KEY and DROPBOX_APP_SECRET environment variables
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-foreground/70">
                  Dropbox is not configured. Add DROPBOX_APP_KEY and DROPBOX_APP_SECRET to your environment variables.
                </p>
                <p className="text-xs text-foreground/50">
                  No OAuth needed - uses App Key/Secret authentication directly.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Connection Notes</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-foreground/70">
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
