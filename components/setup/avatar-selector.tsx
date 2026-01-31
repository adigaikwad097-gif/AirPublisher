'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Upload, X, Check } from 'lucide-react'
import Image from 'next/image'

interface AvatarSelectorProps {
  value: string
  onChange: (url: string) => void
}

// Preset avatar URLs - using placeholder service or you can use your own
const PRESET_AVATARS = [
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Sam',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Jordan',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Taylor',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Casey',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Riley',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Avery',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Quinn',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Morgan',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Cameron',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Dakota',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Sage',
]

export function AvatarSelector({ value, onChange }: AvatarSelectorProps) {
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handlePresetSelect = (url: string) => {
    onChange(url)
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setUploadError('Please select an image file')
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setUploadError('Image size must be less than 5MB')
      return
    }

    setUploading(true)
    setUploadError(null)

    try {
      // Upload to Supabase Storage
      const formData = new FormData()
      formData.append('file', file)
      formData.append('folder', 'avatars')

      const response = await fetch('/api/profile/upload-avatar', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to upload avatar')
      }

      onChange(data.url)
    } catch (error: any) {
      console.error('Avatar upload error:', error)
      setUploadError(error.message || 'Failed to upload avatar')
    } finally {
      setUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleCustomUrl = () => {
    const url = prompt('Enter image URL:')
    if (url) {
      onChange(url)
    }
  }

  return (
    <div className="space-y-4">
      {/* Current Avatar Preview */}
      {value && (
        <div className="flex items-center gap-4 p-4 bg-card border border-border rounded-lg">
          <div className="relative w-20 h-20 rounded-full overflow-hidden border-2 border-primary/50 bg-background">
            <Image
              src={value}
              alt="Selected avatar"
              fill
              className="object-cover"
              onError={(e) => {
                console.error('Failed to load avatar image:', value)
              }}
            />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-foreground">Selected Avatar</p>
            <p className="text-xs text-foreground/60 truncate max-w-xs">{value}</p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onChange('')}
            className="text-foreground/60 hover:text-foreground hover:bg-card-hover"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Upload Section */}
      <div className="space-y-2">
        <label className="block text-sm font-semibold text-foreground">
          Upload Your Own Avatar
        </label>
        <div className="flex gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            className="hidden"
            id="avatar-upload"
            disabled={uploading}
          />
          <label
            htmlFor="avatar-upload"
            className="flex-1 cursor-pointer"
          >
            <Button
              type="button"
              variant="outline"
              className="w-full"
              disabled={uploading}
            >
              <Upload className="h-4 w-4 mr-2" />
              {uploading ? 'Uploading...' : 'Upload Image'}
            </Button>
          </label>
          <Button
            type="button"
            variant="outline"
            onClick={handleCustomUrl}
            disabled={uploading}
          >
            Enter URL
          </Button>
        </div>
        {uploadError && (
          <p className="text-xs text-error">{uploadError}</p>
        )}
        <p className="text-xs text-foreground/60">
          Upload an image (max 5MB) or enter a URL
        </p>
      </div>

      {/* Preset Avatars */}
      <div className="space-y-2">
        <label className="block text-sm font-semibold text-foreground">
          Or Choose a Preset Avatar
        </label>
        <div className="grid grid-cols-6 gap-3">
          {PRESET_AVATARS.map((url, index) => {
            const isSelected = value === url
            return (
              <button
                key={index}
                type="button"
                onClick={() => handlePresetSelect(url)}
                className={`relative w-16 h-16 rounded-full overflow-hidden border-2 transition-all hover:scale-110 bg-background ${
                  isSelected
                    ? 'border-primary ring-2 ring-primary/50'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <Image
                  src={url}
                  alt={`Preset avatar ${index + 1}`}
                  fill
                  className="object-cover"
                />
                {isSelected && (
                  <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                    <Check className="h-6 w-6 text-primary" />
                  </div>
                )}
              </button>
            )
          })}
        </div>
        <p className="text-xs text-foreground/60">
          Click on an avatar to select it
        </p>
      </div>
    </div>
  )
}

