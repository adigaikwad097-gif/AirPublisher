import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Calendar, Clock, Edit } from 'lucide-react'
import { getCurrentCreator } from '@/lib/db/creator'
import { getScheduledVideos } from '@/lib/db/videos'
import { format } from 'date-fns'
import { Link } from 'react-router-dom'
import { PlatformSelectButton } from '@/components/videos/platform-select-button'

export function SchedulePage() {
    const [creator, setCreator] = useState<any>(null)
    const [scheduledVideos, setScheduledVideos] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        async function loadData() {
            try {
                const currentCreator = await getCurrentCreator()
                if (!currentCreator) {
                    setError('Please complete your creator profile')
                    setIsLoading(false)
                    return
                }
                setCreator(currentCreator)

                const videos = await getScheduledVideos(currentCreator.unique_identifier)
                setScheduledVideos(videos || [])
            } catch (err) {
                console.error('Failed to load schedule:', err)
                setError('Failed to load schedule')
            } finally {
                setIsLoading(false)
            }
        }

        loadData()
    }, [])

    if (isLoading) {
        return (
            <div className="flex h-[50vh] items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#89CFF0] border-t-transparent"></div>
            </div>
        )
    }

    if (error || !creator) {
        return (
            <div className="flex flex-col items-center justify-center h-[50vh] space-y-4">
                <div className="text-red-400 font-medium">{error || 'Please complete your creator profile'}</div>
            </div>
        )
    }

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
                <h1 className="text-3xl font-bold mb-2 text-white">Schedule</h1>
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
                            <Link to="/upload">
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
                                    {(videos as typeof scheduledVideos).map((video) => (
                                        <Card key={video.id} className="bg-white/5 border-white/10 hover:bg-white/10 transition-colors">
                                            <CardContent className="pt-6">
                                                <div className="flex items-start justify-between">
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-3 mb-2">
                                                            <h3 className="font-semibold text-lg text-white">{video.title}</h3>
                                                            <Badge
                                                                variant={
                                                                    video.status === 'posted' ? 'primary' : 'default'
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
                                                                {video.source_type === 'ugc' ? 'UGC' : 'Video'}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="flex flex-wrap items-center justify-end gap-2">
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
