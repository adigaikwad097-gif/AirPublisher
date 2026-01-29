'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Upload, X, Loader2 } from 'lucide-react'
import Image from 'next/image'

interface ProfileEditFormProps {
  initialDisplayName: string
  initialAvatarUrl: string
  initialNiche: string
}

// List of available avatar images
const AVAILABLE_AVATARS = [
  'blackbaddie.png',
  'blackboycap.png',
  'blondegirl.png',
  'desibaddie.png',
  'droid.png',
  'emogirl.png',
  'farmergirl.png',
  'granddad.png',
  'granny.png',
  'laidbackguy.png',
  'lightskin.png',
  'mewtwo.png',
  'steve.png',
  'whiteboycap.png',
]

export function ProfileEditForm({ 
  initialDisplayName, 
  initialAvatarUrl, 
  initialNiche 
}: ProfileEditFormProps) {
  const [displayName, setDisplayName] = useState(initialDisplayName)
  const [niche, setNiche] = useState(initialNiche)
  const [avatarUrl, setAvatarUrl] = useState(initialAvatarUrl)
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file')
      return
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image size must be less than 5MB')
      return
    }

    setAvatarFile(file)
    setError(null)

    // Create preview
    const reader = new FileReader()
    reader.onloadend = () => {
      setAvatarPreview(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleRemoveAvatar = () => {
    setAvatarFile(null)
    setAvatarPreview(null)
    setAvatarUrl('')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleSelectAvatar = (avatarName: string) => {
    const avatarUrl = `/avatars/${avatarName}`
    setAvatarUrl(avatarUrl)
    setAvatarFile(null) // Clear any uploaded file
    setAvatarPreview(null) // Clear preview
    setError(null)
  }

  const handleUploadAvatar = async () => {
    if (!avatarFile) return

    setUploading(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append('file', avatarFile)

      const response = await fetch('/api/profile/upload-avatar', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to upload image')
      }

      setAvatarUrl(data.url)
      setAvatarFile(null) // Clear file after successful upload
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (err: any) {
      setError(err.message || 'Failed to upload image')
    } finally {
      setUploading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    setSuccess(false)

    try {
      // If there's a new avatar file, upload it first
      if (avatarFile && !avatarUrl) {
        await handleUploadAvatar()
        // Wait a bit for the upload to complete
        await new Promise(resolve => setTimeout(resolve, 500))
      }

      // Update profile
      const response = await fetch('/api/profile/update', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          display_name: displayName || null,
          avatar_url: avatarUrl || null,
          niche: niche || null,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update profile')
      }

      setSuccess(true)
      // Refresh the page to show updated profile
      setTimeout(() => {
        window.location.reload()
      }, 1500)
    } catch (err: any) {
      setError(err.message || 'Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-sm text-red-400">
          {error}
        </div>
      )}

      {success && (
        <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg text-sm text-green-400">
          Profile updated successfully!
        </div>
      )}

      {/* Profile Picture */}
      <div>
        <label className="block text-sm font-medium mb-3 text-white/70">
          Profile Picture
        </label>
        
        {/* Current Avatar Preview */}
        <div className="mb-6">
          <div className="flex items-start gap-6">
            <div className="relative">
              {(avatarPreview || avatarUrl) ? (
                <div className="relative w-24 h-24 rounded-full overflow-hidden border-2 border-[#89CFF0]">
                  <Image
                    src={avatarPreview || avatarUrl}
                    alt="Profile"
                    width={96}
                    height={96}
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={handleRemoveAvatar}
                    className="absolute top-0 right-0 p-1 bg-red-500 rounded-full text-white hover:bg-red-600"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ) : (
                <div className="w-24 h-24 rounded-full bg-white/10 border-2 border-white/20 flex items-center justify-center">
                  <Upload className="h-8 w-8 text-white/50" />
                </div>
              )}
            </div>
            <div className="flex-1 space-y-3">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  className="bg-white/5 border-white/10 text-white hover:bg-white/10"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Custom Image
                </Button>
                {avatarFile && (
                  <Button
                    type="button"
                    onClick={handleUploadAvatar}
                    disabled={uploading}
                    className="bg-[#89CFF0] text-black hover:bg-[#89CFF0]/90"
                  >
                    {uploading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      'Upload'
                    )}
                  </Button>
                )}
              </div>
              <p className="text-xs text-white/50">
                Recommended: Square image, at least 400x400px. Max size: 5MB
              </p>
            </div>
          </div>
        </div>

        {/* Avatar Gallery */}
        <div>
          <p className="text-sm text-white/70 mb-3">Or choose from pre-made avatars:</p>
          <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-7 gap-3">
            {AVAILABLE_AVATARS.map((avatarName) => {
              const avatarPath = `/avatars/${avatarName}`
              const isSelected = avatarUrl === avatarPath && !avatarPreview
              return (
                <button
                  key={avatarName}
                  type="button"
                  onClick={() => handleSelectAvatar(avatarName)}
                  className={`relative w-16 h-16 rounded-full overflow-hidden border-2 transition-all ${
                    isSelected
                      ? 'border-[#89CFF0] ring-2 ring-[#89CFF0]/50 scale-110'
                      : 'border-white/20 hover:border-white/40 hover:scale-105'
                  }`}
                >
                  <Image
                    src={avatarPath}
                    alt={avatarName.replace('.png', '')}
                    fill
                    className="object-cover"
                  />
                  {isSelected && (
                    <div className="absolute inset-0 bg-[#89CFF0]/20 flex items-center justify-center">
                      <div className="w-4 h-4 bg-[#89CFF0] rounded-full" />
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Display Name */}
      <div>
        <label htmlFor="displayName" className="block text-sm font-medium mb-2 text-white/70">
          Display Name
        </label>
        <input
          id="displayName"
          type="text"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-[#89CFF0] focus:border-[#89CFF0]/50"
          placeholder="Enter your display name"
        />
      </div>

      {/* Niche */}
      <div>
        <label htmlFor="niche" className="block text-sm font-medium mb-2 text-white/70">
          Niche
        </label>
        <input
          id="niche"
          type="text"
          value={niche}
          onChange={(e) => setNiche(e.target.value)}
          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-[#89CFF0] focus:border-[#89CFF0]/50"
          placeholder="e.g., Music, Tech, Gaming"
        />
      </div>

      {/* Submit */}
      <Button
        type="submit"
        disabled={saving || uploading}
        className="w-full bg-[#89CFF0] text-black hover:bg-[#89CFF0]/90 font-semibold"
      >
        {saving ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Saving...
          </>
        ) : (
          'Save Changes'
        )}
      </Button>
    </form>
  )
}


