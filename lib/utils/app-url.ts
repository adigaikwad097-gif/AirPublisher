/**
 * Get the application base URL
 * 
 * Priority:
 * 1. VERCEL_URL (automatically set by Vercel) - format: "your-app.vercel.app" (no protocol)
 * 2. NEXT_PUBLIC_APP_URL (manually set)
 * 3. localhost (development fallback)
 */
export function getAppUrl(): string {
  // Vercel automatically provides VERCEL_URL (just the domain, no protocol)
  if (process.env.VERCEL_URL) {
    const vercelUrl = process.env.VERCEL_URL.trim()
    // VERCEL_URL is just the domain, add https://
    const url = vercelUrl.startsWith('http') ? vercelUrl : `https://${vercelUrl}`
    console.log('[getAppUrl] Using VERCEL_URL:', { VERCEL_URL: vercelUrl, finalUrl: url })
    return url
  }
  
  // Fallback to manually set URL
  if (process.env.NEXT_PUBLIC_APP_URL) {
    const url = process.env.NEXT_PUBLIC_APP_URL.trim()
    console.log('[getAppUrl] Using NEXT_PUBLIC_APP_URL:', url)
    return url
  }
  
  // Development fallback
  console.log('[getAppUrl] Using localhost fallback')
  return 'http://localhost:3000'
}

/**
 * Check if running on Vercel
 */
export function isVercel(): boolean {
  return !!process.env.VERCEL_URL || !!process.env.VERCEL
}

/**
 * Check if running in development (local)
 */
export function isDevelopment(): boolean {
  return process.env.NODE_ENV === 'development' && !isVercel()
}

/**
 * Check if running via ngrok (development tunnel)
 */
export function isNgrok(): boolean {
  const appUrl = getAppUrl()
  return appUrl.includes('ngrok') || appUrl.includes('ngrok-free.dev')
}

