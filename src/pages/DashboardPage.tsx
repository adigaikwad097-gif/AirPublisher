import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
    Upload,
    Eye,
    Heart,
    MessageCircle,
    Video,
    Clock,
    CheckCircle2,
    Youtube,
    Instagram,
    Facebook,
    ArrowRight,
    Calendar,
    Link2,
} from 'lucide-react'
import { getCurrentCreator } from '@/lib/db/creator'
import { getVideosByCreator } from '@/lib/db/videos'
import { getPlatformStatuses, type PlatformStatus } from '@/lib/db/platform-status'
import { getCreatorId } from '@/lib/auth/session'

export default function DashboardPage() {
    const [isLoading, setIsLoading] = useState(true)
    const [creator, setCreator] = useState<any>(null)
    const [videos, setVideos] = useState<any[]>([])
    const [platformStatuses, setPlatformStatuses] = useState<PlatformStatus[]>([])

    useEffect(() => {
        async function fetchData() {
            setIsLoading(true)
            try {
                const profileId = getCreatorId()

                if (!profileId) {
                    setIsLoading(false)
                    return
                }

                const currentCreator = await getCurrentCreator(profileId)
                setCreator(currentCreator)

                if (currentCreator) {
                    const [fetchedVideos, fetchedStatuses] = await Promise.all([
                        getVideosByCreator(currentCreator.unique_identifier),
                        getPlatformStatuses(currentCreator.unique_identifier),
                    ])

                    setVideos(fetchedVideos)
                    setPlatformStatuses(fetchedStatuses)
                }
            } catch (err) {
                console.error('Error fetching dashboard data:', err)
            } finally {
                setIsLoading(false)
            }
        }

        fetchData()
    }, [])

    if (isLoading) {
        return <div className="animate-pulse space-y-8">
            <div className="h-10 w-64 bg-white/10 rounded"></div>
            <div className="h-40 bg-white/5 rounded-xl"></div>
        </div>
    }

    if (!creator) {
        return (
            <div className="space-y-8">
                <div>
                    <h1 className="text-3xl font-bold mb-2 text-white tracking-tight">Dashboard</h1>
                    <p className="text-white/60 text-lg">
                        Welcome! Please complete your creator profile to get started.
                    </p>
                </div>
                <div className="p-6 rounded-xl bg-white/5 border border-white/10">
                    <div className="text-center py-8">
                        <p className="text-2xl font-semibold mb-4 text-white/90">
                            Complete your creator profile to start publishing.
                        </p>
                        <Link to="/setup">
                            <Button size="lg" className="bg-primary text-background hover:bg-primary-dark">
                                Set Up Profile
                            </Button>
                        </Link>
                    </div>
                </div>
            </div>
        )
    }

    // Calculate real KPIs
    const postedVideos = videos.filter((v) => v.status === 'posted')
    const totalViews = postedVideos.reduce((sum, v) => sum + (v.views || 0), 0)
    const totalLikes = postedVideos.reduce((sum, v) => sum + (v.likes || 0), 0)
    const totalComments = postedVideos.reduce((sum, v) => sum + (v.comments || 0), 0)
    const scheduledCount = videos.filter((v) => v.status === 'scheduled').length
    const postedCount = postedVideos.length
    const totalVideos = postedCount + scheduledCount

    // Platform distribution for posted videos
    const platformCounts: Record<string, number> = {}
    postedVideos.forEach((v) => {
        const platform = v.platform_target || 'unknown'
        platformCounts[platform] = (platformCounts[platform] || 0) + 1
    })
    const maxPlatformCount = Math.max(...Object.values(platformCounts), 1)

    const platformConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
        youtube: { label: 'YouTube', color: '#FF0000', icon: <Youtube className="h-4 w-4" /> },
        instagram: { label: 'Instagram', color: '#E1306C', icon: <Instagram className="h-4 w-4" /> },
        facebook: { label: 'Facebook', color: '#1877F2', icon: <Facebook className="h-4 w-4" /> },
    }

    // Recent videos for timeline (last 5)
    const timelineVideos = videos.slice(0, 5)

    // Connected platforms
    const getPlatformStatus = (platform: string) =>
        platformStatuses.find((p) => p.platform === platform)

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-4xl font-bold text-white tracking-tight">Dashboard</h1>
                    <p className="text-lg text-white/50 mt-3">
                        Welcome back, {creator.display_name || creator.handles || 'Creator'}
                    </p>
                </div>
                <div className="flex gap-3">
                    <Link to="/upload">
                        <Button>
                            <Upload className="mr-2 h-4 w-4" />
                            Upload Content
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Key Metrics — 6 cards */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                <div className="p-4 rounded-xl bg-card border border-border/20">
                    <div className="flex items-center gap-2 mb-2">
                        <Eye className="h-3.5 w-3.5 text-primary" />
                        <p className="text-base text-white/60 uppercase tracking-wider font-medium">Total Views</p>
                    </div>
                    <p className="text-4xl font-semibold text-white tracking-tight">{totalViews.toLocaleString()}</p>
                </div>
                <div className="p-4 rounded-xl bg-card border border-border/20">
                    <div className="flex items-center gap-2 mb-2">
                        <Heart className="h-3.5 w-3.5 text-primary" />
                        <p className="text-base text-white/60 uppercase tracking-wider font-medium">Total Likes</p>
                    </div>
                    <p className="text-4xl font-semibold text-white tracking-tight">{totalLikes.toLocaleString()}</p>
                </div>
                <div className="p-4 rounded-xl bg-card border border-border/20">
                    <div className="flex items-center gap-2 mb-2">
                        <MessageCircle className="h-3.5 w-3.5 text-primary" />
                        <p className="text-base text-white/60 uppercase tracking-wider font-medium">Comments</p>
                    </div>
                    <p className="text-4xl font-semibold text-white tracking-tight">{totalComments.toLocaleString()}</p>
                </div>
                <div className="p-4 rounded-xl bg-card border border-border/20">
                    <div className="flex items-center gap-2 mb-2">
                        <Video className="h-3.5 w-3.5 text-primary" />
                        <p className="text-base text-white/60 uppercase tracking-wider font-medium">Total Videos</p>
                    </div>
                    <p className="text-4xl font-semibold text-white tracking-tight">{totalVideos}</p>
                </div>
                <div className="p-4 rounded-xl bg-card border border-border/20">
                    <div className="flex items-center gap-2 mb-2">
                        <Clock className="h-3.5 w-3.5 text-primary" />
                        <p className="text-base text-white/60 uppercase tracking-wider font-medium">Scheduled</p>
                    </div>
                    <p className="text-4xl font-semibold text-white tracking-tight">{scheduledCount}</p>
                </div>
                <div className="p-4 rounded-xl bg-card border border-border/20">
                    <div className="flex items-center gap-2 mb-2">
                        <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
                        <p className="text-base text-white/60 uppercase tracking-wider font-medium">Posted</p>
                    </div>
                    <p className="text-4xl font-semibold text-white tracking-tight">{postedCount}</p>
                </div>
            </div>

            {/* Middle Section — Timeline + Platform Distribution + Connected Platforms */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Publishing Timeline */}
                <div className="lg:col-span-2 p-6 rounded-xl bg-card border border-border/20">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <p className="text-base text-white/60 uppercase tracking-wider mb-1.5 font-medium">Your Content</p>
                            <h3 className="text-3xl font-semibold text-white tracking-tight">Publishing Timeline</h3>
                        </div>
                        <Link to="/videos" className="text-lg text-primary hover:text-primary/80 flex items-center gap-1">
                            View all <ArrowRight className="h-4 w-4" />
                        </Link>
                    </div>
                    {timelineVideos.length === 0 ? (
                        <div className="flex items-center justify-center h-48 text-white/30">
                            <div className="text-center">
                                <Video className="h-10 w-10 mx-auto mb-2 opacity-40" />
                                <p className="text-lg">No videos yet. Upload your first video to get started.</p>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {timelineVideos.map((video) => {
                                const date = video.posted_at || video.scheduled_at || video.created_at
                                const platformInfo = platformConfig[video.platform_target] || null
                                return (
                                    <div key={video.id} className="flex items-center gap-3 p-3 rounded-lg bg-black/20 hover:bg-black/30 transition-colors">
                                        <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">
                                            {platformInfo ? platformInfo.icon : <Video className="h-4 w-4 text-white/40" />}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-lg font-medium text-white truncate">{video.title}</p>
                                            <div className="flex items-center gap-2 mt-0.5">
                                                <Badge
                                                    variant="outline"
                                                    className={`text-[10px] px-1.5 py-0 border-gray-700 ${
                                                        video.status === 'posted' ? 'text-success border-green-800/50' :
                                                        video.status === 'scheduled' ? 'text-warning border-yellow-800/50' :
                                                        video.status === 'failed' ? 'text-red-400 border-red-800/50' :
                                                        'text-white/60'
                                                    }`}
                                                >
                                                    {video.status}
                                                </Badge>
                                                {platformInfo && (
                                                    <span className="text-[10px] text-white/40">{platformInfo.label}</span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex-shrink-0 text-right">
                                            <div className="flex items-center gap-1 text-white/30">
                                                <Calendar className="h-3 w-3" />
                                                <span className="text-[11px]">
                                                    {date ? new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </div>

                {/* Right Column — Platform Distribution + Connected Platforms */}
                <div className="space-y-4">
                    {/* Platform Distribution */}
                    <div className="p-6 rounded-xl bg-card border border-border/20">
                        <div className="mb-4">
                            <p className="text-base text-white/60 uppercase tracking-wider mb-1.5 font-medium">Where Your Content Goes</p>
                            <h3 className="text-2xl font-semibold text-white tracking-tight">Platform Distribution</h3>
                        </div>
                        {Object.keys(platformCounts).length === 0 ? (
                            <div className="flex items-center justify-center h-24 text-white/30">
                                <p className="text-lg text-center">Post your first video to see distribution</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {Object.entries(platformCounts).map(([platform, count]) => {
                                    const config = platformConfig[platform]
                                    if (!config) return null
                                    const percentage = postedCount > 0 ? Math.round((count / postedCount) * 100) : 0
                                    const barWidth = Math.max((count / maxPlatformCount) * 100, 8)
                                    return (
                                        <div key={platform}>
                                            <div className="flex items-center justify-between mb-1.5">
                                                <div className="flex items-center gap-2">
                                                    <span style={{ color: config.color }}>{config.icon}</span>
                                                    <span className="text-lg text-white/80">{config.label}</span>
                                                </div>
                                                <span className="text-base text-white/60">{count} video{count !== 1 ? 's' : ''} ({percentage}%)</span>
                                            </div>
                                            <div className="h-2 bg-black/30 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full rounded-full transition-all duration-500"
                                                    style={{ width: `${barWidth}%`, backgroundColor: config.color }}
                                                />
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        )}
                    </div>

                    {/* Connected Platforms */}
                    <div className="p-6 rounded-xl bg-card border border-border/20">
                        <div className="mb-4">
                            <p className="text-base text-white/60 uppercase tracking-wider mb-1.5 font-medium">Integrations</p>
                            <h3 className="text-2xl font-semibold text-white tracking-tight">Connected Platforms</h3>
                        </div>
                        <div className="space-y-2.5">
                            {(['youtube', 'instagram', 'facebook'] as const).map((platform) => {
                                const status = getPlatformStatus(platform)
                                const config = platformConfig[platform]
                                const isConnected = status?.connected ?? false
                                return (
                                    <div key={platform} className="flex items-center justify-between p-2.5 rounded-lg bg-black/20">
                                        <div className="flex items-center gap-2.5">
                                            <span style={{ color: isConnected ? config.color : 'rgba(255,255,255,0.2)' }}>
                                                {config.icon}
                                            </span>
                                            <span className={`text-lg ${isConnected ? 'text-white/80' : 'text-white/40'}`}>
                                                {config.label}
                                            </span>
                                        </div>
                                        {isConnected ? (
                                            <div className="flex items-center gap-1.5">
                                                <div className="w-2 h-2 rounded-full bg-green-500" />
                                                <span className="text-base text-success">Connected</span>
                                            </div>
                                        ) : (
                                            <Link
                                                to={`/settings/connections?platform=${platform}`}
                                                className="text-base text-primary hover:text-primary/80 flex items-center gap-1"
                                            >
                                                <Link2 className="h-3 w-3" />
                                                Connect
                                            </Link>
                                        )}
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
