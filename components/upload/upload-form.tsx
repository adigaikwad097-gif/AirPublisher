'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Upload as UploadIcon, X } from 'lucide-react'
import { createVideoAction } from '@/app/api/videos/actions'

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
  const [uploadResponse, setUploadResponse] = useState<Response | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log('[UploadForm] File input changed', e.target.files)
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      console.log('[UploadForm] File selected:', {
        name: selectedFile.name,
        size: selectedFile.size,
        type: selectedFile.type,
      })
      setFile(selectedFile)
      // Create preview URL
      try {
        const url = URL.createObjectURL(selectedFile)
        setPreview(url)
        console.log('[UploadForm] Preview URL created')
      } catch (error) {
        console.error('[UploadForm] Failed to create preview:', error)
      }
    } else {
      console.warn('[UploadForm] No file selected')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    console.log('[UploadForm] Form submitted', { hasFile: !!file, hasTitle: !!title, title })
    
    if (!file) {
      alert('Please select a video file')
      return
    }
    
    if (!title) {
      alert('Please enter a video title')
      return
    }

    setUploading(true)
    setUploadProgressText('Preparing upload...')
    setUploadResponse(null)
    let uploadResponse: Response | undefined
    try {
      // Create video entry as 'draft' - user will select platform when publishing
      console.log('[UploadForm] Creating video record...')
      setUploadProgressText('Creating video record...')
      
      const video = await createVideoAction({
        creator_unique_identifier: creatorUniqueIdentifier,
        source_type: 'ugc',
        title,
        description: description || null,
        platform_target: 'internal' as any, // No platform selected yet - user will choose when publishing
        status: 'draft', // Always draft - user publishes later
        posted_at: null,
        views: 0,
        scheduled_at: null,
        video_url: null,
        thumbnail_url: null,
      } as any)

      console.log('[UploadForm] ✅ Video record created:', {
        id: video.id,
        title: video.title,
        status: video.status,
      })
      setUploadProgressText('Uploading file to Dropbox...')

      if (!video.id) {
        throw new Error('Video was created but no ID was returned')
      }

      // Upload file directly to n8n (bypasses Next.js to avoid payload limit)
      if (file && video.id) {
        console.log('[UploadForm] Uploading file directly to n8n...', {
          videoId: video.id,
          fileName: file.name,
          fileSize: file.size,
        })
        
        // Get n8n webhook URL from environment (client-side accessible via API)
        // For Vercel, we MUST upload directly to n8n to avoid payload limit
        let n8nWebhookUrl: string | null = null
        
        // Try to get webhook URL from API (avoids exposing in client bundle)
        try {
          const configResponse = await fetch('/api/config/n8n-webhook-url')
          if (configResponse.ok) {
            const config = await configResponse.json()
            n8nWebhookUrl = config.n8n_webhook_url || null
            console.log('[UploadForm] Got n8n webhook URL from API')
          }
        } catch (e) {
          console.warn('[UploadForm] Could not get webhook URL from API, will try direct upload anyway')
        }
        
        if (!n8nWebhookUrl) {
          // Fallback: Upload through Next.js (may timeout with ngrok)
          console.warn('[UploadForm] n8n webhook URL not available, using Next.js upload (may timeout)')
          setUploadProgressText('Uploading via Next.js proxy...')
          
          const formData = new FormData()
          formData.append('file', file)

          const controller = new AbortController()
          const timeoutId = setTimeout(() => {
            console.error('[UploadForm] ⏱️ Upload timeout after 5 minutes')
            controller.abort()
          }, 300000)
          
          try {
            uploadResponse = await fetch(`/api/videos/${video.id}/upload`, {
              method: 'POST',
              body: formData,
              signal: controller.signal,
            })
            setUploadResponse(uploadResponse)
          } catch (fetchError: any) {
            clearTimeout(timeoutId)
            if (fetchError.name === 'AbortError') {
              throw new Error('Upload timed out. This may be due to ngrok timeout limits. Try uploading a smaller file or use a different tunnel service.')
            }
            throw fetchError
          } finally {
            clearTimeout(timeoutId)
          }
        } else {
          // Upload directly to n8n
          console.log('[UploadForm] Uploading directly to n8n webhook:', n8nWebhookUrl)
          console.log('[UploadForm] File details:', {
            name: file.name,
            size: file.size,
            type: file.type,
            videoId: video.id,
          })
          
          const formData = new FormData()
          formData.append('file', file, `${video.id}.${file.name.split('.').pop() || 'mp4'}`)
          formData.append('video_id', video.id)
          formData.append('creator_unique_identifier', creatorUniqueIdentifier)
          formData.append('file_name', `${video.id}.${file.name.split('.').pop() || 'mp4'}`)
          // Use window.location.origin for browser-side (works with any domain including Vercel)
          formData.append('callback_url', `${window.location.origin}/api/webhooks/n8n/upload-complete`)

          console.log('[UploadForm] FormData created with keys:', Array.from(formData.keys()))
          console.log('[UploadForm] Starting fetch to n8n...')
          
          const controller = new AbortController()
          const timeoutId = setTimeout(() => {
            console.error('[UploadForm] ⏱️ n8n upload timeout after 10 minutes')
            controller.abort()
          }, 600000) // 10 minutes for direct n8n upload
          
          const fetchStartTime = Date.now()
          
          try {
            console.log('[UploadForm] Sending fetch request to:', n8nWebhookUrl)
            console.log('[UploadForm] Request origin:', window.location.origin)
            console.log('[UploadForm] File size:', (file.size / 1024 / 1024).toFixed(2), 'MB')
            
            uploadResponse = await fetch(n8nWebhookUrl, {
              method: 'POST',
              body: formData,
              signal: controller.signal,
              // Don't set Content-Type - browser will set it with boundary for FormData
            })
            setUploadResponse(uploadResponse)
            
            clearTimeout(timeoutId)
            const fetchDuration = Date.now() - fetchStartTime
            console.log('[UploadForm] ✅ Fetch completed in', fetchDuration, 'ms')
            console.log('[UploadForm] Response status:', uploadResponse.status, uploadResponse.statusText)
            console.log('[UploadForm] Response headers:', Object.fromEntries(uploadResponse.headers.entries()))
          } catch (fetchError: any) {
            clearTimeout(timeoutId)
            const fetchDuration = Date.now() - fetchStartTime
            console.error('[UploadForm] ❌ Fetch failed after', fetchDuration, 'ms')
            console.error('[UploadForm] Fetch error details:', {
              name: fetchError?.name,
              message: fetchError?.message,
              cause: fetchError?.cause,
              stack: fetchError?.stack,
            })
            
            if (fetchError.name === 'AbortError') {
              throw new Error('Upload timed out. Please try again or upload a smaller file.')
            }
            
            throw fetchError
          } finally {
            clearTimeout(timeoutId)
          }
          
          // Read response body once and reuse
          let responseText = ''
          try {
            responseText = await uploadResponse.text()
          } catch (e) {
            console.warn('[UploadForm] Could not read response body:', e)
          }
          
          if (!uploadResponse.ok) {
            console.error('[UploadForm] ❌ n8n upload error:', {
              status: uploadResponse.status,
              statusText: uploadResponse.statusText,
              error: responseText,
            })
            throw new Error(`Failed to upload to n8n (${uploadResponse.status}): ${responseText || uploadResponse.statusText}`)
          }
          
          // Log success response
          if (responseText) {
            console.log('[UploadForm] ✅ File sent directly to n8n')
            console.log('[UploadForm] n8n response:', responseText.substring(0, 200))
          } else {
            console.log('[UploadForm] ✅ File sent directly to n8n (no response body)')
          }
          
          // n8n will process and call back to /api/webhooks/n8n/upload-complete
          // The browser doesn't need to wait - n8n will process in background
          console.log('[UploadForm] ✅ Upload initiated - n8n will process and call back when done')
          setUploadProgressText('Upload en route – processing in n8n...')
          
          // For n8n uploads, we're done here - n8n will call back when processing completes
          // Show success message and redirect
          setUploading(false)
          alert(`Video upload started! ✅\n\nn8n is processing your video in the background.\nThe video URL will be updated automatically when processing completes.\n\nVideo ID: ${video.id}`)
          setTimeout(() => {
            window.location.href = '/videos'
          }, 2000)
          return // Exit early for n8n uploads
        }
        
        // Handle response (for Next.js fallback uploads only)
        if (uploadResponse && !uploadResponse.ok) {
          let errorData
          let responseText = ''
          try {
            responseText = await uploadResponse.text()
            errorData = responseText ? JSON.parse(responseText) : { error: uploadResponse.statusText }
          } catch (e) {
            errorData = { error: `Upload failed with status ${uploadResponse.status}: ${uploadResponse.statusText}` }
          }
          console.error('[UploadForm] Upload error:', errorData)
          setUploadProgressText('Upload failed. Check console for details.')
          
          let errorMessage = errorData.error || `Failed to upload file: ${uploadResponse.statusText}`
          if (errorData.troubleshooting) {
            errorMessage += '\n\n' + errorData.troubleshooting
          }
          if (errorData.details) {
            errorMessage += '\n\nDetails: ' + errorData.details
          }
          
          throw new Error(errorMessage)
        }

        // For Next.js uploads, parse the response
        if (uploadResponse && uploadResponse.ok) {
          let uploadResult
          let responseText = ''
          try {
            responseText = await uploadResponse.text()
            uploadResult = responseText ? JSON.parse(responseText) : { success: true }
          } catch (e) {
            console.error('[UploadForm] Failed to parse response:', e)
            throw new Error('Upload completed but failed to parse server response')
          }
          
          console.log('[UploadForm] ✅ File uploaded successfully:', uploadResult.video_url)
          setUploadProgressText('Upload completed successfully!')
        }
      } else {
        console.warn('[UploadForm] Skipping file upload - no file or video ID')
      }

      // Reset form
      setFile(null)
      setTitle('')
      setDescription('')
      setPreview(null)
      
      // Show success message based on status
      if (!video || !video.id) {
        throw new Error('Video was created but no ID was returned. Check server logs.')
      }

      alert(`Video uploaded successfully! ✅\n\nVideo ID: ${video.id}\nGo to "My Videos" to select a platform and publish it.`)
      
      // Refresh the page or redirect to videos page to see the video
      setTimeout(() => {
        window.location.href = '/videos'
      }, 2000)
    } catch (error: any) {
      console.error('Upload error:', error)
      console.error('Error details:', {
        message: error?.message,
        stack: error?.stack,
        cause: error?.cause,
      })
      
      // Show detailed error
      const errorMessage = error?.message || 'Unknown error'
      alert(`Failed to upload video:\n${errorMessage}\n\nCheck browser console for details.`)
    } finally {
      setUploading(false)
    }
  }

  return (
    <>
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
              <p className="text-xs text-white/50">MP4, MOV, AVI (MAX. 500MB)</p>
            </div>
            <input
              type="file"
              className="hidden"
              accept="video/*"
              onChange={handleFileChange}
              onClick={(e) => {
                // Reset value to allow selecting the same file again
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
          placeholder="Enter video description"
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
        <div className="upload-progress">
          <span className="spinner" aria-hidden />
          <div>
            <p className="font-semibold text-white">{uploadProgressText}</p>
            <p className="text-xs text-white/70">
              Uploads can take a few minutes for large videos. Keep this tab open while we transfer the file.
            </p>
          </div>
        </div>
      )}
      {uploadResponse && !uploadResponse.ok && (
        <div className="text-sm text-red-500">
          {uploadResponse.statusText || 'Upload failed'}
        </div>
      )}
      </form>

      <style jsx>{`
      .upload-progress {
        margin-top: 1rem;
        display: flex;
        align-items: center;
        gap: 0.75rem;
        padding: 0.75rem 1rem;
        border-radius: 0.75rem;
        background: rgba(0, 0, 0, 0.3);
        border: 1px solid rgba(137, 207, 240, 0.3);
      }

      .spinner {
        width: 32px;
        height: 32px;
        border-radius: 9999px;
        border: 4px solid rgba(137, 207, 240, 0.3);
        border-top-color: #89CFF0;
        animation: spin 0.9s linear infinite;
      }

      @keyframes spin {
        to {
          transform: rotate(360deg);
        }
      }
      `}</style>
    </>
  )
}
