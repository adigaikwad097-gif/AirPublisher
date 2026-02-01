'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import { Clock, TrendingUp, Sparkles, Heart, MessageCircle, MoreHorizontal, Eye, Volume2, VolumeX } from 'lucide-react'
import Image from 'next/image'
import { formatNumber } from '@/lib/utils'
import { getVideoStreamUrl } from '@/lib/utils/dropbox-url'
import { VideoActions } from './video-actions'

// Video component with auto-play on scroll
function AutoPlayVideo({ src, title, videoId }: { src: string; title: string; videoId: string }) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(true)

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            video.play().catch(() => {})
            setIsPlaying(true)
          } else {
            video.pause()
            setIsPlaying(false)
          }
        })
      },
      {
        threshold: 0.5,
      }
    )

    observer.observe(video)

    return () => {
      observer.disconnect()
    }
  }, [])

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted
      setIsMuted(videoRef.current.muted)
    }
  }

  const streamUrl = getVideoStreamUrl(videoId)

  return (
    <div className="relative w-full group">
      <video
        ref={videoRef}
        src={streamUrl}
        className="w-full h-auto rounded-lg"
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
      {/* Mute/Unmute Button */}
      <button
        onClick={toggleMute}
        className="absolute bottom-4 right-4 bg-black/60 hover:bg-black/80 rounded-full p-2 transition-all opacity-0 group-hover:opacity-100"
        aria-label={isMuted ? 'Unmute video' : 'Mute video'}
      >
        {isMuted ? (
          <VolumeX className="h-5 w-5 text-white" />
        ) : (
          <Volume2 className="h-5 w-5 text-white" />
        )}
      </button>
    </div>
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
        <button
          onClick={() => handleFilterChange('latest')}
          className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
            filter === 'latest'
              ? 'bg-[#89CFF0] text-black'
              : 'bg-white/10 text-white/70 hover:bg-white/20'
          }`}
        >
          <Clock className="h-4 w-4 inline mr-2" />
          Latest
        </button>
        <button
          onClick={() => handleFilterChange('top')}
          className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
            filter === 'top'
              ? 'bg-[#89CFF0] text-black'
              : 'bg-white/10 text-white/70 hover:bg-white/20'
          }`}
        >
          <TrendingUp className="h-4 w-4 inline mr-2" />
          Top
        </button>
        <button
          onClick={() => handleFilterChange('trending')}
          className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
            filter === 'trending'
              ? 'bg-[#89CFF0] text-black'
              : 'bg-white/10 text-white/70 hover:bg-white/20'
          }`}
        >
          <Sparkles className="h-4 w-4 inline mr-2" />
          Trending
        </button>
      </div>

      {/* LinkedIn-style Feed - Centered */}
      <div className="space-y-4">
        {videos.map((video) => {
          return (
            <div
              key={video.id}
              className="bg-black border border-white/10 rounded-lg overflow-hidden"
            >
              {/* Creator Header */}
              <div className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
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
                      <div className="w-12 h-12 rounded-full bg-[#89CFF0]/20 flex items-center justify-center">
                        <span className="text-lg text-[#89CFF0] font-semibold">
                          {video.creator.display_name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                  </Link>
                  <div className="flex-1 min-w-0">
                    <Link href={`/creator/${video.creator.unique_identifier}`} onClick={(e) => e.stopPropagation()}>
                      <p className="font-semibold text-white hover:text-[#89CFF0] transition-colors">
                        {video.creator.display_name}
                      </p>
                    </Link>
                    {video.posted_at && (
                      <p className="text-sm text-white/50">
                        {new Date(video.posted_at).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>
                <button className="text-white/70 hover:text-white">
                  <MoreHorizontal className="h-5 w-5" />
                </button>
              </div>

              {/* Video Content */}
              <Link href={`/videos/${video.id}`}>
                <div className="relative w-full bg-black">
                  {video.video_url ? (
                    <AutoPlayVideo src={video.video_url} title={video.title} videoId={video.id} />
                  ) : video.thumbnail_url ? (
                    <div className="relative w-full aspect-video">
                      <Image
                        src={video.thumbnail_url}
                        alt={video.title}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, 800px"
                      />
                    </div>
                  ) : (
                    <div className="w-full aspect-video flex flex-col items-center justify-center bg-white/5">
                      <span className="text-white/50 text-sm">No video available</span>
                    </div>
                  )}
                </div>
              </Link>

              {/* Title and Description */}
              <div className="p-4">
                <Link href={`/videos/${video.id}`}>
                  <h3 className="font-semibold text-lg mb-2 text-white hover:text-[#89CFF0] transition-colors">
                    {video.title}
                  </h3>
                  {video.description && (
                    <p className="text-sm text-white/70 line-clamp-3 mb-3">
                      {video.description}
                    </p>
                  )}
                </Link>

                {/* Engagement Stats */}
                <div className="flex items-center gap-4 text-sm text-white/60 mb-3">
                  <div className="flex items-center gap-1">
                    <Eye className="h-4 w-4" />
                    <span>{formatNumber(video.views || 0)}</span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-between pt-3 border-t border-white/10">
                  <div className="flex items-center gap-6">
                    <VideoActions videoId={video.id} />
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Loading Indicator */}
      {loading && (
        <div className="text-center py-8 text-white/70">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#89CFF0]"></div>
          <p className="mt-2">Loading more videos...</p>
        </div>
      )}

      {/* Infinite Scroll Trigger */}
      <div ref={observerTarget} className="h-4" />

      {/* End of Feed */}
      {!hasMore && videos.length > 0 && (
        <div className="text-center py-8 text-white/70">
          <p>You&apos;ve reached the end of the feed</p>
        </div>
      )}

      {/* Empty State */}
      {videos.length === 0 && !loading && (
        <div className="text-center py-12 text-white/70">
          <p className="text-lg mb-2">No videos found</p>
          <p className="text-sm">Try a different filter or check back later!</p>
        </div>
      )}
    </div>
  )
}
