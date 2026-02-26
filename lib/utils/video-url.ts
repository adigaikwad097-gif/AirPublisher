export function getVideoPlaybackUrl(videoUrl: string | null | undefined): string {
    if (!videoUrl) return ''
    // Legacy Dropbox URLs: convert to direct download
    if (videoUrl.includes('dropbox.com')) {
        return videoUrl.replace('?dl=0', '?dl=1')
    }
    // R2 URLs are already direct-access
    return videoUrl
}
