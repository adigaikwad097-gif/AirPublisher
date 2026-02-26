/**
 * Verifies n8n webhook requests by checking the API key
 * n8n should send the API key in the 'x-n8n-api-key' header or 'Authorization' header
 */
export async function verifyN8nWebhook(request: Request | { headers: Headers }): Promise<boolean> {
  const apiKey = request.headers.get('x-n8n-api-key')
  const authHeader = request.headers.get('authorization')
  const expectedApiKey = import.meta.env.VITE_N8N_API_KEY || import.meta.env.N8N_API_KEY

  if (!expectedApiKey) {
    console.warn('[verifyN8nWebhook] N8N_API_KEY not configured')
    return false
  }

  // Check authentication
  const providedKey = apiKey || authHeader?.replace('Bearer ', '')

  if (!providedKey || providedKey !== expectedApiKey) {
    console.warn('[verifyN8nWebhook] Invalid API key provided')
    return false
  }

  return true
}
