'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Share2, Loader2 } from 'lucide-react'

interface ConnectAccountsButtonProps {
  creatorUniqueIdentifier: string
  hasProfile: boolean
}

export function ConnectAccountsButton({
  creatorUniqueIdentifier,
  hasProfile,
}: ConnectAccountsButtonProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleConnect = async () => {
    if (!hasProfile) {
      setError('Please wait while we set up your Ayrshare profile...')
      return
    }

    setLoading(true)
    setError(null)

    try {
      // Get connect URL from our API
      const response = await fetch(
        `/api/ayrshare/connect?creator_unique_identifier=${encodeURIComponent(creatorUniqueIdentifier)}`
      )

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to generate connect URL')
      }

      const data = await response.json()

      if (!data.connectUrl) {
        throw new Error('No connect URL received')
      }

      // Open Ayrshare's OAuth page in a new window
      // User will authorize their accounts there
      const connectWindow = window.open(
        data.connectUrl,
        'Connect Accounts',
        'width=600,height=700,scrollbars=yes,resizable=yes'
      )

      // Optional: Listen for connection completion
      // Ayrshare will redirect to your redirect_url when done
      // You can poll or use a webhook to check connection status

      if (!connectWindow) {
        throw new Error('Popup blocked. Please allow popups for this site.')
      }

      // Check if window was closed (user completed or cancelled)
      const checkClosed = setInterval(() => {
        if (connectWindow.closed) {
          clearInterval(checkClosed)
          setLoading(false)
          // Refresh the page to show updated connection status
          window.location.reload()
        }
      }, 1000)
    } catch (err: any) {
      console.error('Connect error:', err)
      setError(err.message || 'Failed to connect accounts')
      setLoading(false)
    }
  }

  return (
    <div className="space-y-2">
      <Button
        onClick={handleConnect}
        disabled={loading || !hasProfile}
        className="w-full bg-blue-500 hover:bg-blue-600"
      >
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Opening connection page...
          </>
        ) : (
          <>
            <Share2 className="mr-2 h-4 w-4" />
            Connect Social Accounts
          </>
        )}
      </Button>
      {error && (
        <p className="text-sm text-red-400">{error}</p>
      )}
      {!hasProfile && (
        <p className="text-sm text-foreground/50">
          Setting up your profile...
        </p>
      )}
    </div>
  )
}


