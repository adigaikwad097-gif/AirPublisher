import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Button } from '@/components/ui/button'
import { Youtube, Instagram, Facebook, X, Globe, Lock, Eye } from 'lucide-react'

type Platform = 'youtube' | 'instagram' | 'facebook'

export interface PostEditingData {
  title: string
  description: string
  privacyStatus?: 'public' | 'unlisted' | 'private'
  scheduledAt?: string
}

interface PostEditingModalProps {
  isOpen: boolean
  platform: Platform
  videoTitle: string
  videoDescription: string
  thumbnailUrl?: string | null
  onConfirm: (data: PostEditingData) => void
  onCancel: () => void
  showScheduler?: boolean
  defaultDateTime?: string
  confirmLabel?: string
  isSubmitting?: boolean
}

const PLATFORM_CONFIG = {
  youtube: {
    name: 'YouTube',
    icon: Youtube,
    descriptionLabel: 'Description',
    descriptionMaxLength: 5000,
    showTitle: true,
    titleMaxLength: 100,
    showPrivacy: true,
    prefillDescription: true,
  },
  instagram: {
    name: 'Instagram',
    icon: Instagram,
    descriptionLabel: 'Caption',
    descriptionMaxLength: 2200,
    showTitle: false,
    titleMaxLength: 0,
    showPrivacy: false,
    prefillDescription: false,
  },
  facebook: {
    name: 'Facebook',
    icon: Facebook,
    descriptionLabel: 'Description',
    descriptionMaxLength: 5000,
    showTitle: false,
    titleMaxLength: 0,
    showPrivacy: false,
    prefillDescription: false,
  },
} as const

const PRIVACY_OPTIONS = [
  { value: 'public', label: 'Public', desc: 'Everyone can watch', icon: Globe },
  { value: 'unlisted', label: 'Unlisted', desc: 'Anyone with the link', icon: Eye },
  { value: 'private', label: 'Private', desc: 'Only you can watch', icon: Lock },
] as const

