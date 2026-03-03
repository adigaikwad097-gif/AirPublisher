import { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { PostNowButton } from '@/components/videos/post-now-button'
import { ScheduleButton } from '@/components/videos/schedule-button'
import { Plus, Trash2, Loader2, MoreVertical, Play, Youtube, Instagram, Facebook, Upload } from 'lucide-react'
import { Link } from 'react-router-dom'
import { getVideosByCreator } from '@/lib/db/videos'
import { getVideoPlaybackUrl } from '@/lib/utils/video-url'
import { getCreatorId } from '@/lib/auth/session'
import { supabase } from '@/lib/supabase/client'
import { useModal } from '@/components/providers/modal-provider'

interface Video {
    id: string
    title: string
    description: string | null
    thumbnail_url: string | null
    video_url: string | null
    platform_target: string
    status: string
    views?: number
    created_at: string
    posted_at: string | null
    scheduled_at: string | null
    creator_unique_identifier: string
    error_message: string | null
}

export default function VideosPage() {
    const [videos, setVideos] = useState<Video[]>([])
    const [loading, setLoading] = useState(true)
    const [isDeleting, setIsDeleting] = useState<string | null>(null)
    const [activeTab, setActiveTab] = useState('draft')
    const { showConfirm } = useModal()

    const refreshVideos = async (switchToPublished?: boolean) => {
        try {
            const profileId = getCreatorId()
            if (!profileId) return
            const data = await getVideosByCreator(profileId)
            setVideos(data || [])
            if (switchToPublished) setActiveTab('published')
        } catch (error) {
            console.error('Error refreshing videos:', error)
        }
    }

    const handleDelete = async (videoId: string, creatorId: string, videoStatus: string) => {
        const isPosted = videoStatus === 'posted'
        const confirmed = await showConfirm({
            title: 'Delete Video',
            message: isPosted
                ? 'This will delete the video from AirPublisher only. It will NOT be removed from the platform it was posted to (e.g. Instagram, YouTube, Facebook). You\'ll need to delete it directly on that platform. Continue?'
                : 'Are you sure you want to delete this video? This action cannot be undone.',
            confirmLabel: 'Delete',
            variant: 'danger'
        });

        if (!confirmed) return;

        setIsDeleting(videoId);
        try {
            const { error } = await supabase.functions.invoke('delete-video', {
                body: { videoId, creatorUniqueIdentifier: creatorId }
            });

            if (error) throw error;

            setVideos(prev => prev.filter(v => v.id !== videoId));
        } catch (error) {
            console.error('Failed to delete video:', error);
            alert('Failed to delete video. Please try again.');
        } finally {
            setIsDeleting(null);
        }
    }

    useEffect(() => {
        async function fetchVideos() {
            try {
                const profileId = getCreatorId()
                if (!profileId) return

                const data = await getVideosByCreator(profileId)
                setVideos(data || [])
            } catch (error) {
                console.error('Error fetching videos:', error)
            } finally {
                setLoading(false)
            }
        }
        fetchVideos()
    }, [])

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

    const getStatusConfig = (status: string) => {
        const configs: Record<string, { dot: string; label: string }> = {
            draft:      { dot: 'bg-white/30',    label: 'Draft' },
            scheduled:  { dot: 'bg-primary',   label: 'Scheduled' },
            processing: { dot: 'bg-amber-400',   label: 'Processing' },
            posted:     { dot: 'bg-green-500',   label: 'Posted' },
            failed:     { dot: 'bg-red-500',     label: 'Failed' },
        }
        return configs[status] || { dot: 'bg-white/30', label: status }
    }

    if (loading) {
        return (
            <div className="space-y-8">
                <Card>
                    <CardContent className="pt-6">
                        <div className="text-center py-12">
                            <p className="text-foreground/70">Loading videos...</p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        )
    }

    const draftVideos = videos.filter(v => ['draft', 'scheduled', 'processing', 'failed'].includes(v.status))
    const publishedVideos = videos.filter(v => v.status === 'posted')

    const VideoContextMenu = ({ video, handleDelete, isDeleting, onPostSuccess, onScheduleSuccess }: { video: Video, handleDelete: (id: string, creatorId: string, status: string) => void, isDeleting: string | null, onPostSuccess?: () => void, onScheduleSuccess?: () => void }) => {
        const [isOpen, setIsOpen] = useState(false);

        return (
            <div className="relative">
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => setIsOpen(!isOpen)}>
                    <MoreVertical className="h-4 w-4" />
                </Button>

                {isOpen && (
                    <>
                        <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
                        <div className="absolute right-8 top-0 w-48 rounded-md shadow-xl bg-[#0a0a0f] border border-white/10 ring-1 ring-black ring-opacity-5 z-50 p-1 flex flex-col gap-1">
                            {['draft', 'failed', 'scheduled'].includes(video.status) && (
                                <>
                                    <PostNowButton
                                        videoId={video.id}
                                        creatorUniqueIdentifier={video.creator_unique_identifier}
                                        videoTitle={video.title}
                                        videoDescription={video.description || ''}
                                        thumbnailUrl={video.thumbnail_url}
                                        variant="ghost"
                                        className="w-full justify-start font-normal px-2 py-1.5 h-auto text-sm"
                                        onSuccess={onPostSuccess}
                                    />
                                    <ScheduleButton
                                        videoId={video.id}
                                        creatorUniqueIdentifier={video.creator_unique_identifier}
                                        videoTitle={video.title}
                                        videoDescription={video.description || ''}
                                        thumbnailUrl={video.thumbnail_url}
                                        variant="ghost"
                                        className="w-full justify-start font-normal px-2 py-1.5 h-auto text-sm"
                                        onSuccess={onScheduleSuccess}
                                    />
                                    <div className="h-px bg-white/10 my-1" />
                                </>
                            )}
                            <Button
                                variant="ghost"
                                className="w-full justify-start font-normal px-2 py-1.5 h-auto text-sm text-red-500 hover:text-red-400 hover:bg-red-500/10"
                                onClick={() => {
                                    setIsOpen(false);
                                    handleDelete(video.id, video.creator_unique_identifier, video.status);
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
        );
    }

    const VideoCard = ({ video, isDraftTab }: { video: Video, isDraftTab?: boolean }) => {
        const [isPlaying, setIsPlaying] = useState(false)
        const statusConfig = getStatusConfig(video.status)

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
                        <VideoContextMenu
                            video={video}
                            handleDelete={handleDelete}
                            isDeleting={isDeleting}
                            onPostSuccess={() => refreshVideos(true)}
                            onScheduleSuccess={() => refreshVideos()}
                        />
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

                    {/* Status + date */}
                    <div className="flex items-center gap-1.5">
                        <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${statusConfig.dot} ${video.status === 'processing' ? 'animate-pulse' : ''}`} />
                        <span className={`text-[11px] font-medium ${video.status === 'failed' ? 'text-red-400' : video.status === 'posted' ? 'text-success' : video.status === 'scheduled' ? 'text-primary' : 'text-white/40'}`}>
                            {statusConfig.label}
                        </span>
                        <span className="text-white/15 text-[11px]">·</span>
                        <span className="text-[11px] text-white/30">
                            {(() => {
                                const fmt = (d: string) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                                if (video.status === 'posted' && video.posted_at) return fmt(video.posted_at)
                                if (video.status === 'scheduled' && video.scheduled_at) {
                                    return new Date(video.scheduled_at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
                                }
                                return fmt(video.created_at)
                            })()}
                        </span>
                    </div>

                    {/* Error message for failed videos */}
                    {video.status === 'failed' && video.error_message && (
                        <p className="text-[11px] text-red-400/70 line-clamp-2 mt-0.5" title={video.error_message}>
                            {video.error_message}
                        </p>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-4xl font-bold text-white tracking-tight">My Videos</h1>
                    <p className="text-lg text-white/50 mt-3">Manage and publish your videos</p>
                </div>
                <Link to="/upload">
                    <Button>
                        <Upload className="mr-2 h-4 w-4" />
                        Upload Content
                    </Button>
                </Link>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} defaultValue="draft" className="w-full">
                <TabsList>
                    <TabsTrigger value="draft">Drafts ({draftVideos.length})</TabsTrigger>
                    <TabsTrigger value="published">Published ({publishedVideos.length})</TabsTrigger>
                </TabsList>

                <TabsContent value="draft">
                    {draftVideos.length === 0 ? (
                        <div className="text-center py-20 text-white/30">
                            <p className="mb-4 text-lg">No videos yet</p>
                            <Link to="/upload">
                                <Button className="bg-primary text-background hover:bg-primary-dark">Upload a Video</Button>
                            </Link>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                            {draftVideos.map((video) => <VideoCard key={video.id} video={video} isDraftTab={true} />)}
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="published">
                    {publishedVideos.length === 0 ? (
                        <div className="text-center py-20 text-white/30">
                            <p className="text-lg">No published videos yet</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                            {publishedVideos.map((video) => <VideoCard key={video.id} video={video} />)}
                        </div>
                    )}
                </TabsContent>
            </Tabs>
        </div>
    )
}
