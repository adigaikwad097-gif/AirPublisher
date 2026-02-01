'use client'

import { useEffect, useState } from 'react'
import { AlertCircle } from 'lucide-react'

interface RefreshTokenStatusProps {
  platform: 'youtube' | 'instagram' | 'tiktok'
  isConnected: boolean
  accessTokenExpired: boolean
  hasRefreshToken: boolean
}

export function RefreshTokenStatus({ 
  platform, 
  isConnected, 
  accessTokenExpired, 
  hasRefreshToken 
}: RefreshTokenStatusProps) {
  const [refreshTokenExpired, setRefreshTokenExpired] = useState(false)
  const [checking, setChecking] = useState(false)

  useEffect(() => {
    // Only check if connected and access token is expired
    if (!isConnected || !accessTokenExpired || !hasRefreshToken) {
      return
    }

    // Check refresh token status by attempting a refresh
    const checkRefreshToken = async () => {
      setChecking(true)
      try {
        // Try to refresh token via API (no creator_unique_identifier needed - API gets it from session)
        const response = await fetch(`/api/n8n/refresh-token`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            platform,
          }),
        })

        const data = await response.json()
        
        // Only show "Refresh Token Expired" if explicitly indicated by requires_reconnection
        // Don't show it for other errors (network, auth, etc.) as those don't mean the refresh token is expired
        if (data.requires_reconnection === true) {
          setRefreshTokenExpired(true)
        } else if (data.success === true) {
          // Token refreshed successfully
          setRefreshTokenExpired(false)
        } else {
          // Other error - don't assume refresh token is expired
          // The edge function cron jobs will handle automatic refresh
          setRefreshTokenExpired(false)
        }
      } catch (error) {
        console.error(`[RefreshTokenStatus] Error checking ${platform}:`, error)
        // On network/API error, don't assume refresh token is expired
        // The edge function cron jobs will handle automatic refresh
        setRefreshTokenExpired(false)
      } finally {
        setChecking(false)
      }
    }

    checkRefreshToken()
  }, [platform, isConnected, accessTokenExpired, hasRefreshToken])

  // If refresh token is expired, show warning
  if (refreshTokenExpired) {
    return (
      <div className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
        <div className="flex items-start gap-2">
          <AlertCircle className="h-4 w-4 text-yellow-400 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm text-yellow-400 font-semibold mb-1">⚠️ Refresh Token Expired</p>
            <p className="text-xs text-yellow-300/80">
              Your refresh token has expired. Please update your connection to continue automatic posting.
            </p>
          </div>
        </div>
      </div>
    )
  }

  // If access token is expired but refresh token is valid, show info
  if (accessTokenExpired && hasRefreshToken && !refreshTokenExpired) {
    return (
      <p className="text-sm text-[#89CFF0]">Token will be automatically refreshed when needed.</p>
    )
  }

  return null
}

