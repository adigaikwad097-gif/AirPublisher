import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Calendar, MoreVertical, Trash2, Loader2, Play, Youtube, Instagram, Facebook, Upload } from 'lucide-react'
import { PostNowButton } from '@/components/videos/post-now-button'
import { ScheduleButton } from '@/components/videos/schedule-button'
import { getScheduledVideos } from '@/lib/db/videos'
import { getCreatorId } from '@/lib/auth/session'
import { getVideoPlaybackUrl } from '@/lib/utils/video-url'
import { supabase } from '@/lib/supabase/client'
import { useModal } from '@/components/providers/modal-provider'
import { format } from 'date-fns'
import { Link } from 'react-router-dom'

interface Video {
    id: string
    title: string
    description: string | null
    thumbnail_url: string | null
    video_url: string | null
    platform_target: string
    status: string
    scheduled_at: string | null
    created_at: string
    creator_unique_identifier: string
}

export function SchedulePage() {
    const [scheduledVideos, setScheduledVideos] = useState<Video[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [isDeleting, setIsDeleting] = useState<string | null>(null)
    const { showConfirm } = useModal()

    const creatorId = getCreatorId()

    const refreshVideos = async () => {
        if (!creatorId) return
        try {
            const videos = await getScheduledVideos(creatorId)
            setScheduledVideos(videos || [])
        } catch (err) {
            console.error('Error refreshing scheduled videos:', err)
        }
    }

    useEffect(() => {
        async function loadData() {
            try {
                if (!creatorId) {
                    setError('Please complete your creator profile')
                    setIsLoading(false)
                    return
                }

                const videos = await getScheduledVideos(creatorId)
                setScheduledVideos(videos || [])
            } catch (err) {
                console.error('Failed to load schedule:', err)
                setError('Failed to load schedule')
            } finally {
                setIsLoading(false)
            }
        }

        loadData()
    }, [creatorId])

    const handleDelete = async (videoId: string, creatorUniqueId: string) => {
        const confirmed = await showConfirm({
            title: 'Delete Scheduled Video',
            message: 'Are you sure you want to delete this scheduled video? This action cannot be undone.',
            confirmLabel: 'Delete',
            variant: 'danger'
        })

        if (!confirmed) return

        setIsDeleting(videoId)
        try {
            const { error } = await supabase.functions.invoke('delete-video', {
                body: { videoId, creatorUniqueIdentifier: creatorUniqueId }
            })

            if (error) throw error

            setScheduledVideos(prev => prev.filter(v => v.id !== videoId))
        } catch (error) {
            console.error('Failed to delete video:', error)
            alert('Failed to delete video. Please try again.')
        } finally {
            setIsDeleting(null)
        }
    }

    const getPlatformIcon = (platform: string) => {
        const cls = "h-3.5 w-3.5"
        if (platform === 'youtube') return <Youtube className={cls} style={{ color: '#FF0000' }} />
        if (platform === 'instagram') return <Instagram className={cls} style={{ color: '#E1306C' }} />
        if (platform === 'facebook') return <Facebook className={cls} style={{ color: '#1877F2' }} />
        return null
    }

    const getPlatformLabel = (platform: string) => {
        if (platform === 'youtube') return 'YouTube'
        if (platform === 'instagram') return 'Instagram'
        if (platform === 'facebook') return 'Facebook'
        return platform
    }

    if (isLoading) {
        return (
            <div className="flex h-[50vh] items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
            </div>
        )
    }

    if (error || !creatorId) {
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
    }, {} as Record<string, Video[]>)

    const VideoContextMenu = ({ video }: { video: Video }) => {
        const [isOpen, setIsOpen] = useState(false)

        return (
            <div className="relative">
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => setIsOpen(!isOpen)}>
                    <MoreVertical className="h-4 w-4" />
                </Button>

                {isOpen && (
                    <>
                        <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
                        <div className="absolute right-8 top-0 w-48 rounded-md shadow-xl bg-[#0a0a0f] border border-white/10 ring-1 ring-black ring-opacity-5 z-50 p-1 flex flex-col gap-1">
                            <PostNowButton
                                videoId={video.id}
                                creatorUniqueIdentifier={video.creator_unique_identifier}
                                videoTitle={video.title}
                                videoDescription={video.description || ''}
                                thumbnailUrl={video.thumbnail_url}
                                variant="ghost"
                                className="w-full justify-start font-normal px-2 py-1.5 h-auto text-sm"
                                onSuccess={() => refreshVideos()}
                            />
                            <ScheduleButton
                                videoId={video.id}
                                creatorUniqueIdentifier={video.creator_unique_identifier}
                                videoTitle={video.title}
                                videoDescription={video.description || ''}
                                thumbnailUrl={video.thumbnail_url}
                                variant="ghost"
                                className="w-full justify-start font-normal px-2 py-1.5 h-auto text-sm"
                                onSuccess={() => refreshVideos()}
                            />
                            <div className="h-px bg-white/10 my-1" />
                            <Button
                                variant="ghost"
                                className="w-full justify-start font-normal px-2 py-1.5 h-auto text-sm text-red-500 hover:text-red-400 hover:bg-red-500/10"
                                onClick={() => {
                                    setIsOpen(false)
                                    handleDelete(video.id, video.creator_unique_identifier)
                                }}
                                disabled={isDeleting === video.id}
                            >
                                {isDeleting === video.id ? (
                                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                ) : (
                                    <Trash2 className="h-4 w-4 mr-2" />
                                )}
                                Delete Video
                            </Button>
                        </div>
                    </>
                )}
            </div>
        )
    }

    const VideoCard = ({ video }: { video: Video }) => {
        const [isPlaying, setIsPlaying] = useState(false)

        return (
            <div className="flex flex-col relative bg-card border border-border/20 hover:border-border/40 transition-all duration-200 rounded-xl overflow-visible group">
                {/* Square Thumbnail */}
                <div className="w-full aspect-square bg-black/60 relative flex-shrink-0 rounded-t-xl overflow-hidden">
                    {isPlaying && video.video_url ? (
                        <video
                            src={getVideoPlaybackUrl(video.video_url)}
                            controls
                            autoPlay
                            className="w-full h-full object-contain bg-black"
                        >
                            <source src={getVideoPlaybackUrl(video.video_url)} type="video/mp4" />
                        </video>
                    ) : video.thumbnail_url ? (
                        <div
                            className="w-full h-full relative cursor-pointer"
                            onClick={() => video.video_url && setIsPlaying(true)}
                        >
                            <img
                                src={video.thumbnail_url}
                                alt={video.title}
                                className="object-cover w-full h-full"
                                loading="lazy"
                            />
                            {video.video_url && (
                                <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/20 transition-colors duration-200">
                                    <div className="w-10 h-10 bg-black/60 backdrop-blur-md rounded-full flex items-center justify-center scale-90 opacity-0 group-hover:opacity-100 group-hover:scale-100 transition-all duration-200">
                                        <Play className="h-4 w-4 text-white ml-0.5" fill="white" />
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : video.video_url ? (
                        <div
                            className="w-full h-full cursor-pointer flex items-center justify-center bg-gradient-to-br from-[#16161e] to-[#0c0c12]"
                            onClick={() => setIsPlaying(true)}
                        >
                            <div className="w-10 h-10 bg-white/[0.06] rounded-full flex items-center justify-center border border-white/10">
                                <Play className="h-4 w-4 text-white/60 ml-0.5" fill="currentColor" />
                            </div>
                        </div>
                    ) : (
                        <div className="w-full h-full flex items-center justify-center bg-white/[0.02]">
                            <span className="text-white/15 text-base">No preview</span>
                        </div>
                    )}

                    {/* Platform pill — top left */}
                    {video.platform_target && video.platform_target !== 'internal' && (
                        <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 bg-black/60 backdrop-blur-md px-2 py-1 rounded-md">
                            {getPlatformIcon(video.platform_target)}
                            <span className="text-[11px] font-medium text-white/70">{getPlatformLabel(video.platform_target)}</span>
                        </div>
                    )}

                    {/* ••• Menu — top right, visible on hover */}
                    <div className="absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                        <VideoContextMenu video={video} />
                    </div>
                </div>

                {/* Card Body */}
                <div className="px-3.5 py-3 flex flex-col gap-1.5">
                    {/* Title */}
                    <Link to={`/videos/${video.id}`} className="min-w-0">
                        <h3 className="text-lg font-medium text-white leading-snug line-clamp-2 hover:text-white/80 transition-colors" title={video.title}>
                            {video.title}
                        </h3>
                    </Link>

                    {/* Status + scheduled time */}
                    <div className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full flex-shrink-0 bg-primary" />
                        <span className="text-[11px] font-medium text-primary">Scheduled</span>
                        <span className="text-white/15 text-[11px]">&middot;</span>
                        <span className="text-[11px] text-white/30">
                            {video.scheduled_at &&
                                new Date(video.scheduled_at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
                            }
                        </span>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-4xl font-bold text-white tracking-tight">Schedule</h1>
                    <p className="text-lg text-white/50 mt-3">Manage your scheduled posts and publishing calendar</p>
                </div>
                <Link to="/upload">
                    <Button>
                        <Upload className="mr-2 h-4 w-4" />
                        Upload Content
                    </Button>
                </Link>
            </div>

            {scheduledVideos.length === 0 ? (
                <div className="text-center py-20 text-white/30">
                    <Calendar className="h-12 w-12 mx-auto mb-4 opacity-30" />
                    <p className="mb-4 text-lg">No scheduled posts</p>
                    <Link to="/upload">
                        <Button className="bg-primary text-background hover:bg-primary-dark">Upload Content</Button>
                    </Link>
                </div>
            ) : (
                <div className="space-y-8">
                    {Object.entries(groupedByDate)
                        .sort(([a], [b]) => a.localeCompare(b))
                        .map(([date, videos]) => (
                            <div key={date}>
                                <h2 className="text-2xl font-semibold mb-4 text-white/70">
                                    {format(new Date(date), 'EEEE, MMMM d, yyyy')}
                                </h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                                    {videos.map((video) => (
                                        <VideoCard key={video.id} video={video} />
                                    ))}
                                </div>
                            </div>
                        ))}
                </div>
            )}
        </div>
    )
}
