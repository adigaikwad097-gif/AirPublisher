import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CheckCircle2, XCircle, Youtube, Instagram, Facebook } from 'lucide-react'
import { getCurrentCreator, type CreatorProfile } from '@/lib/db/creator'
import { supabase } from '@/lib/supabase/client'
import { useNavigate, useSearchParams } from 'react-router-dom'

export default function SettingsConnectionsPage() {
    const [creator, setCreator] = useState<CreatorProfile | null>(null)
    const [user, setUser] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [disconnecting, setDisconnecting] = useState<string | null>(null)
    const navigate = useNavigate()
    const [searchParams] = useSearchParams()

    const [youtubeTokens, setYoutubeTokens] = useState<any>(null)
    const [instagramTokens, setInstagramTokens] = useState<any>(null)
    const [facebookTokens, setFacebookTokens] = useState<any>(null)
    const [resolvedCreatorIds, setResolvedCreatorIds] = useState<string[]>([])
    const [resolvedUserIds, setResolvedUserIds] = useState<string[]>([])
    const [serviceClient, setServiceClient] = useState<any>(null)

    // ─── Edge function URLs ────────────────────────────────────────────────────
    const getConnectUrl = (platform: 'youtube' | 'instagram' | 'facebook') => {
        const base = import.meta.env.VITE_SUPABASE_URL
        const returnUrl = encodeURIComponent(`${window.location.origin}/settings/connections`)
        const creatorId = encodeURIComponent(creator?.unique_identifier || '')
        const userId = encodeURIComponent(user?.id || '')
        if (platform === 'youtube')
            return `${base}/functions/v1/airpublisher_youtubeauth?action=init&origin=${returnUrl}&creator_id=${creatorId}&user_id=${userId}`
        if (platform === 'instagram')
            return `${base}/functions/v1/airpublisher_instagram-fb-auth?action=init&origin=${returnUrl}&creator_id=${creatorId}&user_id=${userId}`
        if (platform === 'facebook')
            return `${base}/functions/v1/airpublisher_facebookauth?action=init&origin=${returnUrl}&creator_id=${creatorId}&user_id=${userId}`
    }

    // ─── Data fetching ─────────────────────────────────────────────────────────
    const fetchData = useCallback(async () => {
        try {
            const { data: authData } = await supabase.auth.getUser()
            const authUser = authData.user
            setUser(authUser)

            const creatorData = await getCurrentCreator()
            setCreator(creatorData)

            if (creatorData?.unique_identifier) {
                const creatorId = creatorData.unique_identifier
                const normalizedHandle = creatorData.display_name?.replace('@', '').toLowerCase()

                // Cross-identity lookup: same user may have igb_xxx + igg_xxx identities with same handle
                let allCreatorIds = [creatorId]
                if (normalizedHandle) {
                    const { data: allProfiles } = await supabase
                        .from('creator_profiles')
                        .select('unique_identifier, handles')
                        .neq('unique_identifier', creatorId)
                    if (allProfiles) {
                        const relatedIds = allProfiles
                            .filter(p => p.handles?.replace('@', '').toLowerCase() === normalizedHandle)
                            .map(p => p.unique_identifier)
                        allCreatorIds = [creatorId, ...relatedIds]
                    }
                }

                // RLS blocks ANON key reads on airpublisher_connections, so use service role client
                let connectionsClient: any = supabase
                const serviceKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY
                if (serviceKey) {
                    const { createClient: createServiceClient } = await import('@supabase/supabase-js')
                    connectionsClient = createServiceClient(
                        import.meta.env.VITE_SUPABASE_URL,
                        serviceKey,
                        {
                            auth: {
                                autoRefreshToken: false,
                                persistSession: false,
                                detectSessionInUrl: false
                            }
                        }
                    )
                }

                // Store for disconnect handlers
                setServiceClient(connectionsClient)

                // Collect user_ids from creator_profiles for fallback token lookups
                const { data: profilesWithUids } = await connectionsClient
                    .from('creator_profiles')
                    .select('unique_identifier, user_id')
                    .in('unique_identifier', allCreatorIds)
                const allUserIds: string[] = Array.from(new Set(
                    (profilesWithUids || []).map((p: any) => p.user_id).filter(Boolean)
                ))

                // Store for disconnect handlers
                setResolvedCreatorIds(allCreatorIds)
                setResolvedUserIds(allUserIds)

                // 1. Try airpublisher_connections first (primary method)
                const { data: connections } = await connectionsClient
                    .from('airpublisher_connections')
                    .select('connection_identifier, platform, primary_identifier, user_id')
                    .in('primary_identifier', allCreatorIds)

                let foundYt = false, foundIg = false, foundFb = false

                if (connections && connections.length > 0) {
                    const ytConn = connections.find((c: any) => c.connection_identifier?.startsWith('yt_'))
                    const igConn = connections.find((c: any) =>
                        c.connection_identifier?.startsWith('igg_') || c.connection_identifier?.startsWith('igb_')
                    )
                    const fbConn = connections.find((c: any) => c.connection_identifier?.startsWith('fb_'))

                    const [ytRes, igRes, fbRes] = await Promise.all([
                        ytConn
                            ? connectionsClient.from('youtube_tokens').select('*').eq('creator_unique_identifier', ytConn.connection_identifier).maybeSingle()
                            : Promise.resolve({ data: null }),
                        igConn
                            ? connectionsClient.from('instagram_tokens').select('*').eq('creator_unique_identifier', igConn.connection_identifier).maybeSingle()
                            : Promise.resolve({ data: null }),
                        fbConn
                            ? connectionsClient.from('facebook_tokens').select('*').eq('creator_unique_identifier', fbConn.connection_identifier).maybeSingle()
                            : Promise.resolve({ data: null }),
                    ])

                    if (ytRes.data) { setYoutubeTokens(ytRes.data); foundYt = true }
                    if (igRes.data) { setInstagramTokens(igRes.data); foundIg = true }
                    if (fbRes.data) { setFacebookTokens(fbRes.data); foundFb = true }
                }

                // 2. Fallback: check token tables directly when connections are missing
                // Use .limit(1) instead of .maybeSingle() to avoid errors with multiple matches
                if (allUserIds.length > 0) {
                    const fallbacks = await Promise.all([
                        !foundYt
                            ? connectionsClient.from('youtube_tokens').select('*').in('user_id', allUserIds).limit(1)
                            : Promise.resolve({ data: [] }),
                        !foundIg
                            ? connectionsClient.from('instagram_tokens').select('*').in('creator_unique_identifier', allCreatorIds).limit(1)
                            : Promise.resolve({ data: [] }),
                        !foundFb
                            ? connectionsClient.from('facebook_tokens').select('*').in('user_id', allUserIds).like('creator_unique_identifier', 'fb_%').limit(1)
                            : Promise.resolve({ data: [] }),
                    ])

                    const ytFallback = fallbacks[0].data?.[0] || null
                    const igFallback = fallbacks[1].data?.[0] || null
                    const fbFallback = fallbacks[2].data?.[0] || null

                    if (ytFallback) setYoutubeTokens(ytFallback)
                    if (igFallback) setInstagramTokens(igFallback)
                    if (fbFallback) setFacebookTokens(fbFallback)

                    // 3. Self-healing: auto-create missing connection rows so next load is faster
                    const writebacks: Promise<any>[] = []
                    if (ytFallback && !foundYt && ytFallback.user_id) {
                        writebacks.push(connectionsClient.from('airpublisher_connections').upsert({
                            user_id: ytFallback.user_id,
                            primary_identifier: ytFallback.creator_unique_identifier || creatorId,
                            platform: 'youtube',
                            connection_identifier: ytFallback.creator_unique_identifier || creatorId,
                            platform_name: ytFallback.handle || null,
                            updated_at: new Date().toISOString()
                        }, { onConflict: 'user_id,platform,connection_identifier' }))
                    }
                    if (igFallback && !foundIg && igFallback.user_id) {
                        writebacks.push(connectionsClient.from('airpublisher_connections').upsert({
                            user_id: igFallback.user_id,
                            primary_identifier: igFallback.creator_unique_identifier || creatorId,
                            platform: 'instagram',
                            connection_identifier: igFallback.creator_unique_identifier || creatorId,
                            platform_name: igFallback.username || null,
                            updated_at: new Date().toISOString()
                        }, { onConflict: 'user_id,platform,connection_identifier' }))
                    }
                    if (fbFallback && !foundFb && fbFallback.user_id) {
                        writebacks.push(connectionsClient.from('airpublisher_connections').upsert({
                            user_id: fbFallback.user_id,
                            primary_identifier: fbFallback.creator_unique_identifier || creatorId,
                            platform: 'facebook',
                            connection_identifier: fbFallback.creator_unique_identifier || creatorId,
                            platform_name: fbFallback.page_name || null,
                            updated_at: new Date().toISOString()
                        }, { onConflict: 'user_id,platform,connection_identifier' }))
                    }
                    if (writebacks.length > 0) {
                        await Promise.all(writebacks).catch(err =>
                            console.warn('Self-healing write-back failed (non-blocking):', err)
                        )
                    }
                }
            }
        } catch (error) {
            console.error('Error fetching data:', error)
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => { fetchData() }, [fetchData])

    // ─── Disconnect handlers ───────────────────────────────────────────────────
    const handleDisconnect = async (platform: 'youtube' | 'instagram' | 'facebook') => {
        setDisconnecting(platform)
        try {
            const { data: sessionData } = await supabase.auth.getSession()
            const accessToken = sessionData.session?.access_token
            const base = import.meta.env.VITE_SUPABASE_URL
            const client = serviceClient || supabase

            const fnName =
                platform === 'youtube' ? 'airpublisher_youtubeauth' :
                platform === 'instagram' ? 'airpublisher_instagram-fb-auth' :
                'airpublisher_facebookauth'

            const res = await fetch(
                `${base}/functions/v1/${fnName}?action=disconnect`,
                {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${accessToken}`,
                        'Content-Type': 'application/json',
                    },
                }
            )

            if (res.ok) {
                if (platform === 'youtube') setYoutubeTokens(null)
                if (platform === 'instagram') setInstagramTokens(null)
                if (platform === 'facebook') setFacebookTokens(null)
            }

            // Also clean up any remaining airpublisher_connections rows via service client
            // (covers cross-identity cases where the edge fn only deleted by auth user.id)
            if (client && resolvedUserIds.length > 0) {
                await client
                    .from('airpublisher_connections')
                    .delete()
                    .eq('platform', platform)
                    .in('user_id', resolvedUserIds)
                    .catch((err: any) => console.warn('Failed to clean connection row:', err))
            }
        } catch (err) {
            console.error(`Error disconnecting ${platform}:`, err)
        } finally {
            setDisconnecting(null)
        }
    }

    // ─── Loading / no creator ──────────────────────────────────────────────────
    if (loading) {
        return <div className="p-8 text-white">Loading connections...</div>
    }

    if (!creator) {
        return (
            <div className="space-y-8">
                <div>
                    <h1 className="text-4xl font-bold text-white tracking-tight">Platform Connections</h1>
                    <p className="text-lg text-white/50 mt-3">
                        Connect your social media accounts to enable automated publishing.
                    </p>
                </div>
                <Card className="bg-card border-border/20">
                    <CardContent className="pt-6">
                        <p className="text-primary mb-4">
                            Please complete your creator profile first to link connections to your account.
                        </p>
                        <Button onClick={() => navigate('/setup')}>
                            Set Up Profile
                        </Button>
                    </CardContent>
                </Card>
            </div>
        )
    }

    // ─── Token states ──────────────────────────────────────────────────────────
    const isYouTubeConnected = !!youtubeTokens
    const isInstagramConnected = !!instagramTokens
    const isFacebookConnected = !!facebookTokens

    const errorParam = searchParams.get('error')
    const successParam = searchParams.get('success')

    // ─── Render ────────────────────────────────────────────────────────────────
    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-4xl font-bold text-white tracking-tight">Connections</h1>
                    <p className="text-lg text-white/50 mt-3">
                        Connect your accounts to enable automated publishing and distribution.
                    </p>
                </div>
                {user && (
                    <div className="text-right">
                        <p className="text-lg text-white/60">Signed in as</p>
                        <p className="text-lg font-semibold text-white">{user.email}</p>
                    </div>
                )}
            </div>

            {/* Success banner */}
            {successParam && (
                <Card className="bg-card border-border/20">
                    <CardContent className="pt-6 flex items-center gap-3">
                        <CheckCircle2 className="h-6 w-6 text-primary" />
                        <p className="text-lg text-primary">
                            {successParam === 'youtube_connected' && 'YouTube connected successfully!'}
                            {successParam === 'instagram_connected' && 'Instagram connected successfully!'}
                            {successParam === 'facebook_connected' && 'Facebook connected successfully!'}
                        </p>
                    </CardContent>
                </Card>
            )}

            {/* Error banner */}
            {errorParam && (
                <Card className="bg-card border-border/20">
                    <CardContent className="pt-6 flex items-center gap-3">
                        <XCircle className="h-6 w-6 text-red-400" />
                        <p className="text-lg text-red-400">
                            {errorParam === 'no_tokens' && 'No tokens received. Please try again.'}
                            {errorParam === 'oauth_not_configured' && 'OAuth not configured. Please contact support.'}
                            {errorParam === 'long_lived_token_failed' && 'Failed to get long-lived Instagram token. Please try again.'}
                            {errorParam === 'no_instagram_business_account' && 'No Instagram Business Account found. Ensure your Instagram is a Business/Creator account linked to a Facebook Page.'}
                            {!['no_tokens','oauth_not_configured','long_lived_token_failed','no_instagram_business_account'].includes(errorParam) && `Error: ${errorParam}. Please try again.`}
                        </p>
                    </CardContent>
                </Card>
            )}

            {/* Platform Cards */}
            <div className="grid gap-6 md:grid-cols-3">

                {/* ── YouTube ── */}
                <Card className={`bg-card border-border/20 ${isYouTubeConnected ? 'border-primary/30' : ''}`}>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-red-500/20 rounded-lg">
                                    <Youtube className="h-6 w-6 text-red-500" />
                                </div>
                                <div>
                                    <CardTitle className="text-white">YouTube</CardTitle>
                                    <CardDescription className="text-white/60">Publish and schedule videos automatically.</CardDescription>
                                </div>
                            </div>
                            {isYouTubeConnected && (
                                <Badge className="bg-primary/20 text-primary border-primary/30">
                                    Connected
                                </Badge>
                            )}
                        </div>
                    </CardHeader>
                    <CardContent>
                        {isYouTubeConnected ? (
                            <div className="space-y-3">
                                <div>
                                    <p className="text-lg text-white/60">Channel:</p>
                                    <p className="font-semibold text-white">{youtubeTokens?.handle || 'Connected'}</p>
                                    {youtubeTokens?.channel_id && (
                                        <p className="text-base text-white/60">ID: {youtubeTokens.channel_id}</p>
                                    )}
                                </div>
                                <Button
                                    variant="outline"
                                    className="w-full bg-red-500/10 text-red-400 hover:bg-red-500/20 border-red-500/30"
                                    onClick={() => handleDisconnect('youtube')}
                                    disabled={disconnecting === 'youtube'}
                                >
                                    {disconnecting === 'youtube' ? 'Disconnecting...' : 'Disconnect'}
                                </Button>
                            </div>
                        ) : (
                            <a href={getConnectUrl('youtube')}>
                                <Button className="w-full bg-primary text-background hover:bg-primary-dark">Connect</Button>
                            </a>
                        )}
                    </CardContent>
                </Card>

                {/* ── Instagram ── */}
                <Card className={`bg-card border-border/20 ${isInstagramConnected ? 'border-primary/30' : ''}`}>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-pink-500/20 rounded-lg">
                                    <Instagram className="h-6 w-6 text-pink-500" />
                                </div>
                                <div>
                                    <CardTitle className="text-white">Instagram</CardTitle>
                                    <CardDescription className="text-white/60">Connect your Instagram Business account via Facebook Page.</CardDescription>
                                </div>
                            </div>
                            {isInstagramConnected && (
                                <Badge className="bg-primary/20 text-primary border-primary/30">
                                    Connected
                                </Badge>
                            )}
                        </div>
                    </CardHeader>
                    <CardContent>
                        {isInstagramConnected ? (
                            <div className="space-y-3">
                                <div>
                                    <p className="text-lg text-white/60">Account:</p>
                                    <p className="font-semibold text-white">@{instagramTokens?.username || 'Connected'}</p>
                                    {instagramTokens?.instagram_id && (
                                        <p className="text-base text-white/60">ID: {instagramTokens.instagram_id}</p>
                                    )}
                                </div>
                                <Button
                                    variant="outline"
                                    className="w-full bg-red-500/10 text-red-400 hover:bg-red-500/20 border-red-500/30"
                                    onClick={() => handleDisconnect('instagram')}
                                    disabled={disconnecting === 'instagram'}
                                >
                                    {disconnecting === 'instagram' ? 'Disconnecting...' : 'Disconnect'}
                                </Button>
                            </div>
                        ) : (
                            <a href={getConnectUrl('instagram')}>
                                <Button className="w-full bg-primary text-background hover:bg-primary-dark">Connect</Button>
                            </a>
                        )}
                    </CardContent>
                </Card>

                {/* ── Facebook ── */}
                <Card className={`bg-card border-border/20 ${isFacebookConnected ? 'border-primary/30' : ''}`}>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-blue-600/20 rounded-lg">
                                    <Facebook className="h-6 w-6 text-blue-500" />
                                </div>
                                <div>
                                    <CardTitle className="text-white">Facebook</CardTitle>
                                    <CardDescription className="text-white/60">Publish videos directly to your Facebook Pages.</CardDescription>
                                </div>
                            </div>
                            {isFacebookConnected && (
                                <Badge className="bg-primary/20 text-primary border-primary/30">
                                    Connected
                                </Badge>
                            )}
                        </div>
                    </CardHeader>
                    <CardContent>
                        {isFacebookConnected ? (
                            <div className="space-y-3">
                                <div>
                                    <p className="text-lg text-white/60">Page:</p>
                                    <p className="font-semibold text-white">{facebookTokens?.page_name || 'Connected'}</p>
                                    {facebookTokens?.page_id && (
                                        <p className="text-base text-white/60">Page ID: {facebookTokens.page_id}</p>
                                    )}
                                </div>
                                <Button
                                    variant="outline"
                                    className="w-full bg-red-500/10 text-red-400 hover:bg-red-500/20 border-red-500/30"
                                    onClick={() => handleDisconnect('facebook')}
                                    disabled={disconnecting === 'facebook'}
                                >
                                    {disconnecting === 'facebook' ? 'Disconnecting...' : 'Disconnect'}
                                </Button>
                            </div>
                        ) : (
                            <a href={getConnectUrl('facebook')}>
                                <Button className="w-full bg-primary text-background hover:bg-primary-dark">Connect</Button>
                            </a>
                        )}
                    </CardContent>
                </Card>

            </div>

            <Card className="bg-card border-border/20">
                <CardHeader>
                    <CardTitle className="text-white">Connection Notes</CardTitle>
                </CardHeader>
                <CardContent>
                    <ul className="space-y-2 text-lg text-white/60">
                        <li>• Click "Connect" to authorize AIR Publisher to post on your behalf</li>
                        <li>• You'll be redirected to the platform to sign in and grant permissions</li>
                        <li>• Your access tokens are securely stored and encrypted in Supabase</li>
                        <li>• You can disconnect or reconnect at any time</li>
                        <li>• Instagram requires a Business or Creator account linked to a Facebook Page</li>
                    </ul>
                </CardContent>
            </Card>
        </div>
    )
}
