import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Youtube, Instagram, Calendar, Facebook } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { getPlatformStatuses, type PlatformStatus, type Platform } from '@/lib/db/platform-status'
import { supabase } from '@/lib/supabase/client'
import { useModal } from '@/components/providers/modal-provider'
import { PostEditingModal, type PostEditingData } from './post-editing-modal'

interface ScheduleButtonProps {
  videoId: string
  creatorUniqueIdentifier: string
  videoTitle: string
  videoDescription: string
  thumbnailUrl?: string | null
  className?: string
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost'
  onSuccess?: () => void
}

export function ScheduleButton({ videoId, creatorUniqueIdentifier, videoTitle, videoDescription, thumbnailUrl, className, variant = 'outline', onSuccess }: ScheduleButtonProps) {
  const [showMenu, setShowMenu] = useState(false)
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 })
  const [selectedPlatform, setSelectedPlatform] = useState<Platform | null>(null)
  const [platformStatuses, setPlatformStatuses] = useState<PlatformStatus[]>([])
  const [loading, setLoading] = useState(true)
  const [scheduling, setScheduling] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
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
        console.error('[ScheduleButton] Error checking platform statuses:', error)
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

    // If not connected, redirect to settings
    if (!status?.connected) {
      const platformName = platform.charAt(0).toUpperCase() + platform.slice(1)
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

    // Open editing modal with scheduler
    setSelectedPlatform(platform)
    setShowMenu(false)
    setShowEditModal(true)
  }

  // Default datetime: 1 hour from now
  const getDefaultDateTime = () => {
    const now = new Date()
    now.setHours(now.getHours() + 1)
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const day = String(now.getDate()).padStart(2, '0')
    const hours = String(now.getHours()).padStart(2, '0')
    const minutes = String(now.getMinutes()).padStart(2, '0')
    return `${year}-${month}-${day}T${hours}:${minutes}`
  }

  const handleEditConfirm = async (data: PostEditingData) => {
    if (!selectedPlatform || !data.scheduledAt) return

    const scheduledDate = new Date(data.scheduledAt)

    if (isNaN(scheduledDate.getTime())) {
      showToast({ message: 'Invalid date/time format', type: 'error' })
      return
    }

    if (scheduledDate < new Date()) {
      showToast({ message: 'Scheduled time must be in the future', type: 'error' })
      return
    }

    setShowEditModal(false)
    setScheduling(true)

    try {
      const updatePayload: Record<string, any> = {
        title: data.title,
        description: data.description,
        scheduled_at: scheduledDate.toISOString(),
        platform_target: selectedPlatform,
        status: 'scheduled',
      }
      if (selectedPlatform === 'youtube' && data.privacyStatus) {
        updatePayload.youtube_privacy_status = data.privacyStatus
      }

      const { error } = await supabase
        .from('air_publisher_videos')
        .update(updatePayload)
        .eq('id', videoId)

      if (error) {
        throw new Error(error.message || 'Failed to schedule video')
      }

      showToast({ message: 'Video scheduled successfully!', type: 'success' })
      onSuccess?.()
    } catch (error: any) {
      console.error('[ScheduleButton] Schedule error:', error)
      showToast({ message: `Failed to schedule video: ${error.message || 'Unknown error'}`, type: 'error' })
    } finally {
      setScheduling(false)
      setSelectedPlatform(null)
    }
  }

  const platforms: Array<{ platform: Platform; name: string; icon: React.ReactNode }> = [
    { platform: 'youtube', name: 'YouTube', icon: <Youtube className="h-4 w-4" /> },
    { platform: 'instagram', name: 'Instagram', icon: <Instagram className="h-4 w-4" /> },
    { platform: 'facebook', name: 'Facebook', icon: <Facebook className="h-4 w-4" /> },
  ]

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
        variant={variant}
        disabled={scheduling}
        className={className || "whitespace-nowrap"}
      >
        <Calendar className="h-4 w-4 mr-2" />
        {scheduling ? 'Scheduling...' : 'Schedule'}
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
                    disabled={!isConnected || scheduling}
                  >
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-2">
                        {icon}
                        <span className="text-lg font-medium text-white">{name}</span>
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

      {/* Schedule Editing Modal */}
      {selectedPlatform && (
        <PostEditingModal
          isOpen={showEditModal}
          platform={selectedPlatform}
          videoTitle={videoTitle}
          videoDescription={videoDescription}
          thumbnailUrl={thumbnailUrl}
          onConfirm={handleEditConfirm}
          onCancel={() => {
            setShowEditModal(false)
            setSelectedPlatform(null)
          }}
          showScheduler={true}
          defaultDateTime={getDefaultDateTime()}
          confirmLabel="Schedule"
          isSubmitting={scheduling}
        />
      )}
    </>
  )
}
