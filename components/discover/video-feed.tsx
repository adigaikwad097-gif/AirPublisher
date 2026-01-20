'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Eye, Calendar, Clock, TrendingUp, Sparkles } from 'lucide-react'
import Image from 'next/image'
import { formatNumber } from '@/lib/utils'
import { getVideoStreamUrl } from '@/lib/utils/dropbox-url'
import { VideoActions } from './video-actions'

// Video component with auto-play on scroll
function AutoPlayVideo({ src, title, videoId }: { src: string; title: string; videoId: string }) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            // Video is in viewport - play it
            video.play().catch(() => {
              // Autoplay might be blocked, that's okay
            })
            setIsPlaying(true)
          } else {
            // Video is out of viewport - pause it
            video.pause()
            setIsPlaying(false)
          }
        })
      },
      {
        threshold: 0.5, // Play when 50% of video is visible
      }
    )

    observer.observe(video)

    return () => {
      observer.disconnect()
    }
  }, [])

  // Use streaming proxy for Dropbox videos to bypass CORS
  const streamUrl = getVideoStreamUrl(videoId)

  return (
    <video
      ref={videoRef}
      src={streamUrl}
      className="w-full h-full object-contain"
      preload="metadata"
      muted
      playsInline
      loop
      onMouseEnter={() => {
        if (videoRef.current && !isPlaying) {
          videoRef.current.play().catch(() => {})
        }
      }}
      onMouseLeave={() => {
        if (videoRef.current && isPlaying) {
          videoRef.current.pause()
        }
      }}
    >
      <source src={streamUrl} type="video/mp4" />
      Your browser does not support the video tag.
    </video>
  )
}

type Video = {
  id: string
  title: string
  description: string | null
  video_url: string | null
  thumbnail_url: string | null
  status: string
  platform_target: string
  source_type: string
  views: number
  created_at: string
  posted_at: string | null
  creator_unique_identifier: string
  creator: {
    unique_identifier: string
    display_name: string
    avatar_url: string | null
    niche: string | null
  }
}

type FilterType = 'latest' | 'top' | 'trending'

interface VideoFeedProps {
  initialVideos: Video[]
  initialFilter: FilterType
}

