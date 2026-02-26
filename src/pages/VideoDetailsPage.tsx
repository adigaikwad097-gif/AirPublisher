import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Eye, Calendar, ArrowLeft, Play } from 'lucide-react'
import { formatNumber } from '@/lib/utils'
import { getVideoPlaybackUrl } from '@/lib/utils/video-url'
import { getVideoById, incrementVideoViews } from '@/lib/db/videos'
import { getCreatorProfile } from '@/lib/db/creator'

interface Video {
    id: string
    title: string
    description: string | null
    video_url: string | null
    thumbnail_url: string | null
    creator_unique_identifier: string
    platform_target: string
    source_type: string
    status: string
    views?: number
    created_at: string
    posted_at: string | null
}

interface Creator {
    unique_identifier: string
    display_name: string | null
    avatar_url: string | null
    niche: string | null
}

export function VideoDetailsPage() {
    const params = useParams()
    const videoId = params.id as string
    const [video, setVideo] = useState<Video | null>(null)
    const [creator, setCreator] = useState<Creator | null>(null)
    const [loading, setLoading] = useState(true)
    const [viewTracked, setViewTracked] = useState(false)
    const [videoError, setVideoError] = useState<string | null>(null)

    useEffect(() => {
        if (!videoId) return

        console.log('[VideoWatchPage] Fetching video:', videoId)

        // Fetch video details directly
        getVideoById(videoId)
            .then((videoData) => {
                console.log('[VideoWatchPage] Video data received:', videoData)
                if (videoData) {
                    setVideo(videoData)
                    // Fetch creator profile directly
                    getCreatorProfile(videoData.creator_unique_identifier)
                        .then((creatorData) => {
                            if (creatorData) {
                                setCreator(creatorData)
                            }
                        })
                        .catch((err) => {
                            console.error('[VideoWatchPage] Error fetching creator:', err)
                        })
                } else {
                    console.warn('[VideoWatchPage] No video in response')
                }
                setLoading(false)
            })
            .catch((error) => {
                console.error('[VideoWatchPage] Error fetching video:', error)
                setLoading(false)
            })

        // Track view (only once per page load) using Supabase DB directly
        if (!viewTracked) {
            incrementVideoViews(videoId)
                .then((updatedVideo) => {
                    if (updatedVideo && video) {
                        setVideo({ ...video, views: updatedVideo.views || 0 })
                    }
                    setViewTracked(true)
                })
                .catch(console.error)
        }
    }, [videoId, viewTracked, video?.id]) // Be careful with dependencies to avoid infinite loops

    if (loading) {
        return (
            <div className="space-y-8">
                <Card>
                    <CardContent className="pt-6">
                        <div className="text-center py-12">
                            <p className="text-foreground/70">Loading video...</p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        )
    }

    if (!video) {
        return (
            <div className="space-y-8">
                <Card>
                    <CardContent className="pt-6">
                        <div className="text-center py-12">
                            <p className="text-foreground/70 mb-4">Video not found</p>
                            <Link to="/discover">
                                <Button variant="outline">Back to Discover</Button>
                            </Link>
                        </div>
                    </CardContent>
                </Card>
            </div>
        )
    }

    return (
        <div className="space-y-8">
            <div className="flex items-center gap-4">
                <Link to="/discover">
                    <Button variant="outline" size="sm">
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back
                    </Button>
                </Link>
                <h1 className="text-3xl font-bold">{video.title}</h1>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Video Player */}
                <div className="lg:col-span-2 space-y-4">
                    <Card>
                        <CardContent className="p-0">
                            {video.video_url ? (
                                <div className="relative w-full aspect-video bg-black rounded-t-lg overflow-hidden">
                                    {videoError ? (
                                        <div className="w-full h-full flex flex-col items-center justify-center text-foreground/70">
                                            <p className="text-lg mb-2">Failed to load video</p>
                                            <p className="text-sm">{videoError}</p>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="mt-4"
                                                onClick={() => {
                                                    setVideoError(null)
                                                    // Force video reload
                                                    const videoElement = document.querySelector('video') as HTMLVideoElement
                                                    if (videoElement) {
                                                        videoElement.load()
                                                    }
                                                }}
                                            >
                                                Retry
                                            </Button>
                                        </div>
                                    ) : (
                                        <video
                                            src={getVideoPlaybackUrl(video.video_url)}
                                            controls
                                            className="w-full h-full"
                                            poster={video.thumbnail_url || undefined}
                                            preload="metadata"
                                            onError={(e) => {
                                                console.error('[VideoPlayer] Video load error:', e)
                                                const videoElement = e.currentTarget
                                                const error = videoElement.error
                                                let errorMessage = 'Failed to load video'
                                                if (error) {
                                                    switch (error.code) {
                                                        case error.MEDIA_ERR_ABORTED:
                                                            errorMessage = 'Video loading was aborted'
                                                            break
                                                        case error.MEDIA_ERR_NETWORK:
                                                            errorMessage = 'Network error while loading video'
                                                            break
                                                        case error.MEDIA_ERR_DECODE:
                                                            errorMessage = 'Video decoding error'
                                                            break
                                                        case error.MEDIA_ERR_SRC_NOT_SUPPORTED:
                                                            errorMessage = 'Video format not supported'
                                                            break
                                                        default:
                                                            errorMessage = `Video error: ${error.message || 'Unknown error'}`
                                                    }
                                                }
                                                setVideoError(errorMessage)
                                            }}
                                            onLoadStart={() => {
                                                console.log('[VideoPlayer] Video loading started')
                                                setVideoError(null)
                                            }}
                                            onCanPlay={() => {
                                                console.log('[VideoPlayer] Video can play')
                                                setVideoError(null)
                                            }}
                                        >
                                            <source src={getVideoPlaybackUrl(video.video_url)} type="video/mp4" />
                                            Your browser does not support the video tag.
                                        </video>
                                    )}
                                </div>
                            ) : video.thumbnail_url ? (
                                <div className="relative w-full aspect-video bg-black rounded-t-lg overflow-hidden">
                                    <img
                                        src={video.thumbnail_url}
                                        alt={video.title}
                                        className="object-contain w-full h-full"
                                    />
                                </div>
                            ) : (
                                <div className="w-full aspect-video bg-card-elevated flex items-center justify-center">
                                    <Play className="h-16 w-16 text-foreground/30" />
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    {creator?.avatar_url ? (
                                        <img
                                            src={creator.avatar_url}
                                            alt={creator.display_name || ''}
                                            width={48}
                                            height={48}
                                            className="rounded-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                                            <span className="text-lg text-primary">
                                                {creator?.display_name?.charAt(0).toUpperCase() || '?'}
                                            </span>
                                        </div>
                                    )}
                                    <div>
                                        <Link to={`/creator/${creator?.unique_identifier || video.creator_unique_identifier}`}>
                                            <h3 className="font-semibold text-lg hover:text-primary transition-colors">
                                                {creator?.display_name || 'Unknown Creator'}
                                            </h3>
                                        </Link>
                                        {creator?.niche && (
                                            <p className="text-sm text-foreground/60">{creator.niche}</p>
                                        )}
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Badge variant="outline">{video.platform_target}</Badge>
                                    <Badge variant="outline">{video.source_type === 'ugc' ? 'UGC' : 'Video'}</Badge>
                                </div>
                            </div>

                            {video.description && (
                                <div className="mb-4">
                                    <p className="text-foreground/80 whitespace-pre-wrap">{video.description}</p>
                                </div>
                            )}

                            <div className="flex items-center gap-6 text-sm text-foreground/60 pt-4 border-t border-border">
                                <div className="flex items-center gap-2">
                                    <Eye className="h-4 w-4" />
                                    <span>{formatNumber(video.views || 0)} views</span>
                                </div>
                                {video.created_at && (
                                    <div className="flex items-center gap-2">
                                        <Calendar className="h-4 w-4" />
                                        <span>Posted {new Date(video.created_at).toLocaleDateString()}</span>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Sidebar Info */}
                <div className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Video Details</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div>
                                <p className="text-sm text-foreground/60 mb-1">Status</p>
                                <Badge
                                    variant={
                                        video.status === 'posted'
                                            ? 'primary'
                                            : video.status === 'scheduled'
                                                ? 'default'
                                                : 'default'
                                    }
                                >
                                    {video.status}
                                </Badge>
                            </div>
                            <div>
                                <p className="text-sm text-foreground/60 mb-1">Platform</p>
                                <p className="font-medium capitalize">{video.platform_target}</p>
                            </div>
                            <div>
                                <p className="text-sm text-foreground/60 mb-1">Source Type</p>
                                <p className="font-medium">{video.source_type === 'ugc' ? 'UGC' : 'Video'}</p>
                            </div>
                            {video.posted_at && (
                                <div>
                                    <p className="text-sm text-foreground/60 mb-1">Posted At</p>
                                    <p className="font-medium">{new Date(video.posted_at).toLocaleString()}</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
