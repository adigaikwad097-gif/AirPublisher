import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Youtube, Instagram, Clock, Facebook, Loader2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { getPlatformStatuses, type PlatformStatus, type Platform } from '@/lib/db/platform-status'
import { supabase } from '@/lib/supabase/client'
import { useModal } from '@/components/providers/modal-provider'
import { PostEditingModal, type PostEditingData } from './post-editing-modal'

interface PostNowButtonProps {
  videoId: string
  creatorUniqueIdentifier: string
  videoTitle: string
  videoDescription: string
  thumbnailUrl?: string | null
  className?: string
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost'
  onSuccess?: () => void
}

export function PostNowButton({ videoId, creatorUniqueIdentifier, videoTitle, videoDescription, thumbnailUrl, className, variant = 'outline', onSuccess }: PostNowButtonProps) {
  const [showMenu, setShowMenu] = useState(false)
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 })
  const [platformStatuses, setPlatformStatuses] = useState<PlatformStatus[]>([])
  const [loading, setLoading] = useState(true)
  const [posting, setPosting] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [selectedPlatform, setSelectedPlatform] = useState<Platform | null>(null)
  const [postingPlatformName, setPostingPlatformName] = useState('')
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
    const platformName = platform.charAt(0).toUpperCase() + platform.slice(1)

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

    // Open editing modal instead of simple confirmation
    setSelectedPlatform(platform)
    setShowMenu(false)
    setShowEditModal(true)
  }

  const handleEditConfirm = async (data: PostEditingData) => {
    if (!selectedPlatform) return

    const platformName = selectedPlatform.charAt(0).toUpperCase() + selectedPlatform.slice(1)
    setPostingPlatformName(platformName)
    setShowEditModal(false)
    setPosting(true)

    try {
      // Update video in DB with edited fields before posting
      const updatePayload: Record<string, any> = {
        title: data.title,
        description: data.description,
      }
      if (selectedPlatform === 'youtube' && data.privacyStatus) {
        updatePayload.youtube_privacy_status = data.privacyStatus
      }

      const { error: updateError } = await supabase
        .from('air_publisher_videos')
        .update(updatePayload)
        .eq('id', videoId)

      if (updateError) {
        throw new Error(`Failed to update video: ${updateError.message}`)
      }

      // Call instant-posting Edge Function
      const { data: postData, error } = await supabase.functions.invoke('instant-posting', {
        body: {
          video_id: videoId,
          creator_unique_identifier: creatorUniqueIdentifier,
          platform: selectedPlatform,
        },
      })

      if (error) {
        throw new Error(error.message || 'Failed to post video')
      }

      if (postData?.error) {
        throw new Error(postData.error)
      }

      showToast({ message: 'Video posted successfully!', type: 'success' })
      onSuccess?.()
    } catch (error: any) {
      console.error('[PostNowButton] Post error:', error)
      const errorMessage = error.message || 'Unknown error'
      showToast({ message: `Failed to post video: ${errorMessage}`, type: 'error' })

      // Persist error to DB so it shows on the video card
      try {
        await supabase
          .from('air_publisher_videos')
          .update({ status: 'failed', error_message: errorMessage })
          .eq('id', videoId)
      } catch (dbErr) {
        console.error('[PostNowButton] Failed to persist error to DB:', dbErr)
      }
    } finally {
      setPosting(false)
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
        disabled={posting}
        className={className || "whitespace-nowrap"}
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
                        <span className="text-lg font-medium text-white">{name}</span>
                      </div>
                      {isConnected ? (
                        <span className="text-base text-success">✓</span>
                      ) : (
                        <span className="text-base text-red-400">✗</span>
                      )}
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        </>
      )}

      {/* Post Editing Modal */}
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
          confirmLabel="Post Now"
          isSubmitting={posting}
        />
      )}

      {/* Posting Progress Overlay */}
      {posting && (
        <div className="fixed bottom-6 right-6 z-[999999] flex items-center gap-3 px-5 py-3.5 rounded-xl bg-[#1c1c1c] border border-white/10 shadow-2xl">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
          <span className="text-lg font-medium text-white">
            Publishing to {postingPlatformName}...
          </span>
        </div>
      )}
    </>
  )
}
