

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'
import { useModal } from '@/components/providers/modal-provider'

interface SetVideoUrlButtonProps {
  videoId: string
}

export function SetVideoUrlButton({ videoId }: SetVideoUrlButtonProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { showToast } = useModal()

  const handleSetUrl = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(`/api/videos/${videoId}/set-video-url`, {
        method: 'POST',
      })

      if (!response.ok) {
        const errorData = await response.json()
        const errorMessage = errorData.error || 'Failed to set video URL'
        const details = errorData.details ? `\n\nDetails: ${errorData.details}` : ''
        const hint = errorData.hint ? `\n\nHint: ${errorData.hint}` : ''
        throw new Error(`${errorMessage}${details}${hint}`)
      }

      const result = await response.json()
      console.log('[SetVideoUrlButton] ✅ Video URL set:', result.video_url)
      showToast({ message: `Video URL set successfully!\n\n${result.video_url}`, type: 'success' })
    } catch (err: any) {
      console.error('[SetVideoUrlButton] Error:', err)
      setError(err.message || 'Failed to set video URL')
      showToast({ message: `Failed to set video URL:\n${err.message || 'Unknown error'}`, type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <Button
        onClick={handleSetUrl}
        disabled={loading}
        variant="outline"
        size="sm"
        className="bg-blue-600 hover:bg-blue-700 text-white border-blue-600"
      >
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Setting URL...
          </>
        ) : (
          'Set Video URL from Storage'
        )}
      </Button>
      {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
    </div>
  )
}

