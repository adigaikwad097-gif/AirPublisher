import { KPICard } from '@/components/dashboard/kpi-card'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Eye,
  Heart,
  MessageCircle,
  DollarSign,
  TrendingUp,
  Calendar,
  Upload,
  Video,
  Clock,
  Search,
  ArrowRight,
  ChevronDown,
  Edit,
  MoreVertical,
  X,
  BarChart3,
} from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { getCurrentCreator } from '@/lib/db/creator'
import { getVideosByCreator } from '@/lib/db/videos'
import { getCreatorRank } from '@/lib/db/leaderboard'
import { formatNumber, getRankBadgeColor, getRankBadgeIcon } from '@/lib/utils'

// Force dynamic rendering - this page uses searchParams
export const dynamic = 'force-dynamic'

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ profile?: string }> | { profile?: string }
}) {
  let creator = null
  
  try {
    // Handle both Promise and direct object (Next.js 13+ vs 14+)
    const params = searchParams instanceof Promise ? await searchParams : searchParams
    
    // If profile unique_identifier is provided in query params, use it
    console.log('[DashboardPage] searchParams profile:', params?.profile)
    creator = await getCurrentCreator(params?.profile)
    console.log('[DashboardPage] Creator found:', !!creator, creator?.unique_identifier)
  } catch (error: any) {
    console.error('[DashboardPage] Error fetching creator:', error)
    // Don't throw - just show the "set up profile" message
    creator = null
  }

  if (!creator) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-4xl font-extrabold mb-3 text-white">Dashboard</h1>
          <p className="text-white/70 text-lg font-medium">
            Welcome! Please complete your creator profile to get started.
          </p>
        </div>
        <Card className="border-white/10 bg-white/5">
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <p className="text-lg font-semibold mb-4 text-white/90">
                Complete your creator profile to start publishing and competing on leaderboards.
              </p>
              <Link href="/setup">
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

  const videos = await getVideosByCreator(creator.unique_identifier)
  const allTimeRank = await getCreatorRank(creator.unique_identifier, 'all_time')
  const weeklyRank = await getCreatorRank(creator.unique_identifier, 'weekly')

  // Calculate KPIs from videos - aggregate from actual video metrics
  const totalViews = videos
    .filter((v) => v.status === 'posted')
    .reduce((sum, v) => sum + ((v as any).views || 0), 0)
  const totalLikes = videos
    .filter((v) => v.status === 'posted')
    .reduce((sum, v) => sum + ((v as any).likes || 0), 0)
  const totalComments = videos
    .filter((v) => v.status === 'posted')
    .reduce((sum, v) => sum + ((v as any).comments || 0), 0)
  const estimatedRevenue = allTimeRank?.estimated_revenue || 0

  const scheduledCount = videos.filter((v) => v.status === 'scheduled').length
  const draftCount = videos.filter((v) => v.status === 'draft').length
  const postedCount = videos.filter((v) => v.status === 'posted').length

  // Recent videos
  const recentVideos = videos.slice(0, 4)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-4xl font-extrabold mb-2 text-white">Dashboard</h1>
          <p className="text-white/70 text-sm uppercase tracking-[0.4em]">
            Welcome back, {creator.display_name || 'Creator'}
          </p>
        </div>
        <div className="flex gap-3">
          <Link href="/upload">
            <Button className="bg-[#89CFF0] text-black hover:bg-[#89CFF0]/90">
              <Upload className="mr-2 h-4 w-4" />
              Upload Content
            </Button>
          </Link>
        </div>
      </div>

      {/* Key Metrics - Dark cards with subtle baby blue accents */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        <div className="p-4 rounded-xl bg-gray-900/40 border border-gray-800/50 hover:border-[#89CFF0]/30 transition-colors">
          <p className="text-xs text-white/50 mb-1 uppercase tracking-wider">Total Views</p>
          <p className="text-2xl font-bold text-white">{formatNumber(totalViews)}</p>
          <p className="text-xs text-[#89CFF0] mt-1">+12.5%</p>
        </div>
        
        <div className="p-4 rounded-xl bg-gray-900/40 border border-gray-800/50 hover:border-[#89CFF0]/30 transition-colors">
          <p className="text-xs text-white/50 mb-1 uppercase tracking-wider">Total Likes</p>
          <p className="text-2xl font-bold text-white">{formatNumber(totalLikes)}</p>
          <p className="text-xs text-[#89CFF0] mt-1">+8.2%</p>
        </div>
        
        <div className="p-4 rounded-xl bg-gray-900/40 border border-gray-800/50 hover:border-[#89CFF0]/30 transition-colors">
          <p className="text-xs text-white/50 mb-1 uppercase tracking-wider">Comments</p>
          <p className="text-2xl font-bold text-white">{formatNumber(totalComments)}</p>
          <p className="text-xs text-[#89CFF0] mt-1">+5.1%</p>
        </div>
        
        <div className="p-4 rounded-xl bg-gray-900/40 border border-gray-800/50 hover:border-[#89CFF0]/30 transition-colors">
          <p className="text-xs text-white/50 mb-1 uppercase tracking-wider">Revenue</p>
          <p className="text-2xl font-bold text-white">${formatNumber(estimatedRevenue)}</p>
          <p className="text-xs text-[#89CFF0] mt-1">+2452.4%</p>
        </div>
        
        <div className="p-4 rounded-xl bg-gray-900/40 border border-gray-800/50 hover:border-[#89CFF0]/30 transition-colors">
          <p className="text-xs text-white/50 mb-1 uppercase tracking-wider">Scheduled</p>
          <p className="text-2xl font-bold text-white">{scheduledCount}</p>
          <p className="text-xs text-white/40 mt-1">Ready</p>
        </div>
        
        <div className="p-4 rounded-xl bg-gray-900/40 border border-gray-800/50 hover:border-[#89CFF0]/30 transition-colors">
          <p className="text-xs text-white/50 mb-1 uppercase tracking-wider">Drafts</p>
          <p className="text-2xl font-bold text-white">{draftCount}</p>
          <p className="text-xs text-white/40 mt-1">In Progress</p>
        </div>
        
        <div className="p-4 rounded-xl bg-gray-900/40 border border-gray-800/50 hover:border-[#89CFF0]/30 transition-colors">
          <p className="text-xs text-white/50 mb-1 uppercase tracking-wider">Posted</p>
          <p className="text-2xl font-bold text-white">{postedCount}</p>
          <p className="text-xs text-white/40 mt-1">Published</p>
        </div>
      </div>

      {/* Charts Section - Dark with subtle gradients */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left Chart - Performance Projection */}
        <div className="lg:col-span-2 p-6 rounded-xl bg-gradient-to-br from-gray-900/60 to-gray-800/40 border border-gray-800/50 backdrop-blur-sm">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-xs text-white/50 uppercase tracking-wider mb-1">A Fairly Precise Estimate</p>
              <h3 className="text-xl font-bold text-white">Performance Projection</h3>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded bg-[#89CFF0]"></div>
                <span className="text-xs text-white/50">Views</span>
              </div>
            </div>
          </div>
          {/* Placeholder for chart */}
          <div className="h-64 bg-black/30 rounded-lg flex items-center justify-center border border-gray-800/50">
            <div className="text-center">
              <BarChart3 className="h-12 w-12 text-[#89CFF0]/30 mx-auto mb-2" />
              <p className="text-white/30 text-sm">Chart visualization coming soon</p>
            </div>
          </div>
        </div>

        {/* Middle Chart - Content Distribution */}
        <div className="p-6 rounded-xl bg-gradient-to-br from-gray-900/60 to-gray-800/40 border border-gray-800/50 backdrop-blur-sm">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-xs text-white/50 uppercase tracking-wider mb-1">Where Your Content Goes</p>
              <h3 className="text-xl font-bold text-white">Platform Distribution</h3>
            </div>
            <Button variant="ghost" size="sm" className="text-white/50 hover:bg-white/10">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </div>
          {/* Placeholder for chart */}
          <div className="h-64 bg-black/30 rounded-lg flex items-center justify-center border border-gray-800/50">
            <div className="flex flex-col gap-3">
              <div className="w-32 h-8 rounded bg-[#89CFF0]/20 border border-[#89CFF0]/30"></div>
              <div className="w-24 h-8 rounded bg-[#89CFF0]/30 border border-[#89CFF0]/40"></div>
              <div className="w-28 h-8 rounded bg-[#89CFF0]/25 border border-[#89CFF0]/35"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity - Dark card */}
      <div className="p-6 rounded-xl bg-gradient-to-br from-gray-900/60 to-gray-800/40 border border-gray-800/50 backdrop-blur-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-xs text-white/50 uppercase tracking-wider mb-1">Recent Activity</p>
            <h3 className="text-xl font-bold text-white">Your Videos</h3>
          </div>
          <Link href="/videos" className="text-sm text-[#89CFF0] hover:text-[#89CFF0]/80 flex items-center gap-1">
            View all <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        {recentVideos.length === 0 ? (
          <div className="text-center py-8 text-white/50">
            <p className="mb-4">No videos yet. Start by uploading your first piece of content.</p>
            <Link href="/upload">
              <Button className="bg-[#89CFF0] text-black hover:bg-[#89CFF0]/90">
                <Upload className="mr-2 h-4 w-4" />
                Upload Video
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {recentVideos.map((video) => (
              <div
                key={video.id}
                className="flex items-center justify-between p-4 rounded-lg bg-black/30 hover:bg-black/50 transition-colors border border-gray-800/50"
              >
                <div className="flex items-center gap-4 flex-1">
                  <div className="w-12 h-12 rounded-lg bg-[#89CFF0]/10 border border-[#89CFF0]/20 flex items-center justify-center">
                    <Video className="h-6 w-6 text-[#89CFF0]" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-white text-sm">{video.title}</h4>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge
                        variant="outline"
                        className="text-xs bg-gray-900/50 text-white/70 border-gray-700"
                      >
                        {video.status}
                      </Badge>
                      <span className="text-xs text-white/50">
                        {video.platform_target}
                      </span>
                    </div>
                  </div>
                </div>
                {video.posted_at && (
                  <div className="text-right">
                    <p className="text-xs text-white/50">
                      {new Date(video.posted_at).toLocaleDateString()}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
