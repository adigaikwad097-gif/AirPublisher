

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { updateVideo } from '@/lib/db/videos'
import { useModal } from '@/components/providers/modal-provider'

interface PublishVideoButtonProps {
  videoId: string
}

export function PublishVideoButton({ videoId }: PublishVideoButtonProps) {
  const [publishing, setPublishing] = useState(false)
  const { showConfirm, showToast } = useModal()

  const handlePublish = async () => {
    const confirmed = await showConfirm({
      title: 'Publish Video',
      message: 'Publish this video? It will be visible on the Discover page.',
      confirmLabel: 'Publish'
    })

    if (!confirmed) {
      return
    }

    console.log('[PublishVideoButton] Starting publish for video:', videoId)
    setPublishing(true)
    try {
      console.log('[PublishVideoButton] Calling publishVideoAction...')
      const result = await updateVideo(videoId, { status: 'posted', posted_at: new Date().toISOString() })
      console.log('[PublishVideoButton] ✅ Publish action completed:', result)
      showToast({ message: 'Video published successfully!', type: 'success' })
    } catch (error: any) {
      console.error('[PublishVideoButton] ❌ Publish error:', error)
      console.error('[PublishVideoButton] Error details:', {
        message: error?.message,
        stack: error?.stack,
      })
      showToast({ message: `Failed to publish video: ${error.message || 'Unknown error'}`, type: 'error' })
    } finally {
      setPublishing(false)
    }
  }

  return (
    <Button
      onClick={handlePublish}
      disabled={publishing}
      variant="outline"
      size="sm"
    >
      {publishing ? 'Publishing...' : 'Publish Video'}
    </Button>
  )
}

