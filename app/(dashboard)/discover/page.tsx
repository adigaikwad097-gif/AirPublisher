import { getAllPostedVideos } from '@/lib/db/videos'
import { getCreatorProfile } from '@/lib/db/creator'
import { VideoFeed } from '@/components/discover/video-feed'
import { Calendar } from 'lucide-react'

// Force dynamic rendering - this page uses searchParams
export const dynamic = 'force-dynamic'

export default async function DiscoverPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }> | { filter?: string }
}) {
  const params = searchParams instanceof Promise ? await searchParams : searchParams
  const filter = (params?.filter || 'latest') as 'latest' | 'top' | 'trending'
  const limit = 20

  const videos = await getAllPostedVideos(limit, 0)

  // Fetch creator profiles for each video
  const videoWithCreators = await Promise.all(
    videos.map(async (video) => {
      try {
        const creator = await getCreatorProfile(video.creator_unique_identifier)
        return {
          ...video,
          creator: {
            unique_identifier: creator.unique_identifier,
            display_name: (creator as any).handles || creator.display_name || 'Unknown Creator',
            avatar_url: (creator as any).profile_pic_url || creator.avatar_url,
            niche: (creator as any).Niche || creator.niche,
          },
        }
      } catch {
        return {
          ...video,
          creator: {
            unique_identifier: video.creator_unique_identifier,
            display_name: 'Unknown Creator',
            avatar_url: null,
            niche: null,
          },
        }
      }
    })
  )

  // Apply filter sorting
  let sortedVideos = [...videoWithCreators]
  if (filter === 'top' || filter === 'trending') {
    sortedVideos.sort((a, b) => (b.views || 0) - (a.views || 0))
  } else {
    // Latest: already sorted by created_at DESC from getAllPostedVideos
    sortedVideos.sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Header Section */}
      <div className="space-y-4 mb-6">
        <h1 className="text-4xl md:text-5xl font-extrabold text-white">
          Your daily dose of internet
        </h1>
      </div>

      {/* Video Feed Section - Centered */}
      <div>
        <VideoFeed initialVideos={sortedVideos} initialFilter={filter} />
      </div>
    </div>
  )
}
