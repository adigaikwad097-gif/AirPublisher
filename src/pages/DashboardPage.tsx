import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { KPICard } from '@/components/dashboard/kpi-card'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
    Upload,
    Video,
    ArrowRight,
    MoreVertical,
    BarChart3,
} from 'lucide-react'
import { getCurrentCreator } from '@/lib/db/creator'
import { getVideosByCreator } from '@/lib/db/videos'
import { getCreatorRank } from '@/lib/db/leaderboard'
import { formatNumber } from '@/lib/utils'
import { getCreatorId } from '@/lib/auth/session'

export default function DashboardPage() {
    const [isLoading, setIsLoading] = useState(true)
    const [creator, setCreator] = useState<any>(null)
    const [videos, setVideos] = useState<any[]>([])
    const [allTimeRank, setAllTimeRank] = useState<any>(null)
    const [weeklyRank, setWeeklyRank] = useState<any>(null)

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
                    const [fetchedVideos, fetchedAllTimeRank, fetchedWeeklyRank] = await Promise.all([
                        getVideosByCreator(currentCreator.unique_identifier),
                        getCreatorRank(currentCreator.unique_identifier, 'all_time'),
                        getCreatorRank(currentCreator.unique_identifier, 'weekly')
                    ])

                    setVideos(fetchedVideos)
                    setAllTimeRank(fetchedAllTimeRank)
                    setWeeklyRank(fetchedWeeklyRank)
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
                    <p className="text-white/60 text-sm">
                        Welcome! Please complete your creator profile to get started.
                    </p>
                </div>
                <Card className="border-white/10 bg-white/5">
                    <CardContent className="pt-6">
                        <div className="text-center py-8">
                            <p className="text-lg font-semibold mb-4 text-white/90">
                                Complete your creator profile to start publishing and competing on leaderboards.
                            </p>
                            <Link to="/setup">
                                <Button size="lg" className="bg-[#89CFF0] text-black hover:bg-[#89CFF0]/90">
                                    Set Up Profile
                                </Button>
                            </Link>
                        </div>
                    </CardContent>
                </Card>
            </div>
        )
    }

    // Calculate KPIs
    const totalViews = videos
        .filter((v) => v.status === 'posted')
        .reduce((sum, v) => sum + (v.views || 0), 0)
    const totalLikes = videos
        .filter((v) => v.status === 'posted')
        .reduce((sum, v) => sum + (v.likes || 0), 0)
    const totalComments = videos
        .filter((v) => v.status === 'posted')
        .reduce((sum, v) => sum + (v.comments || 0), 0)
    const estimatedRevenue = allTimeRank?.estimated_revenue || 0

    const scheduledCount = videos.filter((v) => v.status === 'scheduled').length
    const draftCount = videos.filter((v) => v.status === 'draft').length
    const postedCount = videos.filter((v) => v.status === 'posted').length

    const recentVideos = videos.slice(0, 4)

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-3xl font-bold mb-1 text-white tracking-tight">Dashboard</h1>
                    <p className="text-white/50 text-xs uppercase tracking-wider font-medium">
                        Welcome back, {creator.display_name || 'Creator'}
                    </p>
                </div>
                <div className="flex gap-3">
                    <Link to="/upload">
                        <Button className="bg-[#89CFF0] text-black hover:bg-[#89CFF0]/90">
                            <Upload className="mr-2 h-4 w-4" />
                            Upload Content
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
                <div className="p-4 rounded-xl bg-gray-900/40 border border-gray-800/50">
                    <p className="text-xs text-white/50 mb-1.5 uppercase tracking-wider font-medium">Total Views</p>
                    <p className="text-2xl font-semibold text-white tracking-tight">{formatNumber(totalViews)}</p>
                </div>
                <div className="p-4 rounded-xl bg-gray-900/40 border border-gray-800/50">
                    <p className="text-xs text-white/50 mb-1.5 uppercase tracking-wider font-medium">Total Likes</p>
                    <p className="text-2xl font-semibold text-white tracking-tight">{formatNumber(totalLikes)}</p>
                </div>
                <div className="p-4 rounded-xl bg-gray-900/40 border border-gray-800/50">
                    <p className="text-xs text-white/50 mb-1.5 uppercase tracking-wider font-medium">Comments</p>
                    <p className="text-2xl font-semibold text-white tracking-tight">{formatNumber(totalComments)}</p>
                </div>
                <div className="p-4 rounded-xl bg-gray-900/40 border border-gray-800/50">
                    <p className="text-xs text-white/50 mb-1.5 uppercase tracking-wider font-medium">Revenue</p>
                    <p className="text-2xl font-semibold text-white tracking-tight">${formatNumber(estimatedRevenue)}</p>
                </div>
                <div className="p-4 rounded-xl bg-gray-900/40 border border-gray-800/50">
                    <p className="text-xs text-white/50 mb-1.5 uppercase tracking-wider font-medium">Scheduled</p>
                    <p className="text-2xl font-semibold text-white tracking-tight">{scheduledCount}</p>
                </div>
                <div className="p-4 rounded-xl bg-gray-900/40 border border-gray-800/50">
                    <p className="text-xs text-white/50 mb-1.5 uppercase tracking-wider font-medium">Drafts</p>
                    <p className="text-2xl font-semibold text-white tracking-tight">{draftCount}</p>
                </div>
                <div className="p-4 rounded-xl bg-gray-900/40 border border-gray-800/50">
                    <p className="text-xs text-white/50 mb-1.5 uppercase tracking-wider font-medium">Posted</p>
                    <p className="text-2xl font-semibold text-white tracking-tight">{postedCount}</p>
                </div>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="lg:col-span-2 p-6 rounded-xl bg-gradient-to-br from-gray-900/60 to-gray-800/40 border border-gray-800/50 backdrop-blur-sm">
                    <div className="flex items-start justify-between mb-4">
                        <div>
                            <p className="text-xs text-white/50 uppercase tracking-wider mb-1.5 font-medium">A Fairly Precise Estimate</p>
                            <h3 className="text-xl font-semibold text-white tracking-tight">Performance Projection</h3>
                        </div>
                    </div>
                    <div className="h-64 bg-black/30 rounded-lg flex items-center justify-center border border-gray-800/50">
                        <div className="text-center">
                            <BarChart3 className="h-12 w-12 text-[#89CFF0]/30 mx-auto mb-2" />
                            <p className="text-white/30 text-sm">Chart visualization coming soon</p>
                        </div>
                    </div>
                </div>

                <div className="p-6 rounded-xl bg-gradient-to-br from-gray-900/60 to-gray-800/40 border border-gray-800/50 backdrop-blur-sm">
                    <div className="flex items-start justify-between mb-4">
                        <div>
                            <p className="text-xs text-white/50 uppercase tracking-wider mb-1.5 font-medium">Where Your Content Goes</p>
                            <h3 className="text-xl font-semibold text-white tracking-tight">Platform Distribution</h3>
                        </div>
                    </div>
                    <div className="h-64 bg-black/30 rounded-lg flex items-center justify-center border border-gray-800/50">
                        <div className="flex flex-col gap-3">
                            <div className="w-32 h-8 rounded bg-[#89CFF0]/20 border border-[#89CFF0]/30"></div>
                            <div className="w-24 h-8 rounded bg-[#89CFF0]/30 border border-[#89CFF0]/40"></div>
                            <div className="w-28 h-8 rounded bg-[#89CFF0]/25 border border-[#89CFF0]/35"></div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Recent Activity */}
            <div className="p-6 rounded-xl bg-gradient-to-br from-gray-900/60 to-gray-800/40 border border-gray-800/50 backdrop-blur-sm">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <p className="text-xs text-white/50 uppercase tracking-wider mb-1.5 font-medium">Recent Activity</p>
                        <h3 className="text-xl font-semibold text-white tracking-tight">Your Videos</h3>
                    </div>
                    <Link to="/videos" className="text-sm text-[#89CFF0] hover:text-[#89CFF0]/80 flex items-center gap-1">
                        View all <ArrowRight className="h-4 w-4" />
                    </Link>
                </div>
                {recentVideos.length === 0 ? (
                    <div className="text-center py-8 text-white/50">
                        <p className="mb-4">No videos yet. Start by uploading your first piece of content.</p>
                        <Link to="/upload">
                            <Button className="bg-[#89CFF0] text-black hover:bg-[#89CFF0]/90">
                                <Upload className="mr-2 h-4 w-4" />
                                Upload Video
                            </Button>
                        </Link>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {recentVideos.map((video) => (
                            <div key={video.id} className="flex items-center justify-between p-4 rounded-lg bg-black/30 hover:bg-black/50 transition-colors border border-gray-800/50">
                                <div className="flex items-center gap-4 flex-1">
                                    <div className="w-12 h-12 rounded-lg bg-[#89CFF0]/10 border border-[#89CFF0]/20 flex items-center justify-center">
                                        <Video className="h-6 w-6 text-[#89CFF0]" />
                                    </div>
                                    <div>
                                        <h4 className="font-medium text-white text-sm">{video.title}</h4>
                                        <div className="flex items-center gap-2 mt-1">
                                            <Badge variant="outline" className="text-xs bg-gray-900/50 text-white/70 border-gray-700">
                                                {video.status}
                                            </Badge>
                                            <span className="text-xs text-white/50">{video.platform_target}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
