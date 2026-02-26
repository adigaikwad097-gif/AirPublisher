

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Globe, Calendar, Clock, Music, Youtube, Instagram } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useModal } from '@/components/providers/modal-provider'

interface PlatformSelectButtonProps {
  videoId: string
  creatorUniqueIdentifier: string
}

type Platform = 'internal' | 'youtube' | 'instagram' | 'tiktok'
type PostType = 'now' | 'schedule'

interface PlatformStatus {
  platform: Platform
  connected: boolean
  tokenExpired?: boolean
}

export function PlatformSelectButton({ videoId, creatorUniqueIdentifier }: PlatformSelectButtonProps) {
  const [showMenu, setShowMenu] = useState(false)
  const [platformStatuses, setPlatformStatuses] = useState<PlatformStatus[]>([])
  const [loading, setLoading] = useState(true)
  const [posting, setPosting] = useState(false)
  const navigate = useNavigate()
  const { showConfirm, showToast } = useModal()

  // Check platform token statuses
  useEffect(() => {
    async function checkPlatformStatuses() {
      setLoading(true)
      try {
        const response = await fetch(`/api/videos/${videoId}/platform-status`)
        if (response.ok) {
          const data = await response.json()
          setPlatformStatuses(data.platforms || [])
        } else {
          console.error('[PlatformSelectButton] Failed to fetch platform statuses:', response.statusText)
        }
      } catch (error) {
        console.error('[PlatformSelectButton] Error checking platform statuses:', error)
      } finally {
        setLoading(false)
      }
    }
    checkPlatformStatuses()
  }, [videoId])

  const getPlatformStatus = (platform: Platform): PlatformStatus | undefined => {
    return platformStatuses.find(p => p.platform === platform)
  }

  const handlePlatformSelect = async (platform: Platform, postType: PostType) => {
    const status = getPlatformStatus(platform)

    // If not connected or token expired, redirect to OAuth
    if (!status?.connected || status.tokenExpired) {
      const platformName = platform === 'internal' ? 'Air Publisher' : platform
      const confirmed = await showConfirm({
        title: 'Platform Not Connected',
        message: `${platformName} is not connected or your token has expired. Would you like to connect it now?`,
        confirmLabel: 'Connect Now'
      })
      if (confirmed) {
        // Redirect to settings page with platform focus
        navigate(`/settings/connections?platform=${platform}&returnTo=/videos`)
      }
      return
    }

    // If scheduling, show date/time picker
    if (postType === 'schedule') {
      // Get current date/time as default
      const now = new Date()
      const defaultDateTime = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`

      const dateTime = prompt('Enter date and time (YYYY-MM-DD HH:MM):', defaultDateTime)
      if (!dateTime) return

      // Parse date/time - handle both formats
      let scheduledDate: Date
      if (dateTime.includes('T')) {
        // ISO format
        scheduledDate = new Date(dateTime)
      } else {
        // Try parsing as YYYY-MM-DD HH:MM
        const [datePart, timePart] = dateTime.split(' ')
        if (!datePart || !timePart) {
          showToast({ message: 'Invalid date/time format. Please use YYYY-MM-DD HH:MM', type: 'error' })
          return
        }
        scheduledDate = new Date(`${datePart}T${timePart}:00`)
      }

      if (isNaN(scheduledDate.getTime())) {
        showToast({ message: 'Invalid date/time format. Please use YYYY-MM-DD HH:MM', type: 'error' })
        return
      }

      if (scheduledDate < new Date()) {
        showToast({ message: 'Scheduled time must be in the future', type: 'error' })
        return
      }

      await handlePost(videoId, platform, postType, scheduledDate)
    } else {
      // Post now
      const confirmed = await showConfirm({
        title: 'Post Video Now',
        message: `Are you sure you want to post this video to ${platform === 'internal' ? 'Air Publisher' : platform} immediately?`,
        confirmLabel: 'Post Now'
      })
      if (!confirmed) {
        return
      }
      await handlePost(videoId, platform, postType)
    }
  }

  const handlePost = async (
    videoId: string,
    platform: Platform,
    postType: PostType,
    scheduledAt?: Date
  ) => {
    setShowMenu(false)
    setPosting(true)
    try {
      const response = await fetch(`/api/videos/${videoId}/publish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platform,
          postType,
          scheduledAt: scheduledAt?.toISOString(),
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to publish video')
      }

      showToast({ message: `Video ${postType === 'now' ? 'posted' : 'scheduled'} successfully!`, type: 'success' })
    } catch (e: any) {
      console.error('[PlatformSelectButton] Post error:', e)
      showToast({ message: `Failed to ${postType === 'now' ? 'post' : 'schedule'} video: ${e.message || 'Unknown error'}`, type: 'error' })
    } finally {
      setPosting(false)
    }
  }

  const platforms: Array<{ platform: Platform; name: string; icon: React.ReactNode }> = [
    { platform: 'internal', name: 'Air Publisher', icon: <Globe className="h-4 w-4" /> },
    { platform: 'youtube', name: 'YouTube', icon: <Youtube className="h-4 w-4" /> },
    { platform: 'instagram', name: 'Instagram', icon: <Instagram className="h-4 w-4" /> },
    { platform: 'tiktok', name: 'TikTok', icon: <Music className="h-4 w-4" /> },
  ]

  if (loading) {
    return (
      <Button variant="outline" size="sm" disabled>
        Loading...
      </Button>
    )
  }

  return (
    <div className="relative">
      <Button
        onClick={() => setShowMenu(!showMenu)}
        variant="outline"
        size="sm"
        disabled={posting}
      >
        {posting ? 'Posting...' : 'Post Video'}
      </Button>

      {showMenu && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setShowMenu(false)}
          />

          {/* Menu */}
          <div className="absolute top-full left-0 mt-2 w-64 bg-card border border-border rounded-lg shadow-lg z-20 p-2">
            <div className="space-y-1">
              {platforms.map(({ platform, name, icon }) => {
                const status = getPlatformStatus(platform)
                const isConnected = status?.connected && !status?.tokenExpired

                return (
                  <div key={platform} className="space-y-1">
                    <div className="flex items-center justify-between px-3 py-2 rounded hover:bg-card-hover">
                      <div className="flex items-center gap-2">
                        {icon}
                        <span className="text-sm font-medium">{name}</span>
                      </div>
                      {isConnected ? (
                        <span className="text-xs text-green-400">✓</span>
                      ) : (
                        <span className="text-xs text-red-400">✗</span>
                      )}
                    </div>
                    <div className="flex gap-1 ml-6">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="flex-1 text-xs h-7"
                        onClick={() => handlePlatformSelect(platform, 'now')}
                        disabled={!isConnected || posting}
                      >
                        <Clock className="h-3 w-3 mr-1" />
                        Now
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="flex-1 text-xs h-7"
                        onClick={() => handlePlatformSelect(platform, 'schedule')}
                        disabled={!isConnected || posting}
                      >
                        <Calendar className="h-3 w-3 mr-1" />
                        Schedule
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

