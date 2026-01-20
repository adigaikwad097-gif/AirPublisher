/**
 * TikTok Native API
 * Post videos to TikTok using TikTok API
 */

export interface TikTokPostParams {
  description: string
  videoUrl: string
  privacyLevel: 'PUBLIC_TO_EVERYONE' | 'MUTUAL_FOLLOW_FRIEND' | 'PRIVATE'
  accessToken: string
  openId: string
}

export interface TikTokPostResponse {
  publish_id: string
  upload_url: string
}

/**
 * Post to TikTok
 * Uses TikTok Video Upload API
 */
export async function postToTikTok(
  params: TikTokPostParams
): Promise<TikTokPostResponse> {
  const { accessToken, openId, description, videoUrl, privacyLevel } = params

  // Step 1: Initialize upload
  const initResponse = await fetch(
    'https://open.tiktokapis.com/v2/post/publish/video/init/',
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        post_info: {
          title: description,
          privacy_level: privacyLevel,
          disable_duet: false,
          disable_comment: false,
          disable_stitch: false,
          video_cover_timestamp_ms: 1000,
        },
        source_info: {
          source: 'FILE_UPLOAD',
        },
      }),
    }
  )

  if (!initResponse.ok) {
    const error = await initResponse.json()
    throw new Error(`TikTok API error: ${error.error?.message || 'Unknown error'}`)
  }

  const initData = await initResponse.json()
  const publishId = initData.data.publish_id
  const uploadUrl = initData.data.upload_url

  // Step 2: Upload video file
  // Note: TikTok requires direct file upload, not URL
  // You'll need to download the video first or use n8n for this

  // Step 3: Confirm upload
  const confirmResponse = await fetch(
    `https://open.tiktokapis.com/v2/post/publish/status/fetch/`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        publish_id: publishId,
      }),
    }
  )

  if (!confirmResponse.ok) {
    const error = await confirmResponse.json()
    throw new Error(`TikTok confirm error: ${error.error?.message || 'Unknown error'}`)
  }

  return {
    publish_id: publishId,
    upload_url: uploadUrl,
  }
}


