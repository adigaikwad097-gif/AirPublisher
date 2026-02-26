import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Upload as UploadIcon, X, Loader2 } from 'lucide-react'
import { createVideo } from '@/lib/db/videos'
import { useNavigate } from 'react-router-dom'
import { useModal } from '@/components/providers/modal-provider'

interface UploadFormProps {
  creatorUniqueIdentifier: string
}

export function UploadForm({ creatorUniqueIdentifier }: UploadFormProps) {
  const [file, setFile] = useState<File | null>(null)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)
  const [uploadProgressText, setUploadProgressText] = useState('Ready to upload')
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadError, setUploadError] = useState<string | null>(null)

  const navigate = useNavigate()
  const { showToast } = useModal()

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      setFile(selectedFile)
      try {
        const url = URL.createObjectURL(selectedFile)
        setPreview(url)
      } catch (error) {
        console.error('[UploadForm] Failed to create preview:', error)
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
          description,
          contentType: file.type || 'video/mp4',
          creatorUniqueIdentifier
        })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error('Failed to get upload URL: ' + (errorData.error || `HTTP ${response.status}`))
      }

      const uploadData = await response.json()

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
        thumbnail_url: null,
      })

      if (!video || !video.id) {
        throw new Error('Video was created but no ID was returned')
      }

      setUploading(false)
      showToast({ message: `Video uploaded successfully! ✅\n\nVideo ID: ${video.id}`, type: 'success' })

      navigate('/videos')

    } catch (error: any) {
      console.error('Upload error:', error)
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
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* File Upload */}
      <div>
        <label className="block text-sm font-medium mb-2 text-white/70">Video File</label>
        {preview ? (
          <div className="relative">
            <video
              src={preview}
              className="w-full h-48 object-cover rounded-lg border border-white/10"
              controls
            />
            <button
              type="button"
              onClick={() => {
                setFile(null)
                setPreview(null)
              }}
              className="absolute top-2 right-2 p-1 bg-black/80 rounded-full text-white hover:bg-black/90"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-white/20 rounded-lg cursor-pointer hover:bg-white/5 hover:border-white/40 transition-colors">
            <div className="flex flex-col items-center justify-center pt-5 pb-6">
              <UploadIcon className="w-10 h-10 mb-3 text-[#89CFF0]" />
              <p className="mb-2 text-sm text-white/70">
                <span className="font-semibold">Click to upload</span> or drag and drop
              </p>
              <p className="text-xs text-white/50">MP4, MOV, AVI (max 500MB)</p>
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
        )}
      </div>

      {/* Title */}
      <div>
        <label className="block text-sm font-medium mb-2 text-white/70">Title</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-[#89CFF0] focus:border-[#89CFF0]/50"
          placeholder="Enter video title"
          required
        />
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium mb-2 text-white/70">Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-[#89CFF0] focus:border-[#89CFF0]/50 min-h-[100px]"
          placeholder="Enter video description (optional)"
        />
      </div>

      {/* File Status */}
      {file && (
        <div className="p-3 bg-white/5 border border-white/10 rounded-lg">
          <p className="text-sm text-white/80">
            <span className="font-semibold">Selected:</span> {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
          </p>
        </div>
      )}

      {/* Submit */}
      <Button
        type="submit"
        className="w-full bg-[#89CFF0] text-black hover:bg-[#89CFF0]/90 font-semibold"
        disabled={uploading || !file || !title}
      >
        {uploading ? 'Uploading...' : !file ? 'Select a video file' : !title ? 'Enter a title' : 'Upload Video'}
      </Button>

      {uploading && (
        <div className="mt-4 flex flex-col gap-3 p-4 rounded-xl bg-black/30 border border-[#89CFF0]/30 min-w-full">
          <div className="flex items-center gap-3">
            <Loader2 className="w-8 h-8 text-[#89CFF0] animate-spin shrink-0" />
            <div>
              <p className="font-semibold text-white">{uploadProgressText}</p>
              <p className="text-xs text-white/70">
                Uploads can take a few minutes for large videos. Keep this tab open.
              </p>
            </div>
          </div>
          {/* Progress Bar */}
          <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden mt-1">
            <div
              className="h-full bg-[#89CFF0] transition-all duration-300 ease-out"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        </div>
      )}

      {uploadError && (
        <div className="text-sm text-red-500 mt-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
          {uploadError}
        </div>
      )}
    </form>
  )
}
