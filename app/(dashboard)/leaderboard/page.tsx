import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Trophy, TrendingUp, Users } from 'lucide-react'
import { getLeaderboard, getLeaderboardByNiche } from '@/lib/db/leaderboard'
import { getCurrentCreator } from '@/lib/db/creator'
import { formatNumber, getRankBadgeColor, getRankBadgeIcon } from '@/lib/utils'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export default async function LeaderboardPage() {
  const creator = await getCurrentCreator()
  
  // Wrap in try-catch to handle errors gracefully
  let globalAllTime: any[] = []
  let globalWeekly: any[] = []
  let nicheAllTime: any[] = []
  
  try {
    const results = await Promise.allSettled([
      getLeaderboard('all_time', 100),
      getLeaderboard('weekly', 100),
      creator?.niche
        ? getLeaderboardByNiche(creator.niche, 'all_time', 50)
        : Promise.resolve([]),
    ])
    
    if (results[0].status === 'fulfilled') {
      globalAllTime = results[0].value
    } else {
      console.error('Error loading all-time leaderboard:', results[0].reason)
    }
    
    if (results[1].status === 'fulfilled') {
      globalWeekly = results[1].value
    } else {
      console.error('Error loading weekly leaderboard:', results[1].reason)
    }
    
    if (results[2].status === 'fulfilled') {
      nicheAllTime = results[2].value
    } else {
      console.error('Error loading niche leaderboard:', results[2].reason)
    }
  } catch (error) {
    console.error('Error loading leaderboards:', error)
  }

  const LeaderboardTable = ({
    entries,
    currentCreatorId,
  }: {
    entries: typeof globalAllTime
    currentCreatorId?: string
  }) => (
    <div className="space-y-2">
      {entries.map((entry, index) => {
        const isCurrentCreator =
          entry.creator_unique_identifier === currentCreatorId
        return (
          <div
            key={entry.id}
            className={`flex items-center gap-4 p-4 rounded-lg border ${
              isCurrentCreator
                ? 'bg-primary/10 border-primary/50'
                : 'bg-card border-border hover:bg-card-hover'
            } transition-colors`}
          >
            <div className="w-12 text-center">
              <span
                className={`text-2xl font-bold ${getRankBadgeColor(
                  entry.rank
                )}`}
              >
                {getRankBadgeIcon(entry.rank)}
              </span>
              <div className="text-sm text-foreground/70">#{entry.rank}</div>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                  {entry.creator_profiles.avatar_url ? (
                    <img
                      src={entry.creator_profiles.avatar_url}
                      alt={entry.creator_profiles.display_name || 'Creator'}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Users className="h-5 w-5 text-foreground/50" />
                  )}
                </div>
                <div>
                  <div className="font-semibold">
                    {entry.creator_profiles.display_name || 'Anonymous Creator'}
                    {isCurrentCreator && (
                      <Badge variant="primary" className="ml-2">
                        You
                      </Badge>
                    )}
                  </div>
                  {entry.creator_profiles.niche && (
                    <div className="text-sm text-foreground/50">
                      {entry.creator_profiles.niche}
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="grid grid-cols-4 gap-4 text-right">
              <div>
                <div className="text-xs text-foreground/50 mb-1">Views</div>
                <div className="font-semibold">
                  {formatNumber(entry.total_views)}
                </div>
              </div>
              <div>
                <div className="text-xs text-foreground/50 mb-1">Likes</div>
                <div className="font-semibold">
                  {formatNumber(entry.total_likes)}
                </div>
              </div>
              <div>
                <div className="text-xs text-foreground/50 mb-1">Comments</div>
                <div className="font-semibold">
                  {formatNumber(entry.total_comments)}
                </div>
              </div>
              <div>
                <div className="text-xs text-foreground/50 mb-1">Score</div>
                <div className="font-semibold text-primary">
                  {formatNumber(entry.score)}
                </div>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )

  return (
    <div className="space-y-8">
      <div className="mb-8">
        <h1 className="text-4xl font-extrabold flex items-center gap-4 mb-3">
          <div className="p-3 bg-primary/10 rounded-xl">
            <Trophy className="h-8 w-8 text-primary" />
          </div>
          Leaderboard
        </h1>
        <p className="text-foreground/80 text-lg font-medium">
          Compete with creators and climb the ranks
        </p>
      </div>

      <Tabs defaultValue="all-time" className="space-y-6">
        <TabsList>
          <TabsTrigger value="all-time">All Time</TabsTrigger>
          <TabsTrigger value="weekly">This Week</TabsTrigger>
          {creator?.niche && <TabsTrigger value="niche">My Niche</TabsTrigger>}
        </TabsList>

        <TabsContent value="all-time">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Global Leaderboard - All Time
              </CardTitle>
            </CardHeader>
            <CardContent>
              {globalAllTime.length === 0 ? (
                <div className="text-center py-12 text-foreground/70">
                  <p className="text-lg mb-2">No leaderboard data yet</p>
                  <p className="text-sm">Start publishing content to appear on the leaderboard!</p>
                </div>
              ) : (
                <LeaderboardTable
                  entries={globalAllTime}
                  currentCreatorId={creator?.unique_identifier}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="weekly">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Global Leaderboard - This Week
              </CardTitle>
            </CardHeader>
            <CardContent>
              {globalWeekly.length === 0 ? (
                <div className="text-center py-12 text-foreground/70">
                  <p className="text-lg mb-2">No weekly leaderboard data yet</p>
                  <p className="text-sm">Start publishing content to appear on the leaderboard!</p>
                </div>
              ) : (
                <LeaderboardTable
                  entries={globalWeekly}
                  currentCreatorId={creator?.unique_identifier}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {creator?.niche && (
          <TabsContent value="niche">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  {creator.niche} Leaderboard
                </CardTitle>
              </CardHeader>
              <CardContent>
                {nicheAllTime.length === 0 ? (
                  <div className="text-center py-8 text-foreground/70">
                    No rankings available for this niche yet.
                  </div>
                ) : (
                  <LeaderboardTable
                    entries={nicheAllTime}
                    currentCreatorId={creator.unique_identifier}
                  />
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  )
}

