import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { Database } from '@/lib/supabase/types'

// Increase timeout for large file uploads (5 minutes)
export const maxDuration = 300
export const config = {
  api: {
    bodyParser: false,
    sizeLimit: '500mb',
  },
}

/**
 * Upload video file via n8n to Dropbox
 * Sends file to n8n webhook, which handles Dropbox upload and folder creation
 * n8n will call back to /api/webhooks/n8n/upload-complete with the Dropbox URL
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  console.log('[upload] ===== UPLOAD REQUEST RECEIVED =====')
  console.log('[upload] Request method:', request.method)
  console.log('[upload] Request URL:', request.url)
  
  // Check n8n webhook URL for Dropbox uploads
  const n8nWebhookUrl = process.env.N8N_WEBHOOK_URL_DROPBOX_UPLOAD
  console.log('[upload] n8n webhook check:', {
    hasWebhookUrl: !!n8nWebhookUrl,
    nodeEnv: process.env.NODE_ENV,
  })
  
  if (!n8nWebhookUrl) {
    console.error('[upload] ❌ N8N_WEBHOOK_URL_DROPBOX_UPLOAD not set in environment variables')
    return NextResponse.json(
      { 
        error: 'n8n Dropbox upload webhook not configured. Please set N8N_WEBHOOK_URL_DROPBOX_UPLOAD in environment variables.',
        details: 'Check .env.local file and restart dev server',
      },
      { status: 500 }
    )
  }

  try {
    const resolvedParams = params instanceof Promise ? await params : params
    const videoId = resolvedParams.id

    if (!videoId) {
      return NextResponse.json(
        { error: 'Video ID is required' },
        { status: 400 }
      )
    }

    // Get the file from FormData
    console.log('[upload] Parsing FormData...')
    console.log('[upload] Content-Type:', request.headers.get('content-type'))
    console.log('[upload] Content-Length:', request.headers.get('content-length'))
    
    // Add timeout handling for large files
    const formDataParseStart = Date.now()
    const formData = await request.formData()
    const formDataParseTime = Date.now() - formDataParseStart
    console.log('[upload] FormData parsed in', formDataParseTime, 'ms')
    
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    console.log('[upload] File received:', {
      videoId,
      fileName: file.name,
      fileSize: file.size,
      fileSizeMB: (file.size / 1024 / 1024).toFixed(2) + ' MB',
      fileType: file.type,
    })

    // Generate storage path: creator-id/video-id/filename
    const supabase = await createClient()
    
    console.log('[upload] Looking up video:', videoId)
    
    // Try to get video with regular client first
    let video = null
    let videoError = null
    
    try {
      const { data, error } = await (supabase
        .from('air_publisher_videos') as any)
        .select('creator_unique_identifier, id, title')
        .eq('id', videoId)
        .single()

      video = data
      videoError = error
      
      if (error) {
        console.error('[upload] Regular client error fetching video:', {
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint,
        })
      }
    } catch (e: any) {
      console.error('[upload] Exception fetching video:', e)
      videoError = e
    }

    // If regular client fails, try service role (might be RLS blocking)
    if (videoError || !video) {
      console.log('[upload] Regular client failed, trying service role...')
      
      if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
        return NextResponse.json(
          { 
            error: 'Video not found and service role key not configured',
            details: videoError?.message || 'Unknown error',
          },
          { status: 404 }
        )
      }

      const serviceClient = createServiceClient<Database>(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      )

      const { data: serviceVideo, error: serviceError } = await (serviceClient
        .from('air_publisher_videos') as any)
        .select('creator_unique_identifier, id, title')
        .eq('id', videoId)
        .single()

      if (serviceError || !serviceVideo) {
        console.error('[upload] Service client also failed:', {
          error: serviceError?.message || 'No video found',
          videoId,
        })
        return NextResponse.json(
          { 
            error: 'Video not found',
            details: serviceError?.message || 'Video does not exist in database',
            videoId,
          },
          { status: 404 }
        )
      }

      video = serviceVideo
      console.log('[upload] ✅ Found video via service role:', video.id)
    } else {
      console.log('[upload] ✅ Found video via regular client:', video.id)
    }

    // Create file name
    const fileExtension = file.name.split('.').pop() || 'mp4'
    const fileName = `${videoId}.${fileExtension}`

    // Prepare file for sending to n8n
    console.log('[upload] Preparing file for n8n upload...', {
      creatorId: video.creator_unique_identifier,
      fileName,
      fileSize: file.size,
      fileSizeMB: (file.size / 1024 / 1024).toFixed(2) + ' MB',
    })

    // Send file to n8n webhook as FormData
    // n8n will handle Dropbox upload, folder creation, and call back with the URL
    console.log('[upload] Sending file to n8n webhook...', {
      webhookUrl: n8nWebhookUrl,
      videoId,
      creatorId: video.creator_unique_identifier,
    })

    let n8nResponse
    try {
      // Create FormData with file and metadata
      const formData = new FormData()
      formData.append('file', file, fileName)
      formData.append('video_id', videoId)
      formData.append('creator_unique_identifier', video.creator_unique_identifier)
      formData.append('file_name', fileName)
      // Get app URL (automatically uses Vercel URL if deployed)
      const { getAppUrl } = await import('@/lib/utils/app-url')
      const appUrl = getAppUrl()
      formData.append('callback_url', `${appUrl}/api/webhooks/n8n/upload-complete`)

      // Note: n8n webhook can be public (no auth needed to send TO n8n)
      // API key is only needed when n8n calls BACK to your app (for security)
      const headers: Record<string, string> = {}
      
      // Optional: Add n8n API key if your webhook requires authentication
      // Most n8n webhooks are public by default, so this is usually not needed
      const n8nApiKey = process.env.N8N_API_KEY
      if (n8nApiKey) {
        headers['x-n8n-api-key'] = n8nApiKey
      }

      // Don't set Content-Type header - browser will set it with boundary for FormData
      // Log what we're sending for debugging
      console.log('[upload] ===== SENDING TO N8N =====')
      console.log('[upload] Webhook URL:', n8nWebhookUrl)
      console.log('[upload] FormData keys:', Array.from(formData.keys()))
      console.log('[upload] File info:', {
        name: fileName,
        size: file.size,
        type: file.type,
      })
      console.log('[upload] Metadata:', {
        video_id: videoId,
        creator_id: video.creator_unique_identifier,
        callback_url: `${appUrl}/api/webhooks/n8n/upload-complete`,
      })
      console.log('[upload] Headers being sent:', Object.keys(headers))
      
      const fetchStartTime = Date.now()
      console.log('[upload] Starting fetch request to n8n...')
      
      try {
        n8nResponse = await fetch(n8nWebhookUrl, {
          method: 'POST',
          headers,
          body: formData,
        })
        
        const fetchDuration = Date.now() - fetchStartTime
        console.log('[upload] ✅ Fetch completed in', fetchDuration, 'ms')
        console.log('[upload] n8n response status:', n8nResponse.status, n8nResponse.statusText)
        console.log('[upload] n8n response headers:', Object.fromEntries(n8nResponse.headers.entries()))
      } catch (fetchError: any) {
        const fetchDuration = Date.now() - fetchStartTime
        console.error('[upload] ❌ Fetch failed after', fetchDuration, 'ms')
        console.error('[upload] Fetch error details:', {
          name: fetchError?.name,
          message: fetchError?.message,
          cause: fetchError?.cause,
          stack: fetchError?.stack,
        })
        throw new Error(`Failed to send request to n8n: ${fetchError?.message || 'Unknown error'}`)
      }

      if (!n8nResponse.ok) {
        const errorText = await n8nResponse.text()
        let parsedError
        try {
          parsedError = JSON.parse(errorText)
        } catch {
          parsedError = { message: errorText }
        }
        
        console.error('[upload] n8n webhook error:', {
          status: n8nResponse.status,
          statusText: n8nResponse.statusText,
          error: parsedError,
          webhookUrl: n8nWebhookUrl,
        })

        // Provide helpful error messages based on status code
        let errorMessage = 'Failed to send file to n8n'
        let troubleshooting = ''

        if (n8nResponse.status === 404) {
          errorMessage = 'n8n webhook not found (404)'
          troubleshooting = `
Troubleshooting steps:
1. Check that N8N_WEBHOOK_URL_DROPBOX_UPLOAD is set correctly in .env.local
2. Verify the webhook URL in n8n matches exactly
3. Make sure the webhook is ACTIVE (green/active status in n8n)
4. Check that the webhook is configured for POST method (not GET)
5. Verify the webhook path is correct
6. Restart your dev server after adding the env variable

Current webhook URL: ${n8nWebhookUrl || 'NOT SET'}
`
        } else if (n8nResponse.status === 401 || n8nResponse.status === 403) {
          errorMessage = 'n8n webhook authentication failed'
          troubleshooting = 'Check if your n8n webhook requires authentication and verify N8N_API_KEY is set correctly'
        } else {
          troubleshooting = `n8n returned status ${n8nResponse.status}: ${parsedError.message || errorText}`
        }

        return NextResponse.json(
          { 
            error: errorMessage,
            details: parsedError.message || errorText,
            troubleshooting,
            webhook_url: n8nWebhookUrl,
            status_code: n8nResponse.status,
          },
          { status: 500 }
        )
      }

      // Try to parse response as JSON, but handle non-JSON responses
      let n8nResult
      const responseText = await n8nResponse.text()
      console.log('[upload] n8n response body (first 500 chars):', responseText.substring(0, 500))
      
      try {
        n8nResult = responseText ? JSON.parse(responseText) : {}
        console.log('[upload] ✅ File sent to n8n successfully:', {
          n8nResponse: n8nResult,
        })
      } catch (parseError) {
        console.warn('[upload] ⚠️ n8n response is not JSON:', responseText.substring(0, 200))
        n8nResult = { message: 'Response received but not JSON', raw: responseText.substring(0, 200) }
      }

      // n8n will process the file and call back to /api/webhooks/n8n/upload-complete
      // For now, return success - the video_url will be updated when n8n calls back
      return NextResponse.json({
        success: true,
        message: 'File sent to n8n for Dropbox upload. Video URL will be updated when upload completes.',
        video_id: videoId,
        status: 'uploading',
        // If n8n returns the URL immediately, include it
        video_url: n8nResult.video_url || null,
      })
    } catch (error: any) {
      console.error('[upload] Error sending file to n8n:', error)
      return NextResponse.json(
        { 
          error: error.message || 'Failed to send file to n8n',
          details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
        },
        { status: 500 }
      )
    }
  } catch (error: any) {
      console.error('[upload] Upload error:', error)
      console.error('[upload] Error stack:', error?.stack)
      console.error('[upload] Error details:', {
        message: error?.message,
        name: error?.name,
        cause: error?.cause,
      })
    
    // Return detailed error in development
    const errorResponse = {
      error: error.message || 'Failed to upload file',
      details: process.env.NODE_ENV === 'development' ? {
        message: error?.message,
        stack: error?.stack,
        name: error?.name,
      } : undefined,
    }
    
    return NextResponse.json(errorResponse, { status: 500 })
  }
}

