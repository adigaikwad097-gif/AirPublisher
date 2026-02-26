/**
 * Get the application base URL
 * 
 * Priority:
 * 1. NEXT_PUBLIC_APP_URL (manually set - takes precedence for OAuth consistency)
 * 2. VERCEL_URL (automatically set by Vercel) - format: "your-app.vercel.app" (no protocol)
 * 3. localhost (development fallback)
 * 
 * Note: NEXT_PUBLIC_APP_URL is prioritized because it ensures OAuth redirect URIs
 * match exactly what's configured in OAuth app settings, avoiding domain mismatches
 * between deployment URLs (with hash) and project URLs.
 * 
 * For live server deployment, set NEXT_PUBLIC_APP_URL=http://93.127.216.83:3003
 * (or https:// if SSL is configured)
 */
export function getAppUrl(): string {
  if (import.meta.env.VITE_APP_URL) {
    const url = import.meta.env.VITE_APP_URL.trim().replace(/\/$/, '') // Remove trailing slash
    console.log('[getAppUrl] Using VITE_APP_URL:', url)
    return url
  }

  // Development fallback
  console.log('[getAppUrl] Using localhost fallback')
  return 'http://localhost:8000'
}

/**
 * Check if running on Vercel
 */
export function isVercel(): boolean {
  return false
}

/**
 * Check if running in development (local)
 */
export function isDevelopment(): boolean {
  return import.meta.env.DEV || import.meta.env.MODE === 'development'
}

/**
 * Check if running via ngrok (development tunnel)
 */
export function isNgrok(): boolean {
  const appUrl = getAppUrl()
  return appUrl.includes('ngrok') || appUrl.includes('ngrok-free.dev')
}

