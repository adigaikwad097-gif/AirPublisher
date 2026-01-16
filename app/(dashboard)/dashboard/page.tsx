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
} from 'lucide-react'
import Link from 'next/link'
import { getCurrentCreator } from '@/lib/db/creator'
import { getVideosByCreator } from '@/lib/db/videos'
import { getCreatorRank } from '@/lib/db/leaderboard'
import { formatNumber, getRankBadgeColor, getRankBadgeIcon } from '@/lib/utils'

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
          <h1 className="text-4xl font-extrabold mb-3">Dashboard</h1>
          <p className="text-foreground/80 text-lg font-medium">
            Welcome! Please complete your creator profile to get started.
          </p>
        </div>
        <Card className="border-primary/30 bg-card-elevated">
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <p className="text-lg font-semibold mb-4 text-foreground/90">
                Complete your creator profile to start publishing and competing on leaderboards.
              </p>
              <Link href="/setup">
                <Button size="lg" className="bg-primary hover:bg-primary-dark">
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

  // Calculate KPIs from videos (placeholder - in production, aggregate from platform APIs)
  const totalViews = videos
    .filter((v) => v.status === 'posted')
    .reduce((sum, v) => sum + 0, 0) // Placeholder
  const totalLikes = 0 // Placeholder
  const totalComments = 0 // Placeholder
  const estimatedRevenue = allTimeRank?.estimated_revenue || 0

  const scheduledCount = videos.filter((v) => v.status === 'scheduled').length
  const draftCount = videos.filter((v) => v.status === 'draft').length

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-extrabold mb-2">Dashboard</h1>
          <p className="text-foreground/80 text-lg font-medium">
            Welcome back, {creator.display_name || 'Creator'}
          </p>
        </div>
        <div className="flex gap-3">
          <Link href="/upload">
            <Button>
              <Upload className="mr-2 h-4 w-4" />
              Upload Content
            </Button>
          </Link>
        </div>
      </div>

      {/* Rank Badge */}
      {(allTimeRank || weeklyRank) && (
        <Card className="bg-gradient-to-r from-card to-card-elevated border-primary/30 shadow-glow-sm">
          <CardContent className="pt-8 pb-8">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-foreground/60 mb-3 uppercase tracking-wider">Your Rank</p>
                <div className="flex items-center gap-6">
                  {allTimeRank && (
                    <div>
                      <span className="text-4xl font-extrabold">
                        {getRankBadgeIcon(allTimeRank.rank)}
                      </span>
                      <span
                        className={`text-4xl font-extrabold ml-3 ${getRankBadgeColor(
                          allTimeRank.rank
                        )}`}
                      >
                        #{allTimeRank.rank}
                      </span>
                      <span className="text-sm font-semibold text-foreground/60 ml-3 uppercase tracking-wide">
                        All Time
                      </span>
                    </div>
                  )}
                  {weeklyRank && (
                    <div>
                      <span className="text-3xl font-extrabold">
                        #{weeklyRank.rank}
                      </span>
                      <span className="text-sm font-semibold text-foreground/60 ml-3 uppercase tracking-wide">
                        This Week
                      </span>
                    </div>
                  )}
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-foreground/60 mb-3 uppercase tracking-wider">Score</p>
                <p className="text-5xl font-extrabold text-primary">
                  {formatNumber(allTimeRank?.score || 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KPICard
          title="Total Views"
          value={totalViews}
          icon={Eye}
          format="number"
        />
        <KPICard
          title="Total Likes"
          value={totalLikes}
          icon={Heart}
          format="number"
        />
        <KPICard
          title="Total Comments"
          value={totalComments}
          icon={MessageCircle}
          format="number"
        />
        <KPICard
          title="Estimated Revenue"
          value={estimatedRevenue}
          icon={DollarSign}
          format="currency"
        />
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Scheduled Posts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold mb-2">{scheduledCount}</div>
            <p className="text-sm text-foreground/70 mb-4">
              Videos ready to publish
            </p>
            <Link href="/schedule">
              <Button variant="outline" className="w-full">
                View Schedule
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Drafts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold mb-2">{draftCount}</div>
            <p className="text-sm text-foreground/70 mb-4">
              Videos in progress
            </p>
            <Link href="/upload">
              <Button variant="outline" className="w-full">
                Continue Editing
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Recent Videos */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Videos</CardTitle>
        </CardHeader>
        <CardContent>
          {videos.length === 0 ? (
            <div className="text-center py-8 text-foreground/70">
              <p>No videos yet. Start by uploading your first piece of content.</p>
              <Link href="/upload">
                <Button className="mt-4">Upload Video</Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {videos.slice(0, 5).map((video) => (
                <div
                  key={video.id}
                  className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-card-hover transition-colors"
                >
                  <div className="flex-1">
                    <h4 className="font-semibold">{video.title}</h4>
                    <p className="text-sm text-foreground/70 mt-1">
                      {video.description || 'No description'}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge
                        variant={
                          video.status === 'posted'
                            ? 'success'
                            : video.status === 'scheduled'
                            ? 'primary'
                            : 'default'
                        }
                      >
                        {video.status}
                      </Badge>
                      <span className="text-xs text-foreground/50">
                        {video.platform_target}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    {video.posted_at && (
                      <p className="text-sm text-foreground/70">
                        {new Date(video.posted_at).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

