'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Youtube, Instagram, Music, Globe, Calendar } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface ScheduleButtonProps {
  videoId: string
  creatorUniqueIdentifier: string
}

type Platform = 'internal' | 'youtube' | 'instagram' | 'tiktok'

interface PlatformStatus {
  platform: Platform
  connected: boolean
  tokenExpired?: boolean
}

export function ScheduleButton({ videoId, creatorUniqueIdentifier }: ScheduleButtonProps) {
  const [showMenu, setShowMenu] = useState(false)
  const [showDateTimePicker, setShowDateTimePicker] = useState(false)
  const [selectedPlatform, setSelectedPlatform] = useState<Platform | null>(null)
  const [platformStatuses, setPlatformStatuses] = useState<PlatformStatus[]>([])
  const [loading, setLoading] = useState(true)
  const [scheduling, setScheduling] = useState(false)
  const [dateTime, setDateTime] = useState('')
  const router = useRouter()

  // Check platform token statuses
  useEffect(() => {
    async function checkPlatformStatuses() {
      setLoading(true)
      try {
        const response = await fetch(`/api/videos/${videoId}/platform-status`)
        if (response.ok) {
          const data = await response.json()
          setPlatformStatuses(data.platforms || [])
        }
      } catch (error) {
        console.error('[ScheduleButton] Error checking platform statuses:', error)
      } finally {
        setLoading(false)
      }
    }
    checkPlatformStatuses()
  }, [videoId])

  // Set default date/time (1 hour from now)
  useEffect(() => {
    const now = new Date()
    now.setHours(now.getHours() + 1)
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const day = String(now.getDate()).padStart(2, '0')
    const hours = String(now.getHours()).padStart(2, '0')
    const minutes = String(now.getMinutes()).padStart(2, '0')
    setDateTime(`${year}-${month}-${day}T${hours}:${minutes}`)
  }, [])

  const getPlatformStatus = (platform: Platform): PlatformStatus | undefined => {
    return platformStatuses.find(p => p.platform === platform)
  }

  const handlePlatformSelect = (platform: Platform) => {
    const status = getPlatformStatus(platform)
    
    // If not connected or token expired, redirect to OAuth
    if (!status?.connected || status.tokenExpired) {
      const platformName = platform === 'internal' ? 'Air Publisher' : platform
      if (confirm(`${platformName} is not connected or your token has expired. Would you like to connect it now?`)) {
        router.push(`/settings/connections?platform=${platform}&returnTo=/videos`)
        return
      }
      return
    }

    setSelectedPlatform(platform)
    setShowMenu(false)
    setShowDateTimePicker(true)
  }

  const handleSchedule = async () => {
    if (!selectedPlatform || !dateTime) return

    const scheduledDate = new Date(dateTime)
    
    if (isNaN(scheduledDate.getTime())) {
      alert('Invalid date/time format')
      return
    }

    if (scheduledDate < new Date()) {
      alert('Scheduled time must be in the future')
      return
    }

    await handlePost(videoId, selectedPlatform, scheduledDate)
  }

  const handlePost = async (videoId: string, platform: Platform, scheduledAt: Date) => {
    setScheduling(true)
    try {
      const response = await fetch(`/api/videos/${videoId}/publish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platform,
          postType: 'schedule',
          scheduledAt: scheduledAt.toISOString(),
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to schedule video')
      }

      alert('Video scheduled successfully!')
      setShowDateTimePicker(false)
      setSelectedPlatform(null)
      router.refresh()
    } catch (error: any) {
      console.error('[ScheduleButton] Schedule error:', error)
      alert(`Failed to schedule video: ${error.message || 'Unknown error'}`)
    } finally {
      setScheduling(false)
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
    <>
      <div className="relative">
        <Button
          onClick={() => setShowMenu(!showMenu)}
          variant="outline"
          size="sm"
          disabled={scheduling}
        >
          <Calendar className="h-4 w-4 mr-2" />
          {scheduling ? 'Scheduling...' : 'Schedule'}
        </Button>

        {showMenu && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 z-[9998]"
              onClick={() => setShowMenu(false)}
            />
            
            {/* Menu */}
            <div className="absolute top-full left-0 mt-2 w-64 bg-card border border-border rounded-lg shadow-lg z-[9999] p-2">
              <div className="space-y-1">
                {platforms.map(({ platform, name, icon }) => {
                  const status = getPlatformStatus(platform)
                  const isConnected = status?.connected && !status?.tokenExpired
                  
                  return (
                    <Button
                      key={platform}
                      variant="ghost"
                      size="sm"
                      className="w-full justify-start"
                      onClick={() => handlePlatformSelect(platform)}
                      disabled={!isConnected || scheduling}
                    >
                      <div className="flex items-center justify-between w-full">
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
                    </Button>
                  )
                })}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Date/Time Picker Modal */}
      {showDateTimePicker && selectedPlatform && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-[9998]"
            onClick={() => {
              setShowDateTimePicker(false)
              setSelectedPlatform(null)
            }}
          />
          <div className="fixed inset-0 flex items-center justify-center z-[9999] pointer-events-none">
            <div className="bg-card border border-border rounded-lg shadow-xl p-6 w-full max-w-md mx-4 pointer-events-auto">
              <h3 className="text-lg font-semibold mb-4">
                Schedule for {platforms.find(p => p.platform === selectedPlatform)?.name}
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Date & Time
                  </label>
                  <input
                    type="datetime-local"
                    value={dateTime}
                    onChange={(e) => setDateTime(e.target.value)}
                    className="w-full px-3 py-2 bg-background border border-border rounded-md text-foreground"
                    min={new Date().toISOString().slice(0, 16)}
                  />
                </div>

                <div className="flex gap-2 justify-end">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowDateTimePicker(false)
                      setSelectedPlatform(null)
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSchedule}
                    disabled={scheduling || !dateTime}
                  >
                    {scheduling ? 'Scheduling...' : 'Schedule'}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  )
}

