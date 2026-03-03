/**
 * Extracts a thumbnail frame from a video file at a specific timestamp.
 * This runs ONCE during upload — not on every page load — so it is safe
 * and avoids the "canvas on every grid card" anti-pattern.
 *
 * @param file The video File object selected by the user
 * @param seekTime Seconds into the video to grab the frame (default: 2s to skip fade-ins)
 * @param quality JPEG quality 0-1 (default: 0.85)
 * @returns A Blob containing the JPEG thumbnail, or null on failure
 */
export function extractThumbnailFromVideo(
    file: File,
    seekTime = 2,
    quality = 0.85
): Promise<Blob | null> {
    return new Promise((resolve) => {
        const video = document.createElement('video')
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')

        if (!ctx) {
            console.warn('[extractThumbnail] Canvas 2D context unavailable')
            resolve(null)
            return
        }

        // Prevent the video from playing audio
        video.muted = true
        video.playsInline = true
        video.preload = 'auto'

        // Set a timeout so we don't hang forever on broken files
        const timeout = setTimeout(() => {
            console.warn('[extractThumbnail] Timed out after 15s')
            cleanup()
            resolve(null)
        }, 15000)

        const cleanup = () => {
            clearTimeout(timeout)
            video.removeAttribute('src')
            video.load()
            URL.revokeObjectURL(video.src)
        }

        video.onloadedmetadata = () => {
            // If video is shorter than seekTime, grab at 10% in
            const actualSeek = video.duration > seekTime ? seekTime : video.duration * 0.1
            video.currentTime = actualSeek
        }

        video.onseeked = () => {
            try {
                // Scale down to max 640px wide to keep thumbnails lightweight
                const maxWidth = 640
                const scale = Math.min(1, maxWidth / video.videoWidth)
                canvas.width = Math.round(video.videoWidth * scale)
                canvas.height = Math.round(video.videoHeight * scale)

                ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

                canvas.toBlob(
                    (blob) => {
                        cleanup()
                        resolve(blob)
                    },
                    'image/jpeg',
                    quality
                )
            } catch (err) {
                console.error('[extractThumbnail] Draw failed:', err)
                cleanup()
                resolve(null)
            }
        }

        video.onerror = () => {
            console.warn('[extractThumbnail] Video load error')
            cleanup()
            resolve(null)
        }

        // Load the file
        video.src = URL.createObjectURL(file)
    })
}
