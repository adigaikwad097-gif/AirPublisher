import { VideoFeed } from '@/components/discover/video-feed'

export function DiscoverPage() {
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
                <VideoFeed initialVideos={[]} initialFilter="latest" />
            </div>
        </div>
    )
}
