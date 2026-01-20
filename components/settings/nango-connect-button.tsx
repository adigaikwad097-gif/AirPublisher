'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Share2, Loader2, CheckCircle2 } from 'lucide-react'
import { NangoFrontend } from '@nangohq/frontend'
import type { Platform } from '@/lib/nango/client'

interface NangoConnectButtonProps {
  platform: Platform
  platformName: string
  isConnected: boolean
  userId: string
}

export function NangoConnectButton({
  platform,
  platformName,
  isConnected,
  userId,
}: NangoConnectButtonProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleConnect = async () => {
    setLoading(true)
    setError(null)

    try {
      const publicKey = process.env.NEXT_PUBLIC_NANGO_PUBLIC_KEY
      if (!publicKey) {
        throw new Error('Nango not configured')
      }

      // Initialize Nango frontend
      const nango = new NangoFrontend({ publicKey })
      
      // Get provider name
      const provider = platform === 'youtube' ? 'google' : platform === 'instagram' ? 'facebook' : 'tiktok'
      const connectionId = `${userId}_${platform}`

      // Open OAuth flow (embedded in your app!)
      await nango.auth(provider, connectionId, {
        // Optional: Customize the OAuth UI
        // This opens an embedded modal, not a popup!
      })

      // Connection successful - refresh page to show updated status
      window.location.reload()
    } catch (err: any) {
      console.error('Nango connect error:', err)
      setError(err.message || 'Failed to connect account')
      setLoading(false)
    }
  }

  if (isConnected) {
    return (
      <div className="flex items-center gap-2 text-green-400">
        <CheckCircle2 className="h-4 w-4" />
        <span className="text-sm">Connected</span>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <Button
        onClick={handleConnect}
        disabled={loading}
        variant="outline"
        size="sm"
      >
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Connecting...
          </>
        ) : (
          <>
            <Share2 className="mr-2 h-4 w-4" />
            Connect {platformName}
          </>
        )}
      </Button>
      {error && (
        <p className="text-xs text-red-400">{error}</p>
      )}
    </div>
  )
}


