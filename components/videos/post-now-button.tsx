import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Youtube, Instagram, Music, Globe, Clock } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { getPlatformStatuses, type PlatformStatus, type Platform } from '@/lib/db/platform-status'
import { supabase } from '@/lib/supabase/client'
import { useModal } from '@/components/providers/modal-provider'

interface PostNowButtonProps {
  videoId: string
  creatorUniqueIdentifier: string
}

export function PostNowButton({ videoId, creatorUniqueIdentifier }: PostNowButtonProps) {
  const [showMenu, setShowMenu] = useState(false)
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 })
  const [platformStatuses, setPlatformStatuses] = useState<PlatformStatus[]>([])
  const [loading, setLoading] = useState(true)
  const [posting, setPosting] = useState(false)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const navigate = useNavigate()
  const { showConfirm, showToast } = useModal()

  // Check platform token statuses via direct Supabase queries
  useEffect(() => {
    async function checkPlatformStatuses() {
      setLoading(true)
      try {
        const statuses = await getPlatformStatuses(creatorUniqueIdentifier)
        setPlatformStatuses(statuses)
      } catch (error) {
        console.error('[PostNowButton] Error checking platform statuses:', error)
      } finally {
        setLoading(false)
      }
    }
    checkPlatformStatuses()
  }, [creatorUniqueIdentifier])

  const getPlatformStatus = (platform: Platform): PlatformStatus | undefined => {
    return platformStatuses.find(p => p.platform === platform)
  }

  const handlePlatformSelect = async (platform: Platform) => {
    const status = getPlatformStatus(platform)
    const platformName = platform === 'internal' ? 'Air Publisher' : platform

    // If not connected, redirect to settings
    if (!status?.connected) {
      const confirmed = await showConfirm({
        title: 'Platform Not Connected',
        message: `${platformName} is not connected or your token has expired. Would you like to connect it now?`,
        confirmLabel: 'Connect Now'
      })

      if (confirmed) {
        navigate(`/settings/connections?platform=${platform}&returnTo=/videos`)
      }
      return
    }

    // Post now confirmation
    const confirmed = await showConfirm({
      title: 'Post Video Now',
      message: `Are you sure you want to post this video to ${platformName} immediately?`,
      confirmLabel: 'Post Now'
    })

    if (!confirmed) {
      return
    }

    await handlePost(videoId, platform)
  }

  const handlePost = async (videoId: string, platform: Platform) => {
    setShowMenu(false)
    setPosting(true)
    try {
      // Call the existing instant-posting Edge Function via supabase.functions.invoke()
      const { data, error } = await supabase.functions.invoke('instant-posting', {
        body: {
          video_id: videoId,
          creator_unique_identifier: creatorUniqueIdentifier,
          platform,
        },
      })

      if (error) {
        throw new Error(error.message || 'Failed to post video')
      }

      if (data?.error) {
        throw new Error(data.error)
      }

      showToast({ message: 'Video posted successfully!', type: 'success' })
    } catch (error: any) {
      console.error('[PostNowButton] Post error:', error)
      showToast({ message: `Failed to post video: ${error.message || 'Unknown error'}`, type: 'error' })
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

  const handleMenuToggle = () => {
    if (!showMenu && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect()
      const menuHeight = 200
      const menuWidth = 256
      const viewportHeight = window.innerHeight
      const viewportWidth = window.innerWidth
      const spaceBelow = viewportHeight - rect.bottom
      const spaceAbove = rect.top

      let top = rect.bottom + 8
      let left = rect.left

      if (spaceBelow < menuHeight && spaceAbove > spaceBelow) {
        top = rect.top - menuHeight - 8
      }
      if (left + menuWidth > viewportWidth) {
        left = viewportWidth - menuWidth - 8
      }
      if (left < 8) left = 8
      if (top + menuHeight > viewportHeight) top = viewportHeight - menuHeight - 8
      if (top < 8) top = 8

      setMenuPosition({ top, left })
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
            className="fixed inset-0 z-[999998] bg-black/20"
            onClick={() => setShowMenu(false)}
          />

          {/* Menu */}
          <div
            className="fixed w-64 bg-black border border-white/20 rounded-lg shadow-2xl z-[999999] p-2 pointer-events-auto"
            style={{
              top: `${menuPosition.top}px`,
              left: `${menuPosition.left}px`,
              maxHeight: 'calc(100vh - 16px)',
              overflowY: 'auto',
            }}
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="space-y-1">
              {platforms.map(({ platform, name, icon }) => {
                const status = getPlatformStatus(platform)
                const isConnected = status?.connected ?? false

                return (
                  <button
                    key={platform}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-md hover:bg-white/10 transition-colors text-left disabled:opacity-50 disabled:cursor-not-allowed pointer-events-auto"
                    onClick={(e) => {
                      e.stopPropagation()
                      e.preventDefault()
                      handlePlatformSelect(platform)
                    }}
                    onMouseDown={(e) => {
                      e.stopPropagation()
                    }}
                    disabled={!isConnected || posting}
                  >
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-2">
                        {icon}
                        <span className="text-sm font-medium text-white">{name}</span>
                      </div>
                      {isConnected ? (
                        <span className="text-xs text-green-400">✓</span>
                      ) : (
                        <span className="text-xs text-red-400">✗</span>
                      )}
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        </>
      )}
    </>
  )
}
