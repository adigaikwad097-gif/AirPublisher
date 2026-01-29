import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { getCurrentCreator } from '@/lib/db/creator'
import { getVideosByCreator } from '@/lib/db/videos'
import { redirect } from 'next/navigation'
import { PlatformSelectButton } from '@/components/videos/platform-select-button'
import { SetVideoUrlButton } from '@/components/videos/set-video-url-button'
import { getVideoStreamUrl } from '@/lib/utils/dropbox-url'

export default async function VideosPage() {
  const creator = await getCurrentCreator()
  if (!creator) {
    redirect('/setup')
  }

  const videos = await getVideosByCreator(creator.unique_identifier)

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-extrabold mb-2 text-white">My Videos</h1>
        <p className="text-white/70 text-sm uppercase tracking-[0.4em]">
          All your uploaded videos ({videos.length} total)
        </p>
      </div>

      {videos.length === 0 ? (
        <Card className="bg-white/5 border-white/10">
          <CardContent className="pt-6">
            <div className="text-center py-8 text-white/70">
              <p>No videos yet. Upload your first video to get started.</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {videos.map((video) => (
            <Card key={video.id} className="bg-white/5 border-white/10 hover:bg-white/10 transition-colors">
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Video Preview */}
                  <div className="md:col-span-1">
                    {video.video_url ? (
                      <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden">
                        <video
                          src={getVideoStreamUrl(video.id)}
                          controls
                          className="w-full h-full object-contain"
                          preload="metadata"
                        >
                          <source src={getVideoStreamUrl(video.id)} type="video/mp4" />
                          Your browser does not support the video tag.
                        </video>
                      </div>
                    ) : (
                      <div className="w-full aspect-video bg-white/5 rounded-lg flex items-center justify-center">
                        <p className="text-white/50 text-sm">No video preview</p>
                      </div>
                    )}
                    {video.video_url && (
                      <p className="text-xs text-white/50 mt-2 truncate" title={video.video_url}>
                        {video.video_url}
                      </p>
                    )}
                  </div>

                  {/* Video Info */}
                  <div className="md:col-span-2 flex-1">
                    <h3 className="font-semibold text-lg mb-2 text-white">{video.title}</h3>
                    {video.description && (
                      <p className="text-sm text-white/70 mb-3 line-clamp-3">{video.description}</p>
                    )}
                    <div className="flex items-center gap-2 flex-wrap mb-3">
                      <Badge
                        variant={
                          video.status === 'posted'
                            ? 'success'
                            : video.status === 'scheduled'
                            ? 'primary'
                            : 'default'
                        }
                      >
                        {video.status}
                      </Badge>
                      <Badge variant="outline" className="bg-white/10 text-white/70 border-white/20">{video.platform_target}</Badge>
                      <Badge variant="outline" className="bg-white/10 text-white/70 border-white/20">{video.source_type}</Badge>
                      {video.views !== undefined && (
                        <Badge variant="outline" className="bg-white/10 text-white/70 border-white/20">
                          {video.views || 0} views
                        </Badge>
                      )}
                    </div>
                    <div className="mt-3 flex gap-2 flex-wrap">
                      {!video.video_url && (
                        <SetVideoUrlButton videoId={video.id} />
                      )}
                      {/* Allow posting to multiple platforms even after initial post */}
                      <PlatformSelectButton 
                        videoId={video.id} 
                        creatorUniqueIdentifier={creator.unique_identifier}
                      />
                    </div>
                    {video.created_at && (
                      <p className="text-xs text-white/50 mt-3">
                        Created: {new Date(video.created_at).toLocaleString()}
                      </p>
                    )}
                    {video.posted_at && (
                      <p className="text-xs text-white/50">
                        Posted: {new Date(video.posted_at).toLocaleString()}
                      </p>
                    )}
                  </div>
                </div>

                {/* Debug Info (Collapsible) */}
                <details className="mt-4 pt-4 border-t border-white/10">
                  <summary className="text-sm text-white/50 cursor-pointer hover:text-white/70">
                    Debug Info
                  </summary>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mt-2">
                    <div>
                      <p className="text-white/50">ID</p>
                      <p className="font-mono text-xs text-white/70">{video.id}</p>
                    </div>
                    <div>
                      <p className="text-white/50">Creator ID</p>
                      <p className="font-mono text-xs truncate text-white/70">{video.creator_unique_identifier}</p>
                    </div>
                    {video.video_url && (
                      <div>
                        <p className="text-white/50">Video URL</p>
                        <p className="text-xs truncate text-white/70" title={video.video_url}>
                          {video.video_url.substring(0, 50)}...
                        </p>
                      </div>
                    )}
                    {video.thumbnail_url && (
                      <div>
                        <p className="text-white/50">Thumbnail URL</p>
                        <p className="text-xs truncate text-white/70" title={video.thumbnail_url}>
                          {video.thumbnail_url.substring(0, 50)}...
                        </p>
                      </div>
                    )}
                  </div>
                </details>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

