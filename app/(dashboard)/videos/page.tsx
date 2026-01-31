'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { PostNowButton } from '@/components/videos/post-now-button'
import { ScheduleButton } from '@/components/videos/schedule-button'
import { Eye, Calendar, Clock, Plus } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { formatNumber } from '@/lib/utils'

interface Video {
  id: string
  title: string
  description: string | null
  thumbnail_url: string | null
  video_url: string | null
  platform_target: string
  status: string
  views: number
  created_at: string
  posted_at: string | null
  scheduled_at: string | null
  creator_unique_identifier: string
}

export default function VideosPage() {
  const [videos, setVideos] = useState<Video[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchVideos() {
      try {
        const response = await fetch('/api/videos')
        if (response.ok) {
          const data = await response.json()
          setVideos(data.videos || [])
        }
      } catch (error) {
        console.error('Error fetching videos:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchVideos()
  }, [])

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'primary' | 'success' | 'danger'> = {
      draft: 'default',
      scheduled: 'primary',
      posted: 'success',
      failed: 'danger',
    }
    return (
      <Badge variant={variants[status] || 'default'}>
        {status}
      </Badge>
    )
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

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-extrabold mb-2">My Videos</h1>
          <p className="text-foreground/70">Manage and publish your videos</p>
        </div>
        <Link href="/upload">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Upload Video
          </Button>
        </Link>
      </div>

      {videos.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <p className="text-foreground/70 mb-4">No videos yet</p>
              <Link href="/upload">
                <Button>Upload Your First Video</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {videos.map((video) => (
            <Card key={video.id} className="overflow-hidden">
              <div className="flex gap-4">
                {/* Video Preview */}
                <div className="w-64 h-40 bg-muted overflow-hidden relative flex-shrink-0">
                  {video.video_url ? (
                    <video
                      src={video.video_url}
                      className="w-full h-full object-cover"
                      controls
                      preload="metadata"
                    >
                      Your browser does not support the video tag.
                    </video>
                  ) : video.thumbnail_url ? (
                    <Image
                      src={video.thumbnail_url}
                      alt={video.title}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-muted">
                      <span className="text-muted">No preview</span>
                    </div>
                  )}
                </div>

                {/* Video Details */}
                <div className="flex-1 p-4">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <CardTitle className="text-lg">{video.title}</CardTitle>
                    {getStatusBadge(video.status)}
                  </div>

                  {video.description && (
                    <p className="text-sm text-foreground/70 mb-3 line-clamp-2">
                      {video.description}
                    </p>
                  )}

                  <div className="flex items-center gap-4 text-sm text-foreground/60 mb-3">
                    <div className="flex items-center gap-1">
                      <Eye className="h-4 w-4" />
                      <span>{formatNumber(video.views || 0)}</span>
                    </div>
                    {video.posted_at && (
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        <span>{new Date(video.posted_at).toLocaleDateString()}</span>
                      </div>
                    )}
                    {video.scheduled_at && (
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        <span>{new Date(video.scheduled_at).toLocaleString()}</span>
                      </div>
                    )}
                    <Badge variant="outline" className="capitalize">
                      {video.platform_target}
                    </Badge>
                  </div>

                  <div className="flex items-center gap-2 pt-2 border-t border-border">
                    <PostNowButton
                      videoId={video.id}
                      creatorUniqueIdentifier={video.creator_unique_identifier}
                    />
                    <ScheduleButton
                      videoId={video.id}
                      creatorUniqueIdentifier={video.creator_unique_identifier}
                    />
                    <Link href={`/videos/${video.id}`}>
                      <Button variant="outline">
                        View Details
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
