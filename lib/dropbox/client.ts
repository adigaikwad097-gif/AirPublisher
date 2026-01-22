import { Dropbox } from 'dropbox'

/**
 * Get Dropbox access token using App Key/Secret (server-side, no OAuth)
 * Uses client credentials flow to get a token for server-side operations
 */
async function getDropboxAccessToken(): Promise<string | null> {
  // Priority: DROPBOX_ACCESS_TOKEN (direct token) > App Key/Secret
  if (process.env.DROPBOX_ACCESS_TOKEN) {
    console.log('[getDropboxAccessToken] ✅ Using DROPBOX_ACCESS_TOKEN from env (length:', process.env.DROPBOX_ACCESS_TOKEN.length, ')')
    return process.env.DROPBOX_ACCESS_TOKEN
  }

  // Fallback to App Key/Secret (not recommended, but supported)
  const appKey = process.env.DROPBOX_APP_KEY || process.env.DROPBOX_CLIENT_ID
  const appSecret = process.env.DROPBOX_APP_SECRET || process.env.DROPBOX_CLIENT_SECRET

  if (appKey && appSecret) {
    console.warn('[getDropboxAccessToken] ⚠️ Using App Key/Secret (DROPBOX_ACCESS_TOKEN preferred)')
    // Note: App Key/Secret alone won't work for uploads - need access token
    // This is just for logging
  }

  console.error('[getDropboxAccessToken] ❌ DROPBOX_ACCESS_TOKEN not set in environment variables')
  console.error('[getDropboxAccessToken] Please add DROPBOX_ACCESS_TOKEN to .env.local')
  console.error('[getDropboxAccessToken] Available env vars:', {
    hasAppKey: !!appKey,
    hasAppSecret: !!appSecret,
    hasAccessToken: false,
  })
  return null
}

/**
 * Create Dropbox client using App Key/Secret or Access Token
 */
export async function createDropboxClient(): Promise<Dropbox | null> {
  console.log('[createDropboxClient] Starting...')
  
  const accessToken = await getDropboxAccessToken()
  
  if (!accessToken) {
    console.error('[createDropboxClient] ❌ No access token available')
    return null
  }

  console.log('[createDropboxClient] ✅ Token found, creating Dropbox client (token length:', accessToken.length, ')')
  
  // Dropbox SDK needs fetch - use global fetch (Node.js 18+) or node-fetch
  let fetchImpl: typeof fetch
  if (typeof fetch !== 'undefined') {
    fetchImpl = fetch
    console.log('[createDropboxClient] Using global fetch')
  } else {
    // Fallback for older Node.js versions
    try {
      const nodeFetch = await import('node-fetch')
      fetchImpl = nodeFetch.default as any
      console.log('[createDropboxClient] Using node-fetch')
    } catch (e) {
      console.error('[createDropboxClient] ❌ No fetch implementation available')
      throw new Error('Dropbox SDK requires fetch. Please use Node.js 18+ or install node-fetch')
    }
  }
  
  const client = new Dropbox({
    accessToken,
    fetch: fetchImpl,
  })
  
  console.log('[createDropboxClient] ✅ Dropbox client created successfully')
  return client
}

/**
 * Get creator's Dropbox folder path
 * Format: {BASE_FOLDER}/creator_{creator_unique_identifier}
 * Base folder can be configured via DROPBOX_BASE_FOLDER env var (default: "airpublisher")
 */
export function getCreatorDropboxFolder(creatorUniqueIdentifier: string): string {
  const baseFolder = process.env.DROPBOX_BASE_FOLDER || 'airpublisher'
  return `/${baseFolder}/creator_${creatorUniqueIdentifier}`
}

/**
 * Upload file to Dropbox
 * Uses company Dropbox account, stores in creator-specific folder
 */
