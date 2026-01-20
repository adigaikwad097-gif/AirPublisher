/**
 * Ayrshare Account Connection
 * Generates connect URLs for users to link their social accounts
 * Documentation: https://www.ayrshare.com/docs/multiple-users/api-integration-business
 */

const AYRSHARE_API_BASE = 'https://api.ayrshare.com/api'

export interface ConnectUrlResponse {
  connectUrl: string
  expiresAt: string
}

/**
 * Generate a connect URL for a user to link their social accounts
 * This opens Ayrshare's branded OAuth page where users authorize
 * 
 * @param profileKey - User's Ayrshare profile key
 * @param apiKey - Ayrshare master API key
 * @param platforms - Optional: specific platforms to connect (default: all)
 * @param redirectUrl - Optional: where to redirect after connection
 */
export async function generateConnectUrl(
  profileKey: string,
  apiKey: string,
  platforms?: string[],
  redirectUrl?: string
): Promise<ConnectUrlResponse> {
  if (!apiKey) {
    throw new Error('AYRSHARE_API_KEY is required')
  }

  if (!profileKey) {
    throw new Error('Profile key is required')
  }

  const response = await fetch(`${AYRSHARE_API_BASE}/connect`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'Profile-Key': profileKey,
    },
    body: JSON.stringify({
      platforms: platforms || [], // Empty array = all platforms
      redirectUrl: redirectUrl || undefined,
    }),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Unknown error' }))
    throw new Error(`Ayrshare API error: ${error.message || response.statusText}`)
  }

  return response.json()
}

/**
 * Alternative: Generate JWT for connect flow
 * Some Ayrshare plans use JWT instead of connect endpoint
 */
export async function generateConnectJWT(
  profileKey: string,
  apiKey: string
): Promise<{ jwt: string; connectUrl: string }> {
  if (!apiKey) {
    throw new Error('AYRSHARE_API_KEY is required')
  }

  if (!profileKey) {
    throw new Error('Profile key is required')
  }

  const response = await fetch(`${AYRSHARE_API_BASE}/generateJWT`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'Profile-Key': profileKey,
    },
    body: JSON.stringify({
      // JWT generation options
    }),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Unknown error' }))
    throw new Error(`Ayrshare API error: ${error.message || response.statusText}`)
  }

  return response.json()
}


