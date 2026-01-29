import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Calendar, Clock, Play, Edit } from 'lucide-react'
import { getCurrentCreator } from '@/lib/db/creator'
import { getScheduledVideos } from '@/lib/db/videos'
import { format } from 'date-fns'
import Link from 'next/link'
import { PlatformSelectButton } from '@/components/videos/platform-select-button'

export default async function SchedulePage() {
  const creator = await getCurrentCreator()

  if (!creator) {
    return <div>Please complete your creator profile</div>
  }

  const scheduledVideos = await getScheduledVideos(creator.unique_identifier)

  // Group by date
  const groupedByDate = scheduledVideos.reduce((acc, video) => {
    if (!video.scheduled_at) return acc
    const date = format(new Date(video.scheduled_at), 'yyyy-MM-dd')
    if (!acc[date]) acc[date] = []
    acc[date].push(video)
    return acc
  }, {} as Record<string, typeof scheduledVideos>)

  return (
    <div className="space-y-8">
      <div className="mb-8">
        <h1 className="text-4xl font-extrabold mb-2 text-white">Schedule</h1>
        <p className="text-white/70 text-sm uppercase tracking-[0.4em]">
          Manage your scheduled posts and publishing calendar
        </p>
      </div>

      {scheduledVideos.length === 0 ? (
        <Card className="bg-white/5 border-white/10">
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <Calendar className="h-12 w-12 text-white/30 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2 text-white">No scheduled posts</h3>
              <p className="text-white/70 mb-4">
                Schedule your first post to get started
              </p>
              <Link href="/upload">
                <Button className="bg-[#89CFF0] text-black hover:bg-[#89CFF0]/90">Upload Content</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedByDate)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([date, videos]) => (
              <div key={date}>
                <h2 className="text-xl font-semibold mb-4 text-white">
                  {format(new Date(date), 'EEEE, MMMM d, yyyy')}
                </h2>
                <div className="space-y-3">
                  {videos.map((video) => (
                    <Card key={video.id} className="bg-white/5 border-white/10 hover:bg-white/10 transition-colors">
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="font-semibold text-lg text-white">{video.title}</h3>
                              <Badge
                                variant={
                                  video.status === 'scheduled' ? 'primary' : 'default'
                                }
                                className="bg-[#89CFF0]/20 text-[#89CFF0] border-[#89CFF0]/30"
                              >
                                {video.status}
                              </Badge>
                              <Badge variant="outline" className="bg-white/10 text-white/70 border-white/20">{video.platform_target}</Badge>
                            </div>
                            {video.description && (
                              <p className="text-sm text-white/70 mb-3">
                                {video.description}
                              </p>
                            )}
                            <div className="flex items-center gap-4 text-sm text-white/50">
                              <div className="flex items-center gap-1">
                                <Clock className="h-4 w-4" />
                                {video.scheduled_at &&
                                  format(new Date(video.scheduled_at), 'h:mm a')}
                              </div>
                              <div className="flex items-center gap-1">
                                <Calendar className="h-4 w-4" />
                                {video.source_type === 'ai_generated'
                                  ? 'AI Generated'
                                  : 'UGC'}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button variant="outline" size="sm" className="bg-white/10 text-white hover:bg-white/20 border-white/10">
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </Button>
                            <PlatformSelectButton 
                              videoId={video.id} 
                              creatorUniqueIdentifier={creator.unique_identifier}
                            />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
        </div>
      )}
    </div>
  )
}

