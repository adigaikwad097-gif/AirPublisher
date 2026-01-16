import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { getCreatorProfile } from '@/lib/db/creator'
import { getVideosByCreator } from '@/lib/db/videos'
import { getCreatorRank } from '@/lib/db/leaderboard'
import { formatNumber, getRankBadgeColor, getRankBadgeIcon } from '@/lib/utils'
import { Users, Trophy, Eye, Heart, MessageCircle, DollarSign } from 'lucide-react'
import { notFound } from 'next/navigation'

export default async function CreatorProfilePage({
  params,
}: {
  params: { handle: string }
}) {
  const creator = await getCreatorProfile(params.handle)

  if (!creator) {
    notFound()
  }

  const [videos, allTimeRank, weeklyRank] = await Promise.all([
    getVideosByCreator(creator.unique_identifier),
    getCreatorRank(creator.unique_identifier, 'all_time'),
    getCreatorRank(creator.unique_identifier, 'weekly'),
  ])

  const postedVideos = videos.filter((v) => v.status === 'posted')

  return (
    <div className="space-y-8">
      {/* Profile Header */}
      <Card className="bg-gradient-to-r from-card to-card-hover border-primary/20">
        <CardContent className="pt-6">
          <div className="flex items-start gap-6">
            <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center overflow-hidden border-4 border-primary/20">
              {creator.avatar_url ? (
                <img
                  src={creator.avatar_url}
                  alt={creator.display_name || 'Creator'}
                  className="w-full h-full object-cover"
                />
              ) : (
                <Users className="h-12 w-12 text-foreground/50" />
              )}
            </div>
            <div className="flex-1">
              <h1 className="text-3xl font-bold mb-2">
                {creator.display_name || 'Anonymous Creator'}
              </h1>
              {creator.niche && (
                <Badge variant="outline" className="mb-4">
                  {creator.niche}
                </Badge>
              )}
              <div className="flex items-center gap-6 mt-4">
                {allTimeRank && (
                  <div>
                    <div className="text-sm text-foreground/70 mb-1">All Time Rank</div>
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">
                        {getRankBadgeIcon(allTimeRank.rank)}
                      </span>
                      <span
                        className={`text-2xl font-bold ${getRankBadgeColor(
                          allTimeRank.rank
                        )}`}
                      >
                        #{allTimeRank.rank}
                      </span>
                    </div>
                  </div>
                )}
                {weeklyRank && (
                  <div>
                    <div className="text-sm text-foreground/70 mb-1">Weekly Rank</div>
                    <div className="text-2xl font-bold">#{weeklyRank.rank}</div>
                  </div>
                )}
                <div>
                  <div className="text-sm text-foreground/70 mb-1">Total Videos</div>
                  <div className="text-2xl font-bold">{postedVideos.length}</div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      {allTimeRank && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3 mb-2">
                <Eye className="h-5 w-5 text-foreground/50" />
                <div className="text-sm text-foreground/70">Total Views</div>
              </div>
              <div className="text-2xl font-bold">
                {formatNumber(allTimeRank.total_views)}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3 mb-2">
                <Heart className="h-5 w-5 text-foreground/50" />
                <div className="text-sm text-foreground/70">Total Likes</div>
              </div>
              <div className="text-2xl font-bold">
                {formatNumber(allTimeRank.total_likes)}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3 mb-2">
                <MessageCircle className="h-5 w-5 text-foreground/50" />
                <div className="text-sm text-foreground/70">Total Comments</div>
              </div>
              <div className="text-2xl font-bold">
                {formatNumber(allTimeRank.total_comments)}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3 mb-2">
                <Trophy className="h-5 w-5 text-primary" />
                <div className="text-sm text-foreground/70">Score</div>
              </div>
              <div className="text-2xl font-bold text-primary">
                {formatNumber(allTimeRank.score)}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Videos */}
      <Card>
        <CardHeader>
          <CardTitle>Published Videos</CardTitle>
        </CardHeader>
        <CardContent>
          {postedVideos.length === 0 ? (
            <div className="text-center py-8 text-foreground/70">
              No published videos yet.
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {postedVideos.map((video) => (
                <div
                  key={video.id}
                  className="rounded-lg border border-border overflow-hidden hover:bg-card-hover transition-colors"
                >
                  {video.thumbnail_url && (
                    <div className="aspect-video bg-muted overflow-hidden">
                      <img
                        src={video.thumbnail_url}
                        alt={video.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <div className="p-4">
                    <h3 className="font-semibold mb-2 line-clamp-2">{video.title}</h3>
                    {video.description && (
                      <p className="text-sm text-foreground/70 mb-3 line-clamp-2">
                        {video.description}
                      </p>
                    )}
                    <div className="flex items-center justify-between">
                      <Badge variant="outline">{video.platform_target}</Badge>
                      {video.posted_at && (
                        <span className="text-xs text-foreground/50">
                          {new Date(video.posted_at).toLocaleDateString()}
                        </span>
                      )}
                    </div>
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

