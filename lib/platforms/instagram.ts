/**
 * Instagram Native API
 * Post videos/photos to Instagram using Graph API
 */

export interface InstagramPostParams {
  caption: string
  mediaUrl: string
  mediaType: 'IMAGE' | 'VIDEO' | 'REELS' | 'CAROUSEL'
  thumbnailUrl?: string
  accessToken: string
  instagramBusinessAccountId: string
}

export interface InstagramPostResponse {
  id: string
  permalink: string
}

/**
 * Post to Instagram
 * Uses Instagram Graph API
 */
export async function postToInstagram(
  params: InstagramPostParams
): Promise<InstagramPostResponse> {
  const { accessToken, instagramBusinessAccountId, caption, mediaUrl, mediaType } = params

  // Step 1: Create media container
  const containerResponse = await fetch(
    `https://graph.facebook.com/v18.0/${instagramBusinessAccountId}/media`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        caption,
        media_type: mediaType,
        video_url: mediaType === 'VIDEO' || mediaType === 'REELS' ? mediaUrl : undefined,
        image_url: mediaType === 'IMAGE' ? mediaUrl : undefined,
        thumb_offset: params.thumbnailUrl ? 0 : undefined,
        access_token: accessToken,
      }),
    }
  )

  if (!containerResponse.ok) {
    const error = await containerResponse.json()
    throw new Error(`Instagram API error: ${error.error?.message || 'Unknown error'}`)
  }

  const container = await containerResponse.json()
  const creationId = container.id

  // Step 2: Publish the container
  const publishResponse = await fetch(
    `https://graph.facebook.com/v18.0/${instagramBusinessAccountId}/media_publish`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        creation_id: creationId,
        access_token: accessToken,
      }),
    }
  )

  if (!publishResponse.ok) {
    const error = await publishResponse.json()
    throw new Error(`Instagram publish error: ${error.error?.message || 'Unknown error'}`)
  }

  const result = await publishResponse.json()

  // Step 3: Get permalink
  const permalinkResponse = await fetch(
    `https://graph.facebook.com/v18.0/${result.id}?fields=permalink&access_token=${accessToken}`
  )

  const permalinkData = await permalinkResponse.json()

  return {
    id: result.id,
    permalink: permalinkData.permalink || `https://www.instagram.com/p/${result.id}/`,
  }
}