export function VideoFeed({ initialVideos, initialFilter }: VideoFeedProps) {
  const [videos, setVideos] = useState<Video[]>(initialVideos)
  const [filter, setFilter] = useState<FilterType>(initialFilter)
  const [loading, setLoading] = useState(false)
  const [hasMore, setHasMore] = useState(initialVideos.length >= 20)
  const [page, setPage] = useState(1)
  const observerTarget = useRef<HTMLDivElement>(null)

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return

    setLoading(true)
    try {
      const nextPage = page + 1
      const response = await fetch(`/api/discover?filter=${filter}&page=${nextPage}`)
      const data = await response.json()

      if (data.videos && data.videos.length > 0) {
        setVideos((prev) => [...prev, ...data.videos])
        setPage(nextPage)
        setHasMore(data.videos.length >= 20)
      } else {
        setHasMore(false)
      }
    } catch (error) {
      console.error('Failed to load more videos:', error)
      setHasMore(false)
    } finally {
      setLoading(false)
    }
  }, [filter, page, loading, hasMore])

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          loadMore()
        }
      },
      { threshold: 0.1 }
    )

    const currentTarget = observerTarget.current
    if (currentTarget) {
      observer.observe(currentTarget)
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget)
      }
    }
  }, [loadMore, hasMore, loading])

  const handleFilterChange = async (newFilter: FilterType) => {
    if (newFilter === filter) return

    setFilter(newFilter)
    setLoading(true)
    setPage(1)
    setHasMore(true)

    try {
      const response = await fetch(`/api/discover?filter=${newFilter}&page=1`)
      const data = await response.json()
      setVideos(data.videos || [])
      setHasMore((data.videos?.length || 0) >= 20)
    } catch (error) {
      console.error('Failed to load videos:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Filter Buttons */}
      <div className="flex items-center gap-3 overflow-x-auto pb-2">
        <Button
          variant={filter === 'latest' ? 'default' : 'outline'}
          onClick={() => handleFilterChange('latest')}
          className="whitespace-nowrap"
        >
          <Clock className="h-4 w-4 mr-2" />
          Latest
        </Button>
        <Button
          variant={filter === 'top' ? 'default' : 'outline'}
          onClick={() => handleFilterChange('top')}
          className="whitespace-nowrap"
        >
          <TrendingUp className="h-4 w-4 mr-2" />
          Top
        </Button>
        <Button
          variant={filter === 'trending' ? 'default' : 'outline'}
          onClick={() => handleFilterChange('trending')}
          className="whitespace-nowrap"
        >
          <Sparkles className="h-4 w-4 mr-2" />
          Trending
        </Button>
      </div>

      {/* Video Feed - LinkedIn Style */}
      <div className="space-y-4">
        {videos.map((video) => {
          return (
            <Card key={video.id} className="hover:bg-card-hover transition-all">
              <CardContent className="p-4">
                {/* Creator Info - Top Left */}
                <div className="flex items-center gap-3 mb-3">
                  <Link href={`/creator/${video.creator.unique_identifier}`} onClick={(e) => e.stopPropagation()}>
                    {video.creator.avatar_url ? (
                      <Image
                        src={video.creator.avatar_url}
                        alt={video.creator.display_name}
                        width={48}
                        height={48}
                        className="rounded-full"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                        <span className="text-lg text-primary font-semibold">
                          {video.creator.display_name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                  </Link>
                  <div className="flex-1 min-w-0">
                    <Link href={`/creator/${video.creator.unique_identifier}`} onClick={(e) => e.stopPropagation()}>
                      <p className="font-semibold text-foreground hover:text-primary transition-colors">
                        {video.creator.display_name}
                      </p>
                    </Link>
                    <div className="flex items-center gap-2 mt-1">
                      {video.creator.niche && (
                        <Badge variant="outline" className="text-xs">
                          {video.creator.niche}
                        </Badge>
                      )}
                      {video.posted_at && (
                        <span className="text-xs text-foreground/60">
                          {new Date(video.posted_at).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Title and Description */}
                <Link href={`/videos/${video.id}`}>
                  <div className="mb-3">
                    <h3 className="font-semibold text-lg mb-2 hover:text-primary transition-colors">
                      {video.title}
                    </h3>
                    {video.description && (
                      <p className="text-sm text-foreground/70 line-clamp-3">
                        {video.description}
                      </p>
                    )}
                  </div>
                </Link>

                {/* Video - Auto-play on scroll */}
                <Link href={`/videos/${video.id}`}>
                  <div className="relative w-full rounded-lg overflow-hidden bg-black aspect-video group">
                    {video.video_url ? (
                      <AutoPlayVideo src={video.video_url} title={video.title} videoId={video.id} />
                    ) : video.thumbnail_url ? (
                      <Image
                        src={video.thumbnail_url}
                        alt={video.title}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, 800px"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center bg-muted">
                        <span className="text-foreground/50 text-sm">No video available</span>
                      </div>
                    )}
                  </div>
                </Link>

                {/* Stats and Actions - Bottom */}
                <div className="mt-3 pt-3 border-t border-border space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 text-sm text-foreground/60">
                      <div className="flex items-center gap-1">
                        <Eye className="h-4 w-4" />
                        <span>{formatNumber(video.views || 0)}</span>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {video.platform_target}
                      </Badge>
                    </div>
                  </div>
                  
                  {/* Like and Comment Actions */}
                  <VideoActions videoId={video.id} />
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Loading Indicator */}
      {loading && (
        <div className="text-center py-8 text-foreground/70">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="mt-2">Loading more videos...</p>
        </div>
      )}

      {/* Infinite Scroll Trigger */}
      <div ref={observerTarget} className="h-4" />

      {/* End of Feed */}
      {!hasMore && videos.length > 0 && (
        <div className="text-center py-8 text-foreground/70">
          <p>You&apos;ve reached the end of the feed</p>
        </div>
      )}

      {/* Empty State */}
      {videos.length === 0 && !loading && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12 text-foreground/70">
              <p className="text-lg mb-2">No videos found</p>
              <p className="text-sm">Try a different filter or check back later!</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
