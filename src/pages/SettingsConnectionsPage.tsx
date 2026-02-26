import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CheckCircle2, XCircle, Youtube, Instagram, Music, LogOut } from 'lucide-react'
import { getCurrentCreator, type CreatorProfile } from '@/lib/db/creator'
import { supabase } from '@/lib/supabase/client'
import { RefreshOnSuccess } from '@/components/settings/refresh-on-success'
import { RefreshTokenStatus } from '@/components/settings/refresh-token-status'
import { SignOutButton } from '@/components/settings/sign-out-button'
import { useNavigate, useSearchParams } from 'react-router-dom'

export default function SettingsConnectionsPage() {
    const [creator, setCreator] = useState<CreatorProfile | null>(null)
    const [user, setUser] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const navigate = useNavigate()
    const [searchParams] = useSearchParams()

    const [youtubeTokens, setYoutubeTokens] = useState<any>(null)
    const [instagramTokens, setInstagramTokens] = useState<any>(null)
    const [tiktokTokens, setTiktokTokens] = useState<any>(null)

    useEffect(() => {
        async function fetchData() {
            try {
                const { data: authData } = await supabase.auth.getUser()
                setUser(authData.user)

                const creatorData = await getCurrentCreator()
                setCreator(creatorData)

                if (creatorData?.unique_identifier) {
                    const [ytRes, igRes, ttRes] = await Promise.all([
                        supabase
                            .from('youtube_tokens')
                            .select('*')
                            .eq('creator_unique_identifier', creatorData.unique_identifier)
                            .maybeSingle(),
                        supabase
                            .from('instagram_tokens')
                            .select('*')
                            .eq('creator_unique_identifier', creatorData.unique_identifier)
                            .maybeSingle(),
                        supabase
                            .from('tiktok_tokens')
                            .select('*')
                            .eq('creator_unique_identifier', creatorData.unique_identifier)
                            .maybeSingle(),
                    ])

                    if (ytRes.data) setYoutubeTokens(ytRes.data)
                    if (igRes.data) setInstagramTokens(igRes.data)
                    if (ttRes.data) setTiktokTokens(ttRes.data)
                }
            } catch (error) {
                console.error('Error fetching data:', error)
            } finally {
                setLoading(false)
            }
        }

        fetchData()
    }, [])

    if (loading) {
        return <div className="p-8 text-white">Loading connections...</div>
    }

    if (!creator) {
        return (
            <div className="space-y-8">
                <div>
                    <h1 className="text-3xl font-bold mb-2 text-white">Platform Connections</h1>
                    <p className="text-white/70 text-sm uppercase tracking-[0.4em]">
                        Connect your social media accounts to enable automated publishing.
                    </p>
                </div>
                <Card className="bg-white/5 border-white/10">
                    <CardContent className="pt-6">
                        <p className="text-[#89CFF0] mb-4">
                            Please complete your creator profile first to link connections to your account.
                        </p>
                        <Button onClick={() => navigate('/setup')} className="bg-[#89CFF0] text-black hover:bg-[#89CFF0]/90">
                            Set Up Profile
                        </Button>
                    </CardContent>
                </Card>
            </div>
        )
    }

    const isYouTubeConnected = !!youtubeTokens
    const isInstagramConnected = !!instagramTokens
    const isTikTokConnected = !!tiktokTokens

    const isYouTubeExpired = isYouTubeConnected && youtubeTokens?.expires_at
        ? new Date(youtubeTokens.expires_at) < new Date()
        : false
    const isInstagramExpired = isInstagramConnected && instagramTokens?.expires_at
        ? new Date(instagramTokens.expires_at) < new Date()
        : false
    const isTikTokExpired = isTikTokConnected && tiktokTokens?.expires_at
        ? new Date(tiktokTokens.expires_at) < new Date()
        : false

    const youtubeRefreshToken = youtubeTokens?.google_refresh_token
    const instagramRefreshToken = instagramTokens?.facebook_refresh_token
    const tiktokRefreshToken = tiktokTokens?.tiktok_refresh_token

    const isYouTubeRefreshTokenExpired = isYouTubeConnected && isYouTubeExpired && !youtubeRefreshToken
    const isInstagramRefreshTokenExpired = isInstagramConnected && isInstagramExpired && !instagramRefreshToken
    const isTikTokRefreshTokenExpired = isTikTokConnected && isTikTokExpired && !tiktokRefreshToken

    const errorParam = searchParams.get('error')
    const successParam = searchParams.get('success')

    const getAuthUrl = (platform: string) => {
        return `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/oauth-${platform}`
    }

    return (
        <div className="space-y-8">
            <RefreshOnSuccess />
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold mb-2 text-white">Platform Connections</h1>
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

            {successParam && (
                <Card className="bg-white/5 border-white/10">
                    <CardContent className="pt-6 flex items-center gap-3">
                        <CheckCircle2 className="h-6 w-6 text-[#89CFF0]" />
                        <p className="text-sm text-[#89CFF0]">
                            {successParam === 'youtube_connected' && 'YouTube connected successfully!'}
                            {successParam === 'instagram_connected' && 'Instagram connected successfully!'}
                            {successParam === 'tiktok_connected' && 'TikTok connected successfully!'}
                        </p>
                    </CardContent>
                </Card>
            )}

            {errorParam && (
                <Card className="bg-white/5 border-white/10">
                    <CardContent className="pt-6 flex items-center gap-3">
                        <XCircle className="h-6 w-6 text-red-400" />
                        <p className="text-sm text-red-400">
                            {errorParam === 'no_tokens' && 'No tokens received. Please try again.'}
                            {errorParam === 'oauth_not_configured' && 'OAuth not configured. Please set up OAuth credentials in Supabase.'}
                            {errorParam === 'long_lived_token_failed' && 'Failed to get long-lived Instagram token. Please try again.'}
                            {errorParam === 'no_instagram_business_account' && 'No Instagram Business Account found. Please ensure your Instagram account is a Business/Creator account linked to a Facebook Page.'}
                            {errorParam || 'An error occurred. Please try again.'}
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
                                    <p className="font-semibold text-white">{youtubeTokens?.handle || 'Connected'}</p>
                                    {youtubeTokens?.channel_id && (
                                        <p className="text-xs text-white/50">ID: {youtubeTokens.channel_id}</p>
                                    )}
                                </div>
                                <RefreshTokenStatus
                                    platform="youtube"
                                    isConnected={isYouTubeConnected}
                                    accessTokenExpired={isYouTubeExpired}
                                    hasRefreshToken={!!youtubeRefreshToken}
                                />
                                <a href={getAuthUrl('youtube')}>
                                    <Button
                                        variant="outline"
                                        className={`w-full bg-white/10 text-white hover:bg-white/20 border-white/10 ${isYouTubeRefreshTokenExpired ? 'border-yellow-500/50 bg-yellow-500/10' : ''}`}
                                    >
                                        {isYouTubeRefreshTokenExpired ? 'Update Connection' : isYouTubeExpired ? 'Reconnect' : 'Update Connection'}
                                    </Button>
                                </a>
                            </div>
                        ) : (
                            <a href={getAuthUrl('youtube')}>
                                <Button className="w-full bg-red-500 hover:bg-red-600">Connect YouTube</Button>
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
                                    <p className="font-semibold text-white">@{instagramTokens?.username || 'Connected'}</p>
                                    {instagramTokens?.instagram_id && (
                                        <p className="text-xs text-white/50">ID: {instagramTokens.instagram_id}</p>
                                    )}
                                </div>
                                <RefreshTokenStatus
                                    platform="instagram"
                                    isConnected={isInstagramConnected}
                                    accessTokenExpired={isInstagramExpired}
                                    hasRefreshToken={!!instagramRefreshToken}
                                />
                                <a href={getAuthUrl('instagram')}>
                                    <Button
                                        variant="outline"
                                        className={`w-full bg-white/10 text-white hover:bg-white/20 border-white/10 ${isInstagramRefreshTokenExpired ? 'border-yellow-500/50 bg-yellow-500/10' : ''}`}
                                    >
                                        {isInstagramRefreshTokenExpired ? 'Update Connection' : isInstagramExpired ? 'Reconnect' : 'Update Connection'}
                                    </Button>
                                </a>
                            </div>
                        ) : (
                            <a href={getAuthUrl('instagram')}>
                                <Button className="w-full bg-pink-500 hover:bg-pink-600">Connect Instagram</Button>
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
                                    <p className="font-semibold text-white">{tiktokTokens?.display_name || 'Connected'}</p>
                                    {tiktokTokens?.tiktok_open_id && (
                                        <p className="text-xs text-white/50">ID: {tiktokTokens.tiktok_open_id}</p>
                                    )}
                                </div>
                                <RefreshTokenStatus
                                    platform="tiktok"
                                    isConnected={isTikTokConnected}
                                    accessTokenExpired={isTikTokExpired}
                                    hasRefreshToken={!!tiktokRefreshToken}
                                />
                                <a href={getAuthUrl('tiktok')}>
                                    <Button
                                        variant="outline"
                                        className={`w-full bg-white/10 text-white hover:bg-white/20 border-white/10 ${isTikTokRefreshTokenExpired ? 'border-yellow-500/50 bg-yellow-500/10' : ''}`}
                                    >
                                        {isTikTokRefreshTokenExpired ? 'Update Connection' : isTikTokExpired ? 'Reconnect' : 'Update Connection'}
                                    </Button>
                                </a>
                            </div>
                        ) : (
                            <a href={getAuthUrl('tiktok')}>
                                <Button className="w-full bg-black hover:bg-gray-800 text-white">Connect TikTok</Button>
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
                        <li>• Click "Connect" to authorize AIR Publisher to post on your behalf</li>
                        <li>• You'll be redirected to the platform to sign in and grant permissions</li>
                        <li>• Your access tokens are securely stored and encrypted in Supabase</li>
                        <li>• You can disconnect or reconnect at any time</li>
                        <li>• Tokens may expire and need to be refreshed periodically</li>
                    </ul>
                </CardContent>
            </Card>
        </div>
    )
}
