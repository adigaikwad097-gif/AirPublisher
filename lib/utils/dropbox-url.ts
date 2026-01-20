/**
 * Convert Dropbox shared link to direct download URL for video playback
 * Dropbox shared links need ?dl=1 for direct download
 * 
 * Note: Dropbox shared links may have CORS issues with HTML5 video players.
 * Consider using a proxy endpoint (/api/videos/[id]/stream) for better compatibility.
 */
export function convertDropboxToDirectUrl(dropboxUrl: string): string {
  if (!dropboxUrl) return dropboxUrl
  
  // If it's already a direct download link, return as is
  if (dropboxUrl.includes('?dl=1')) {
    return dropboxUrl
  }
  
  // Replace ?dl=0 with ?dl=1
  if (dropboxUrl.includes('?dl=0')) {
    return dropboxUrl.replace('?dl=0', '?dl=1')
  }
  
  // If no dl parameter, add ?dl=1
  if (!dropboxUrl.includes('?dl=')) {
    return dropboxUrl + (dropboxUrl.includes('?') ? '&dl=1' : '?dl=1')
  }
  
  return dropboxUrl
}

/**
 * Get video streaming URL (uses proxy to bypass CORS)
 * Use this for HTML5 video players instead of direct Dropbox URLs
 */
export function getVideoStreamUrl(videoId: string): string {
  return `/api/videos/${videoId}/stream`
}