export async function uploadToDropbox(
  creatorUniqueIdentifier: string,
  file: File,
  fileName: string
): Promise<{ path: string; url: string }> {
  console.log('[uploadToDropbox] Starting upload...', {
    creatorId: creatorUniqueIdentifier,
    fileName,
    fileSize: file.size,
  })

  const dbx = await createDropboxClient()
  
  if (!dbx) {
    const errorMsg = 'Dropbox not configured. Please set DROPBOX_ACCESS_TOKEN in environment variables.'
    console.error('[uploadToDropbox]', errorMsg)
    throw new Error(errorMsg)
  }

  console.log('[uploadToDropbox] Dropbox client created successfully')

  // Get creator folder path
  const folderPath = getCreatorDropboxFolder(creatorUniqueIdentifier)
  const filePath = `${folderPath}/${fileName}`

  // Ensure base folder exists first (uses your existing "airpublisher" folder)
  const baseFolder = process.env.DROPBOX_BASE_FOLDER || 'airpublisher'
  const baseFolderPath = `/${baseFolder}`
  
  try {
    // Try to create base folder (will fail silently if it exists)
    await dbx.filesCreateFolderV2({ path: baseFolderPath })
  } catch (error: any) {
    // Base folder might already exist, that's okay
    if (!error?.error?.error_summary?.includes('path/conflict/folder')) {
      console.warn('[uploadToDropbox] Could not create base folder:', error)
    }
  }

  // Ensure creator folder exists (create if it doesn't)
  try {
    await dbx.filesCreateFolderV2({ path: folderPath })
  } catch (error: any) {
    // Folder might already exist, that's okay
    if (error?.error?.error_summary?.includes('path/conflict/folder')) {
      // Folder exists, continue
      console.log('[uploadToDropbox] Creator folder already exists:', folderPath)
    } else {
      console.warn('[uploadToDropbox] Could not create creator folder:', error)
      // Try to continue anyway - might work if parent exists
    }
  }

  // Convert File to ArrayBuffer (works in both Node.js and browser)
  const arrayBuffer = await file.arrayBuffer()
  
  // In Node.js, use Buffer. In browser, use Uint8Array
  let fileContents: Buffer | Uint8Array
  if (typeof Buffer !== 'undefined') {
    fileContents = Buffer.from(arrayBuffer)
  } else {
    fileContents = new Uint8Array(arrayBuffer)
  }

  // Upload file
  console.log('[uploadToDropbox] Uploading file to Dropbox...', { 
    filePath, 
    fileSize: fileContents.length,
    fileSizeMB: (fileContents.length / 1024 / 1024).toFixed(2) + ' MB'
  })
  
  let result
  try {
    // Dropbox upload with progress tracking
    result = await dbx.filesUpload({
      path: filePath,
      contents: fileContents as any, // Dropbox SDK accepts both
      mode: { '.tag': 'overwrite' },
    })
    console.log('[uploadToDropbox] ✅ File uploaded successfully:', (result as any).path_display)
  } catch (error: any) {
    console.error('[uploadToDropbox] File upload failed:', error)
    const errorMsg = error?.error?.error_summary || error?.message || 'Unknown error'
    console.error('[uploadToDropbox] Error details:', {
      error_summary: error?.error?.error_summary,
      error_tag: error?.error?.error?.tag,
      status: error?.status,
      message: error?.message,
    })
    throw new Error(`Dropbox upload failed: ${errorMsg}`)
  }

  // Get shared link (public URL)
  console.log('[uploadToDropbox] Creating shared link...')
  let sharedLink: any = null
  try {
    const linkResult = await dbx.sharingCreateSharedLinkWithSettings({
      path: (result as any).path_display || (result as any).path_lower || filePath,
      settings: {
        requested_visibility: { '.tag': 'public' },
      },
    })
    sharedLink = linkResult
    console.log('[uploadToDropbox] ✅ Shared link API response received')
    console.log('[uploadToDropbox] Full response:', JSON.stringify(linkResult, null, 2))
  } catch (error: any) {
    console.warn('[uploadToDropbox] Could not create shared link, attempting to get existing link')
    console.warn('[uploadToDropbox] Error:', {
      error_summary: error?.error?.error_summary,
      error_tag: error?.error?.error?.tag,
      message: error?.message,
    })
    // If shared link already exists, try to get it
    try {
      const listSharedLinksResult = await dbx.sharingListSharedLinks({ 
        path: (result as any).path_display || (result as any).path_lower || filePath 
      })
      console.log('[uploadToDropbox] List shared links response:', JSON.stringify(listSharedLinksResult, null, 2))
      
      if ((listSharedLinksResult as any).links && (listSharedLinksResult as any).links.length > 0) {
        sharedLink = (listSharedLinksResult as any).links[0]
        console.log('[uploadToDropbox] ✅ Found existing shared link')
      } else {
        console.warn('[uploadToDropbox] No existing shared links found')
      }
    } catch (listError: any) {
      console.error('[uploadToDropbox] Failed to list shared links:', {
        error_summary: listError?.error?.error_summary,
        error_tag: listError?.error?.error?.tag,
        message: listError?.message,
      })
    }
  }

  // Extract URL from response - try multiple possible locations
  // Dropbox SDK wraps the response in { status, headers, result }
  // The URL is in result.url
  const sharedLinkUrl = sharedLink?.result?.url || 
                        sharedLink?.url || 
                        sharedLink?.link?.url || 
                        sharedLink?.preview_url ||
                        sharedLink?.preview?.url ||
                        (sharedLink as any)?.url || null
  
  console.log('[uploadToDropbox] Extracted URL:', sharedLinkUrl || 'NOT FOUND')
  console.log('[uploadToDropbox] Shared link object:', sharedLink ? JSON.stringify(sharedLink, null, 2) : 'null')
  console.log('[uploadToDropbox] Shared link object keys:', sharedLink ? Object.keys(sharedLink) : 'null')
  
  if (!sharedLinkUrl) {
    console.error('[uploadToDropbox] ❌ Shared link response missing URL')
    console.error('[uploadToDropbox] Full sharedLink object:', JSON.stringify(sharedLink, null, 2))
    console.error('[uploadToDropbox] File was uploaded to:', (result as any).path_display || (result as any).path_lower || filePath)
    
    // As a workaround, we can construct a Dropbox URL manually, but it won't be a direct download link
    // The user will need to create a shared link manually or we need to fix the API call
    const fallbackUrl = `https://www.dropbox.com/home${(result as any).path_display || (result as any).path_lower || filePath}`
    console.warn('[uploadToDropbox] ⚠️ Using fallback URL (may not work for direct access):', fallbackUrl)
    
    throw new Error('Failed to get shared link URL from Dropbox. The file was uploaded successfully, but a public URL could not be generated. Please check Dropbox API permissions or create a shared link manually.')
  }

  // Convert shared link to direct download URL for video playback
  // Dropbox shared links need ?dl=1 for direct download, but HTML5 video players
  // work better with the raw content URL format
  let directUrl = sharedLinkUrl
  
  // Replace ?dl=0 with ?dl=1 for direct download
  if (directUrl.includes('?dl=0')) {
    directUrl = directUrl.replace('?dl=0', '?dl=1')
  } else if (!directUrl.includes('?dl=')) {
    // If no dl parameter, add ?dl=1
    directUrl = directUrl + (directUrl.includes('?') ? '&dl=1' : '?dl=1')
  }
  
  // For better video playback, we can also try the raw content URL format
  // But the ?dl=1 format should work for most cases

  console.log('[uploadToDropbox] ✅ Upload complete:', { path: (result as any).path_display, url: directUrl })

  return {
    path: (result as any).path_display || (result as any).path_lower || filePath,
    url: directUrl,
  }
}
