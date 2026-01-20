/**
 * Get the application base URL
 * 
 * Priority:
 * 1. VERCEL_URL (automatically set by Vercel)
 * 2. NEXT_PUBLIC_APP_URL (manually set)
 * 3. localhost (development fallback)
 */
export function getAppUrl(): string {
  // Vercel automatically provides VERCEL_URL
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`
  }
  
  // Fallback to manually set URL
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL
  }
  
  // Development fallback
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