export function PostEditingModal({
  isOpen,
  platform,
  videoTitle,
  videoDescription,
  thumbnailUrl,
  onConfirm,
  onCancel,
  showScheduler = false,
  defaultDateTime = '',
  confirmLabel = 'Post Now',
  isSubmitting = false,
}: PostEditingModalProps) {
  const config = PLATFORM_CONFIG[platform]
  const PlatformIcon = config.icon

  const [title, setTitle] = useState(videoTitle)
  const [description, setDescription] = useState(config.prefillDescription ? videoDescription : '')
  const [privacyStatus, setPrivacyStatus] = useState<'public' | 'unlisted' | 'private'>('public')
  const [scheduledAt, setScheduledAt] = useState(defaultDateTime)
  const [isAnimatingIn, setIsAnimatingIn] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setTitle(videoTitle)
      // Instagram/Facebook start empty — YouTube pre-fills
      setDescription(config.prefillDescription ? videoDescription : '')
      setPrivacyStatus('public')
      setScheduledAt(defaultDateTime)
      requestAnimationFrame(() => setIsAnimatingIn(true))
    } else {
      setIsAnimatingIn(false)
    }
  }, [isOpen, platform, videoTitle, videoDescription, defaultDateTime])

  if (!isOpen && !isAnimatingIn) return null

  const handleSubmit = () => {
    if (config.showTitle && !title.trim()) return
    if (showScheduler && !scheduledAt) return
    onConfirm({
      title: title.trim(),
      description: description.trim(),
      ...(config.showPrivacy ? { privacyStatus } : {}),
      ...(showScheduler ? { scheduledAt } : {}),
    })
  }

  const minDateTime = (() => {
    const d = new Date()
    const ms = 1000 * 60 * 5
    return new Date(Math.ceil(d.getTime() / ms) * ms).toISOString().slice(0, 16)
  })()

  const descLen = description.length
  const descMax = config.descriptionMaxLength

  // Instagram/Facebook: simple two-pane layout (video left, caption right)
  const isSimpleLayout = !config.showTitle && !config.showPrivacy

  return createPortal(
    <>
      {/* Backdrop — visual only, no click handler */}
      <div
        className={`fixed inset-0 z-[9999990] bg-black/75 transition-opacity duration-200 ${isOpen ? 'opacity-100' : 'opacity-0'}`}
      />

      {/* Modal wrapper — mousedown on wrapper (not children) closes modal */}
      <div
        className="fixed inset-0 z-[9999991] flex items-center justify-center p-4"
        onMouseDown={(e) => {
          if (e.target === e.currentTarget) onCancel()
        }}
      >
        <div
          className={`
            w-full overflow-hidden rounded-2xl bg-[#1c1c1c] shadow-2xl
            transition-[opacity,transform] duration-200 flex flex-col
            ${isOpen ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 translate-y-4'}
            ${isSimpleLayout ? 'max-w-2xl' : 'max-w-3xl'}
          `}
          style={{ maxHeight: 'calc(100vh - 2rem)' }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/[0.07]">
            <div className="flex items-center gap-2">
              <PlatformIcon className="h-4 w-4 text-white/60" />
              <span className="text-sm font-semibold text-white">
                {showScheduler ? 'Schedule for' : 'Post to'} {config.name}
              </span>
            </div>
            <button
              onClick={onCancel}
              className="text-white/40 hover:text-white/80 transition-colors rounded-full p-1"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Body */}
          {isSimpleLayout ? (
            // Instagram / Facebook layout: video left, caption right — no dividing lines
            <div className="flex flex-1 min-h-0" style={{ minHeight: 420 }}>
              {/* Video preview — takes up left half */}
              <div className="w-[48%] flex-shrink-0 bg-black flex items-center justify-center relative">
                {thumbnailUrl ? (
                  <img
                    src={thumbnailUrl}
                    alt={videoTitle}
                    className="w-full h-full object-cover"
                    style={{ maxHeight: 480 }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#1e1e2e] to-[#0a0a0f]" style={{ minHeight: 420 }}>
                    <PlatformIcon className="h-10 w-10 text-white/15" />
                  </div>
                )}
              </div>

              {/* Caption panel — right half, clean */}
              <div className="flex-1 flex flex-col">
                {/* Caption textarea fills available space */}
                <div className="flex-1 px-4 pt-4 pb-2">
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value.slice(0, descMax))}
                    placeholder={platform === 'instagram' ? 'Write a caption...' : 'Write something...'}
                    className="w-full h-full bg-transparent text-white text-sm placeholder-white/30 resize-none focus:outline-none leading-relaxed"
                    style={{ minHeight: 280 }}
                    autoFocus
                  />
                </div>

                {/* Char count */}
                <div className="px-4 pb-3 flex justify-end">
                  <span className={`text-xs ${descLen >= descMax ? 'text-red-400' : descLen > descMax * 0.85 ? 'text-yellow-400/70' : 'text-white/25'}`}>
                    {descLen}/{descMax.toLocaleString()}
                  </span>
                </div>

                {/* Schedule if needed */}
                {showScheduler && (
                  <div className="px-4 pb-4 border-t border-white/[0.06] pt-3">
                    <label className="block text-xs text-white/40 mb-1.5">Schedule date & time</label>
                    <input
                      type="datetime-local"
                      value={scheduledAt}
                      onChange={(e) => setScheduledAt(e.target.value)}
                      className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-white/25 transition-colors"
                      step="300"
                      min={minDateTime}
                    />
                  </div>
                )}
              </div>
            </div>
          ) : (
            // YouTube layout: thumbnail left, form right (scrollable)
            <div className="flex flex-1 min-h-0 overflow-hidden" style={{ minHeight: 460 }}>
              {/* Thumbnail */}
              <div className="w-[220px] flex-shrink-0 bg-[#111111] flex flex-col items-center p-4 gap-3">
                <div className="w-full rounded-xl overflow-hidden bg-black aspect-[9/16] flex items-center justify-center">
                  {thumbnailUrl ? (
                    <img src={thumbnailUrl} alt={videoTitle} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-[#1e1e2e] to-[#0a0a0f] flex items-center justify-center">
                      <PlatformIcon className="h-8 w-8 text-white/15" />
                    </div>
                  )}
                </div>
                <div className="w-full">
                  <p className="text-xs font-medium text-white/80 line-clamp-2 leading-snug">{videoTitle || 'Untitled'}</p>
                  <p className="text-[11px] text-white/30 mt-0.5">Video preview</p>
                </div>
              </div>

              {/* Form */}
              <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
                {/* Title */}
                <div>
                  <label className="block text-xs font-semibold text-white/40 uppercase tracking-widest mb-2">
                    Title <span className="text-red-400 normal-case tracking-normal font-normal">*</span>
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value.slice(0, config.titleMaxLength))}
                    placeholder="Add a title..."
                    className="w-full px-4 py-2.5 bg-white/[0.04] border border-white/10 rounded-xl text-white text-sm placeholder-white/25 focus:outline-none focus:border-white/25 transition-colors"
                  />
                  <div className="flex justify-end mt-1">
                    <span className={`text-[11px] ${title.length >= config.titleMaxLength ? 'text-red-400' : 'text-white/25'}`}>
                      {title.length}/{config.titleMaxLength}
                    </span>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-xs font-semibold text-white/40 uppercase tracking-widest mb-2">
                    Description
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value.slice(0, descMax))}
                    placeholder="Tell viewers about your video..."
                    rows={5}
                    className="w-full px-4 py-2.5 bg-white/[0.04] border border-white/10 rounded-xl text-white text-sm placeholder-white/25 focus:outline-none focus:border-white/25 transition-colors resize-none leading-relaxed"
                  />
                  <div className="flex justify-end mt-1">
                    <span className={`text-[11px] ${descLen >= descMax ? 'text-red-400' : 'text-white/25'}`}>
                      {descLen.toLocaleString()}/{descMax.toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Visibility */}
                <div>
                  <label className="block text-xs font-semibold text-white/40 uppercase tracking-widest mb-3">
                    Visibility
                  </label>
                  <div className="space-y-2">
                    {PRIVACY_OPTIONS.map(({ value, label, desc, icon: Icon }) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setPrivacyStatus(value)}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition-colors text-left ${
                          privacyStatus === value
                            ? 'border-primary/40 bg-primary/[0.06]'
                            : 'border-white/[0.07] bg-white/[0.02] hover:border-white/15'
                        }`}
                      >
                        <Icon className={`h-4 w-4 flex-shrink-0 ${privacyStatus === value ? 'text-primary' : 'text-white/40'}`} />
                        <div className="flex-1">
                          <p className={`text-sm font-medium ${privacyStatus === value ? 'text-white' : 'text-white/60'}`}>{label}</p>
                          <p className="text-xs text-white/30 mt-0.5">{desc}</p>
                        </div>
                        <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${privacyStatus === value ? 'border-primary' : 'border-white/20'}`}>
                          {privacyStatus === value && <div className="w-1.5 h-1.5 rounded-full bg-primary" />}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Scheduler */}
                {showScheduler && (
                  <div>
                    <label className="block text-xs font-semibold text-white/40 uppercase tracking-widest mb-2">
                      Schedule Date & Time
                    </label>
                    <input
                      type="datetime-local"
                      value={scheduledAt}
                      onChange={(e) => setScheduledAt(e.target.value)}
                      className="w-full px-4 py-2.5 bg-white/[0.04] border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-white/25 transition-colors"
                      step="300"
                      min={minDateTime}
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 px-5 py-3.5 border-t border-white/[0.07]">
            <button
              onClick={onCancel}
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-white/50 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting || (config.showTitle && !title.trim()) || (showScheduler && !scheduledAt)}
              className="px-5 py-2 font-semibold rounded-xl text-sm"
            >
              {isSubmitting ? (showScheduler ? 'Scheduling...' : 'Posting...') : confirmLabel}
            </Button>
          </div>
        </div>
      </div>
    </>,
    document.body
  )
}
