'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Youtube, Instagram, Music, Globe, Clock } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface PostNowButtonProps {
  videoId: string
  creatorUniqueIdentifier: string
}

type Platform = 'internal' | 'youtube' | 'instagram' | 'tiktok'

interface PlatformStatus {
  platform: Platform
  connected: boolean
  tokenExpired?: boolean
}

export function PostNowButton({ videoId, creatorUniqueIdentifier }: PostNowButtonProps) {
  const [showMenu, setShowMenu] = useState(false)
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 })
  const [platformStatuses, setPlatformStatuses] = useState<PlatformStatus[]>([])
  const [loading, setLoading] = useState(true)
  const [posting, setPosting] = useState(false)
  const buttonRef = useRef<HTMLButtonElement>(null)
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
        console.error('[PostNowButton] Error checking platform statuses:', error)
      } finally {
        setLoading(false)
      }
    }
    checkPlatformStatuses()
  }, [videoId])

  const getPlatformStatus = (platform: Platform): PlatformStatus | undefined => {
    return platformStatuses.find(p => p.platform === platform)
  }

  const handlePlatformSelect = async (platform: Platform) => {
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

    // Post now
    if (!confirm(`Post this video to ${platform === 'internal' ? 'Air Publisher' : platform} now?`)) {
      return
    }

    await handlePost(videoId, platform)
  }

  const handlePost = async (videoId: string, platform: Platform) => {
    setPosting(true)
    try {
      const response = await fetch(`/api/videos/${videoId}/publish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platform,
          postType: 'now',
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to post video')
      }

      alert('Video posted successfully!')
      router.refresh()
    } catch (error: any) {
      console.error('[PostNowButton] Post error:', error)
      alert(`Failed to post video: ${error.message || 'Unknown error'}`)
    } finally {
      setPosting(false)
      setShowMenu(false)
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

  const handleMenuToggle = () => {
    if (!showMenu && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect()
      const menuHeight = 200 // Approximate menu height
      const viewportHeight = window.innerHeight
      const spaceBelow = viewportHeight - rect.bottom
      const spaceAbove = rect.top
      
      // If not enough space below, show above the button
      const top = spaceBelow < menuHeight && spaceAbove > spaceBelow
        ? rect.top + window.scrollY - menuHeight - 8
        : rect.bottom + window.scrollY + 8
      
      setMenuPosition({
        top,
        left: rect.left + window.scrollX,
      })
    }
    setShowMenu(!showMenu)
  }

  return (
    <>
      <Button
        ref={buttonRef}
        onClick={handleMenuToggle}
        variant="outline"
        size="sm"
        disabled={posting}
      >
        <Clock className="h-4 w-4 mr-2" />
        {posting ? 'Posting...' : 'Post Now'}
      </Button>

      {showMenu && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-[9998]"
            onClick={() => setShowMenu(false)}
          />
          
          {/* Menu - Fixed positioning to hover over page */}
          <div 
            className="fixed w-64 bg-card border border-border rounded-lg shadow-lg z-[9999] p-2"
            style={{
              top: `${menuPosition.top}px`,
              left: `${menuPosition.left}px`,
            }}
          >
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
                    disabled={!isConnected || posting}
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
    </>
  )
}

