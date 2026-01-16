/**
 * n8n Webhook Utilities
 * Handles webhook verification and security
 */

/**
 * Verify n8n webhook signature
 * You can implement HMAC verification if n8n is configured to send signatures
 * For now, using a simple API key check
 */
export async function verifyN8nWebhook(request: Request): Promise<boolean> {
  // Option 1: API Key in header
  const apiKey = request.headers.get('x-n8n-api-key')
  if (apiKey && apiKey === process.env.N8N_API_KEY) {
    return true
  }

  // Option 2: Bearer token
  const authHeader = request.headers.get('authorization')
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.substring(7)
    if (token === process.env.N8N_API_KEY) {
      return true
    }
  }

  // Option 3: HMAC signature verification (if n8n sends it)
  const signature = request.headers.get('x-n8n-signature')
  if (signature && process.env.N8N_WEBHOOK_SECRET) {
    // Implement HMAC verification here if needed
    // const body = await request.text()
    // const expectedSignature = createHmac('sha256', process.env.N8N_WEBHOOK_SECRET)
    //   .update(body)
    //   .digest('hex')
    // return signature === expectedSignature
  }

  // In development, allow if no key is set (for testing)
  if (process.env.NODE_ENV === 'development' && !process.env.N8N_API_KEY) {
    console.warn('⚠️  n8n webhook verification disabled in development')
    return true
  }

  return false
}

/**
 * Extract webhook payload with error handling
 */
export async function getWebhookPayload<T = any>(
  request: Request
): Promise<T> {
  try {
    return await request.json()
  } catch (error) {
    throw new Error('Invalid JSON payload')
  }
}

