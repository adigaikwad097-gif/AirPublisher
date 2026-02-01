'use client'

import { Database } from '@/lib/supabase/types'

type Video = Database['public']['Tables']['air_publisher_videos']['Row']

interface VideoFeedProps {
  initialVideos: Video[]
  initialFilter?: string
}

export function VideoFeed({ initialVideos, initialFilter }: VideoFeedProps) {
  const videos = initialVideos
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {videos.map((video) => (
        <div key={video.id} className="rounded-lg border border-border overflow-hidden">
          {video.thumbnail_url && (
            <div className="aspect-video bg-muted overflow-hidden relative">
              <img
                src={video.thumbnail_url}
                alt={video.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}
          <div className="p-4">
            <h3 className="font-semibold mb-2">{video.title}</h3>
            {video.description && (
              <p className="text-sm text-foreground/70 line-clamp-2">{video.description}</p>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
