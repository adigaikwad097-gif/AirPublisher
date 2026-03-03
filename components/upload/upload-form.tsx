import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Upload as UploadIcon, X, Loader2 } from 'lucide-react'
import { createVideo } from '@/lib/db/videos'
import { useNavigate } from 'react-router-dom'
import { useModal } from '@/components/providers/modal-provider'
import { extractThumbnailFromVideo } from '@/lib/utils/extract-thumbnail'

interface UploadFormProps {
  creatorUniqueIdentifier: string
}

const MAX_FILE_SIZE = 500 * 1024 * 1024 // 500MB

export function UploadForm({ creatorUniqueIdentifier }: UploadFormProps) {
  const [file, setFile] = useState<File | null>(null)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)
  const [uploadProgressText, setUploadProgressText] = useState('Ready to upload')
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [thumbnailBlob, setThumbnailBlob] = useState<Blob | null>(null)

  const navigate = useNavigate()
  const { showToast } = useModal()

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      if (selectedFile.size > MAX_FILE_SIZE) {
        showToast({ message: `File too large (${(selectedFile.size / 1024 / 1024).toFixed(0)}MB). Maximum is 500MB.`, type: 'error' })
        return
      }

      setFile(selectedFile)
      try {
        const url = URL.createObjectURL(selectedFile)
        setPreview(url)
      } catch (error) {
        console.error('[UploadForm] Failed to create preview:', error)
      }

      // Extract thumbnail frame at 2s (runs once during file selection, NOT on grid render)
      try {
        const thumb = await extractThumbnailFromVideo(selectedFile, 2, 0.85)
        if (thumb) {
          setThumbnailBlob(thumb)
          console.log('[UploadForm] Thumbnail extracted:', (thumb.size / 1024).toFixed(1), 'KB')
        } else {
          console.warn('[UploadForm] Thumbnail extraction returned null')
        }
      } catch (err) {
        console.warn('[UploadForm] Thumbnail extraction failed (non-fatal):', err)
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!file) {
      showToast({ message: 'Please select a video file', type: 'error' })
      return
    }

    if (!title) {
      showToast({ message: 'Please enter a video title', type: 'error' })
      return
    }

    setUploading(true)
    setUploadProgressText('Creating video record...')
    setUploadError(null)

    let uploadData: { uploadUrl?: string; videoUrl?: string } | null = null

    try {
      setUploadProgressText('Requesting upload URL...')

      // 1. Get Presigned URL via direct fetch (no JWT needed — function validates creatorUniqueIdentifier)
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

      const response = await fetch(`${supabaseUrl}/functions/v1/generate-upload-url`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseAnonKey,
        },
        body: JSON.stringify({
          title,
          contentType: file.type || 'video/mp4',
          creatorUniqueIdentifier
        })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error('Failed to get upload URL: ' + (errorData.error || `HTTP ${response.status}`))
      }

      uploadData = await response.json()

      if (!uploadData?.uploadUrl) {
        throw new Error('Failed to get upload URL: No upload URL returned')
      }

      setUploadProgressText('Uploading video...')

      // 2. Upload to R2 via XMLHttpRequest to track progress
      await new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest()
        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            const percentComplete = Math.round((event.loaded / event.total) * 100)
            setUploadProgress(percentComplete)
            setUploadProgressText(`Uploading... ${percentComplete}%`)
          }
        }
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve(xhr.response)
          } else {
            console.error('R2 Upload failed with status:', xhr.status, xhr.responseText)
            reject(new Error(`Upload failed with status ${xhr.status}`))
          }
        }
        xhr.onerror = () => reject(new Error('Network error during upload'))
        xhr.open('PUT', uploadData.uploadUrl)
        xhr.setRequestHeader('Content-Type', file.type || 'video/mp4')
        xhr.send(file)
      })

      // 2b. Upload thumbnail to R2 (if extracted)
      let thumbnailUrl: string | null = null
      if (thumbnailBlob) {
        setUploadProgressText('Generating thumbnail...')
        try {
          const supabaseUrl2 = import.meta.env.VITE_SUPABASE_URL
          const supabaseAnonKey2 = import.meta.env.VITE_SUPABASE_ANON_KEY

          const thumbResponse = await fetch(`${supabaseUrl2}/functions/v1/generate-upload-url`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'apikey': supabaseAnonKey2,
            },
            body: JSON.stringify({
              title: `thumb_${title}`,
              contentType: 'image/jpeg',
              creatorUniqueIdentifier
            })
          })

          if (thumbResponse.ok) {
            const thumbData = await thumbResponse.json()
            if (thumbData?.uploadUrl) {
              // Upload the thumbnail JPEG to R2
              const thumbUploadRes = await fetch(thumbData.uploadUrl, {
                method: 'PUT',
                headers: { 'Content-Type': 'image/jpeg' },
                body: thumbnailBlob
              })
              if (thumbUploadRes.ok) {
                thumbnailUrl = thumbData.videoUrl // The R2 public URL
                console.log('[UploadForm] Thumbnail uploaded to R2:', thumbnailUrl)
              }
            }
          }
        } catch (thumbErr) {
          console.warn('[UploadForm] Thumbnail upload failed (non-fatal):', thumbErr)
        }
      }

      setUploadProgressText('Finalizing video record...')

      // 3. Create video record in Supabase
      const video = await createVideo({
        creator_unique_identifier: creatorUniqueIdentifier,
        source_type: 'ugc',
        title,
        description: description || null,
        platform_target: 'internal', // No platform selected yet
        status: 'draft',
        posted_at: null,
        views: 0,
        scheduled_at: null,
        video_url: uploadData.videoUrl, // Use the new R2 URL
        thumbnail_url: thumbnailUrl,    // Extracted thumbnail (or null fallback)
      })

      if (!video || !video.id) {
        throw new Error('Video was created but no ID was returned')
      }

      setUploading(false)
      showToast({ message: `Video uploaded successfully! ✅\n\nVideo ID: ${video.id}`, type: 'success' })

      navigate('/videos')

    } catch (error: any) {
      console.error('Upload error:', error)

      // If R2 upload succeeded but DB insert failed, the file is orphaned in R2
      if (uploadData?.videoUrl) {
        console.warn('[UploadForm] R2 file may be orphaned (uploaded but DB record failed):', uploadData.videoUrl)
      }

      setUploadError(error.message || 'Unknown error occurred during upload')

      if (error.name === 'AbortError') {
        showToast({ message: 'Upload timed out. Please try again or upload a smaller file.', type: 'error' })
      } else {
        showToast({ message: `Failed to upload video:\n${error.message || 'Unknown error'}\n\nCheck browser console for details.`, type: 'error' })
      }
    } finally {
      setUploading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-5 gap-6 w-full h-full">

      {/* LEFT PANE: Video Focus (60%) */}
      <div className="lg:col-span-3 bg-card rounded-xl border border-border/20 relative flex flex-col overflow-hidden h-full shadow-2xl">
        {preview ? (
          <div className="relative w-full h-full flex items-center justify-center bg-black/80">
            <video
              src={preview}
              className="w-full h-full object-contain"
              controls
            />
            <button
              type="button"
              onClick={() => {
                setFile(null)
                setPreview(null)
              }}
              className="absolute top-4 right-4 p-2 bg-black/80 backdrop-blur-md rounded-full text-white hover:bg-black hover:scale-105 active:scale-95 transition-all outline-none border border-white/10"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        ) : (
          <div className="flex-1 p-6 flex flex-col">
            <label className="flex flex-col items-center justify-center w-full h-full border-2 border-dashed border-white/10 hover:border-white/30 hover:bg-white/5 transition-all cursor-pointer rounded-xl group relative overflow-hidden">
              {/* Subtle animated background gradient on hover */}
              <div className="absolute inset-0 bg-gradient-to-b from-primary/0 via-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

              <div className="flex flex-col items-center justify-center pt-5 pb-6 relative z-10">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-primary/20 transition-all duration-300">
                  <UploadIcon className="w-8 h-8 text-primary" />
                </div>
                <p className="mb-2 text-xl tracking-tight text-white/90">
                  <span className="font-semibold text-white">Click to upload</span> or drag and drop
                </p>
                <p className="text-sm font-medium text-white/40 uppercase tracking-wider mt-2">MP4, MOV, AVI (max 500MB)</p>
              </div>
              <input
                type="file"
                className="hidden"
                accept="video/*"
                onChange={handleFileChange}
                onClick={(e) => {
                  e.currentTarget.value = ''
                }}
              />
            </label>
          </div>
        )}
      </div>

      {/* RIGHT PANE: Action & Meta (40%) */}
      <div className="lg:col-span-2 flex flex-col bg-card border border-border/20 rounded-xl p-6 shadow-2xl relative">


        {/* Scrollable Middle */}
        <div className="flex-1 overflow-visible lg:overflow-y-auto pr-2 space-y-5 pb-6 -mr-2 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-white/10 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-white/20 min-h-[min-content]">

          {/* Title */}
          <div>
            <label className="block text-sm font-bold uppercase tracking-wider mb-2 text-white/70">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-xl text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all font-semibold text-lg"
              placeholder="Enter video title"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-bold uppercase tracking-wider mb-2 text-white/70">Description <span className="text-white/40 font-normal normal-case">(optional)</span></label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-xl text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all min-h-[140px] resize-none text-base"
              placeholder="Enter video description..."
            />
          </div>

          {/* File Status (only visible if selected and not uploading) */}
          {file && !uploading && (
            <div className="p-4 bg-black/40 border border-white/10 rounded-xl flex items-center gap-4">
              <div className="w-10 h-10 bg-primary/10 rounded-lg shrink-0 flex items-center justify-center">
                <UploadIcon className="w-5 h-5 text-primary" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-white truncate">{file.name}</p>
                <p className="text-xs font-medium text-white/40 mt-0.5">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
              </div>
            </div>
          )}

          {/* Upload Progress */}
          {uploading && (
            <div className="flex flex-col gap-3 p-5 rounded-xl bg-black/40 border border-primary/30 relative overflow-hidden">
              <div className="absolute inset-0 bg-primary/5 animate-pulse" />
              <div className="flex items-center gap-4 relative z-10">
                <div className="w-10 h-10 bg-primary/10 rounded-lg shrink-0 flex items-center justify-center">
                  <Loader2 className="w-5 h-5 text-primary animate-spin" />
                </div>
                <div>
                  <p className="font-semibold text-white text-sm">{uploadProgressText}</p>
                  <p className="text-xs font-medium text-white/50 mt-1">
                    Keep this tab open.
                  </p>
                </div>
              </div>
              {/* Progress Bar */}
              <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden mt-2 relative z-10">
                <div
                  className="h-full bg-primary transition-all duration-300 ease-out relative"
                  style={{ width: `${uploadProgress}%` }}
                >
                  <div className="absolute top-0 right-0 bottom-0 left-0 bg-white/20 animate-pulse" />
                </div>
              </div>
            </div>
          )}

          {uploadError && (
            <div className="text-sm font-medium text-red-200 p-4 bg-red-500/10 border border-red-500/20 rounded-xl relative overflow-hidden">
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-500/50" />
              {uploadError}
            </div>
          )}
        </div>

        {/* Bottom Sticky Action Area (Using absolute positioning to guarantee sticking or just mt-auto if container is flex) */}
        <div className="mt-auto pt-5 shrink-0">
          <Button
            type="submit"
            className={`w-full h-14 transition-all duration-300 font-bold text-[16px] tracking-wide rounded-xl ${!file || !title || uploading
              ? 'bg-white/10 text-white/40 border border-white/5 opacity-70'
              : 'bg-primary text-black hover:bg-white hover:scale-[1.02] active:scale-[0.98] shadow-[0_0_20px_rgba(137,207,240,0.4)] hover:shadow-[0_0_30px_rgba(255,255,255,0.6)]'
              }`}
            disabled={uploading || !file || !title}
          >
            {uploading ? 'UPLOADING...' : !file ? 'SELECT A VIDEO' : 'UPLOAD VIDEO'}
          </Button>

          {/* Minimal Guidelines */}
          <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 justify-center text-[10px] text-white/40 uppercase tracking-[0.15em] font-semibold">
            <span>• MP4 / MOV (500MB)</span>
            <span>• 1080p Priority</span>
            <span>• Auto Thumbs</span>
          </div>
        </div>

      </div>
    </form>
  )
}
