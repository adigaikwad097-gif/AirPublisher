/**
 * Buffer API Client
 * Handles all interactions with Buffer API for posting to social media platforms
 */

const BUFFER_API_BASE = 'https://api.bufferapp.com/1'

export interface BufferProfile {
  id: string
  service: 'youtube' | 'instagram' | 'tiktok' | 'facebook' | 'twitter' | 'linkedin' | 'pinterest'
  service_username: string
  service_id: string
  avatar: string
  formatted_username: string
}

export interface CreatePostParams {
  text: string
  profile_ids: string[]
  media?: {
    link?: string
    photo?: string
    thumbnail?: string
    description?: string
  }
  scheduled_at?: string // ISO timestamp
  now?: boolean // Post immediately
  top?: boolean // Pin to top
  shorten?: boolean // Shorten links
}

export interface BufferPost {
  id: string
  created_at: number
  day: string
  due_at: number
  due_time: string
  media: {
    link?: string
    photo?: string
    thumbnail?: string
    description?: string
  }
  profile_id: string
  profile_service: string
  status: 'sent' | 'pending' | 'failed'
  text: string
  text_formatted: string
  type: string
  user_id: string
  via: string
}

/**
 * Get user's Buffer profiles (connected social accounts)
 */
export async function getBufferProfiles(accessToken: string): Promise<BufferProfile[]> {
  const response = await fetch(`${BUFFER_API_BASE}/profiles.json?access_token=${accessToken}`)
  
  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Failed to fetch Buffer profiles: ${error}`)
  }

  const data = await response.json()
  return data as BufferProfile[]
}

/**
 * Get a specific profile by ID
 */
export async function getBufferProfile(
  accessToken: string,
  profileId: string
): Promise<BufferProfile> {
  const response = await fetch(
    `${BUFFER_API_BASE}/profiles/${profileId}.json?access_token=${accessToken}`
  )

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Failed to fetch Buffer profile: ${error}`)
  }

  const data = await response.json()
  return data as BufferProfile
}

/**
 * Create a post via Buffer API
 */
export async function createBufferPost(
  accessToken: string,
  params: CreatePostParams
): Promise<BufferPost> {
  const formData = new URLSearchParams()
  formData.append('text', params.text)
  formData.append('profile_ids[]', params.profile_ids.join(','))
  
  if (params.media) {
    if (params.media.link) formData.append('media[link]', params.media.link)
    if (params.media.photo) formData.append('media[photo]', params.media.photo)
    if (params.media.thumbnail) formData.append('media[thumbnail]', params.media.thumbnail)
    if (params.media.description) formData.append('media[description]', params.media.description)
  }
  
  if (params.scheduled_at) {
    formData.append('scheduled_at', params.scheduled_at)
  }
  
  if (params.now) {
    formData.append('now', 'true')
  }

  const response = await fetch(`${BUFFER_API_BASE}/updates/create.json`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: formData.toString(),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Failed to create Buffer post: ${error}`)
  }

  const data = await response.json()
  return data.updates?.[0] as BufferPost
}

/**
 * Get post status
 */
export async function getBufferPost(
  accessToken: string,
  updateId: string
): Promise<BufferPost> {
  const response = await fetch(
    `${BUFFER_API_BASE}/updates/${updateId}.json?access_token=${accessToken}`
  )

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Failed to fetch Buffer post: ${error}`)
  }

  const data = await response.json()
  return data as BufferPost
}

/**
 * Get pending posts for a profile
 */
export async function getPendingPosts(
  accessToken: string,
  profileId?: string
): Promise<BufferPost[]> {
  let url = `${BUFFER_API_BASE}/updates/pending.json?access_token=${accessToken}`
  if (profileId) {
    url += `&profile_id=${profileId}`
  }

  const response = await fetch(url)

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Failed to fetch pending posts: ${error}`)
  }

  const data = await response.json()
  return data.updates || []
}

/**
 * Get sent posts for a profile
 */
export async function getSentPosts(
  accessToken: string,
  profileId?: string,
  count: number = 20
): Promise<BufferPost[]> {
  let url = `${BUFFER_API_BASE}/updates/sent.json?access_token=${accessToken}&count=${count}`
  if (profileId) {
    url += `&profile_id=${profileId}`
  }

  const response = await fetch(url)

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Failed to fetch sent posts: ${error}`)
  }

  const data = await response.json()
  return data.updates || []
}


