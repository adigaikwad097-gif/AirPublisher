import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CheckCircle2, XCircle, Youtube, Instagram, Music } from 'lucide-react'
import { getCurrentCreator } from '@/lib/db/creator'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { redirect } from 'next/navigation'

export default async function ConnectionsPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string; error?: string }> | { success?: string; error?: string }
}) {
  const params = searchParams instanceof Promise ? await searchParams : searchParams
  
  const creator = await getCurrentCreator()
  if (!creator) {
    redirect('/setup')
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Check which platforms are connected
  // Try by user_id first, fallback to creator_unique_identifier if needed
  const [youtubeTokens, instagramTokens, tiktokTokens] = await Promise.all([
    supabase
      .from('youtube_tokens')
      .select('user_id, channel_id, handle, expires_at')
      .eq('user_id', user.id)
      .maybeSingle()
      .catch(() => {
        // Fallback: try by creator_unique_identifier if user_id doesn't work
        return supabase
          .from('youtube_tokens')
          .select('user_id, channel_id, handle, expires_at')
          .maybeSingle()
      }),
    supabase
      .from('instagram_tokens')
      .select('user_id, instagram_id, username, expires_at')
      .eq('user_id', user.id)
      .maybeSingle()
      .catch(() => {
        return supabase
          .from('instagram_tokens')
          .select('user_id, instagram_id, username, expires_at')
          .maybeSingle()
      }),
    supabase
      .from('tiktok_tokens')
      .select('user_id, tiktok_open_id, display_name, expires_at')
      .eq('user_id', user.id)
      .maybeSingle()
      .catch(() => {
        return supabase
          .from('tiktok_tokens')
          .select('user_id, tiktok_open_id, display_name, expires_at')
          .maybeSingle()
      }),
  ])

  const isYouTubeConnected = !!youtubeTokens.data
  const isInstagramConnected = !!instagramTokens.data
  const isTikTokConnected = !!tiktokTokens.data

  // Check if tokens are expired
  const isYouTubeExpired = isYouTubeConnected && youtubeTokens.data?.expires_at
    ? new Date(youtubeTokens.data.expires_at) < new Date()
    : false
  const isInstagramExpired = isInstagramConnected && instagramTokens.data?.expires_at
    ? new Date(instagramTokens.data.expires_at) < new Date()
    : false
  const isTikTokExpired = isTikTokConnected && tiktokTokens.data?.expires_at
    ? new Date(tiktokTokens.data.expires_at) < new Date()
    : false

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-extrabold mb-3">Platform Connections</h1>
        <p className="text-foreground/80 text-lg font-medium">
          Connect your social media accounts to enable automated posting
        </p>
      </div>

      {/* Success/Error Messages */}
      {params?.success && (
        <Card className="border-green-500/50 bg-green-500/10">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 text-green-400">
              <CheckCircle2 className="h-5 w-5" />
              <p>
                {params.success === 'youtube_connected' && 'YouTube connected successfully!'}
                {params.success === 'instagram_connected' && 'Instagram connected successfully!'}
                {params.success === 'tiktok_connected' && 'TikTok connected successfully!'}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {params?.error && (
        <Card className="border-red-500/50 bg-red-500/10">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 text-red-400">
              <XCircle className="h-5 w-5" />
              <p>
                {params.error === 'oauth_not_configured' && 'OAuth not configured. Please set up OAuth credentials.'}
                {params.error === 'token_exchange_failed' && 'Failed to exchange authorization code. Please try again.'}
                {params.error === 'update_failed' && 'Failed to save tokens. Please try again.'}
                {params.error || 'An error occurred. Please try again.'}
              </p>
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
                  <p className="font-semibold">{youtubeTokens.data?.handle || 'Connected'}</p>
                  {youtubeTokens.data?.channel_id && (
                    <p className="text-xs text-foreground/50">ID: {youtubeTokens.data.channel_id}</p>
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
                  <p className="font-semibold">@{instagramTokens.data?.username || 'Connected'}</p>
                  {instagramTokens.data?.instagram_id && (
                    <p className="text-xs text-foreground/50">ID: {instagramTokens.data.instagram_id}</p>
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
                  <p className="font-semibold">{tiktokTokens.data?.display_name || 'Connected'}</p>
                  {tiktokTokens.data?.tiktok_open_id && (
                    <p className="text-xs text-foreground/50">ID: {tiktokTokens.data.tiktok_open_id}</p>
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
                <Button className="w-full bg-black hover:bg-gray-900">
                  Connect TikTok
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Info Card */}
      <Card>
        <CardHeader>
          <CardTitle>How It Works</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-foreground/70">
            <li>• Click "Connect" to authorize AIR Publisher to post on your behalf</li>
            <li>• You'll be redirected to the platform to sign in and grant permissions</li>
            <li>• Your access tokens are securely stored and encrypted</li>
            <li>• You can disconnect or reconnect at any time</li>
            <li>• Tokens may expire and need to be refreshed periodically</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}

