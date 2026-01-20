'use client'

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'

/**
 * Client component to refresh page when success parameter is present
 * This ensures the connections page shows updated status after OAuth
 */
export function RefreshOnSuccess({ success }: { success?: string | null }) {
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (success) {
      // Wait a moment for any server-side updates, then do a hard refresh
      // Hard refresh ensures we get fresh data from the server
      const timer = setTimeout(() => {
        // Remove the success parameter from URL first
        const url = new URL(window.location.href)
        url.searchParams.delete('success')
        window.history.replaceState({}, '', url.toString())
        
        // Do a hard refresh to ensure fresh data
        window.location.reload()
      }, 1000)

      return () => clearTimeout(timer)
    }
  }, [success, router, pathname])

  return null
}

