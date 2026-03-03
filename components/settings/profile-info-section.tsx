import { useState, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Camera, Copy, Check, User } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { getCreatorId } from '@/lib/auth/session'

interface ProfileInfoSectionProps {
    displayName: string | null
    avatarUrl: string | null
    creatorId: string
    email: string | null
    niche: string | null
    memberSince: string
}

export function ProfileInfoSection({
    displayName,
    avatarUrl,
    creatorId,
    email,
    niche,
    memberSince,
}: ProfileInfoSectionProps) {
    const [avatar, setAvatar] = useState(avatarUrl || '')
    const [uploading, setUploading] = useState(false)
    const [uploadError, setUploadError] = useState<string | null>(null)
    const [copied, setCopied] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const formattedDate = memberSince
        ? new Date(memberSince).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        })
        : 'Unknown'

    const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        if (!file.type.startsWith('image/')) {
            setUploadError('Please select an image file')
            return
        }

        if (file.size > 5 * 1024 * 1024) {
            setUploadError('Image size must be less than 5MB')
            return
        }

        setUploading(true)
        setUploadError(null)

        try {
            const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
            const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
            const currentCreatorId = getCreatorId()

            if (!currentCreatorId) {
                throw new Error('No creator session found')
            }

            // Get presigned URL from edge function
            const response = await fetch(`${supabaseUrl}/functions/v1/generate-upload-url`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'apikey': supabaseAnonKey,
                },
                body: JSON.stringify({
                    title: 'avatar',
                    contentType: file.type,
                    creatorUniqueIdentifier: currentCreatorId,
                }),
            })

            if (!response.ok) {
                const errData = await response.json()
                throw new Error(errData.error || 'Failed to get upload URL')
            }

            const { uploadUrl, videoUrl: publicUrl } = await response.json()

            // Upload directly to R2
            const uploadResponse = await fetch(uploadUrl, {
                method: 'PUT',
                headers: { 'Content-Type': file.type },
                body: file,
            })

            if (!uploadResponse.ok) {
                throw new Error('Failed to upload image')
            }

            // Update profile_pic_url in creator_profiles
            const { error: updateError } = await supabase
                .from('creator_profiles')
                .update({ profile_pic_url: publicUrl })
                .eq('unique_identifier', currentCreatorId)

            if (updateError) {
                throw new Error('Failed to update profile picture')
            }

            setAvatar(publicUrl)
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

    const handleCopyId = async () => {
        try {
            await navigator.clipboard.writeText(creatorId)
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
        } catch {
            // Fallback for older browsers
            const textArea = document.createElement('textarea')
            textArea.value = creatorId
            document.body.appendChild(textArea)
            textArea.select()
            document.execCommand('copy')
            document.body.removeChild(textArea)
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
        }
    }

    return (
        <Card className="bg-card border-border/20">
            <CardHeader>
                <CardTitle className="text-white">Profile Information</CardTitle>
                <CardDescription className="text-white/60">
                    Your account details and profile picture
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Avatar Section */}
                <div className="flex items-center gap-6">
                    <div className="relative group">
                        <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-white/20 bg-white/5 flex items-center justify-center">
                            {avatar ? (
                                <img
                                    src={avatar}
                                    alt="Profile"
                                    className="object-cover w-full h-full"
                                    onError={() => setAvatar('')}
                                />
                            ) : (
                                <User className="w-8 h-8 text-white/40" />
                            )}
                        </div>
                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={uploading}
                            className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
                        >
                            <Camera className="w-5 h-5 text-white" />
                        </button>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            onChange={handleAvatarUpload}
                            className="hidden"
                            disabled={uploading}
                        />
                    </div>
                    <div>
                        <p className="text-sm text-white/60">Profile Picture</p>
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={uploading}
                            className="text-primary hover:text-primary/80 hover:bg-white/5 px-0 h-auto text-sm"
                        >
                            {uploading ? 'Uploading...' : 'Change photo'}
                        </Button>
                        {uploadError && (
                            <p className="text-xs text-red-400 mt-1">{uploadError}</p>
                        )}
                    </div>
                </div>

                {/* Profile Fields */}
                <div className="grid gap-4">
                    {/* Display Name */}
                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-white/60">Display Name</label>
                        <div className="px-3 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white">
                            {displayName || 'Not set'}
                        </div>
                    </div>

                    {/* Creator ID */}
                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-white/60">Creator ID</label>
                        <div className="flex items-center gap-2">
                            <div className="flex-1 px-3 py-2.5 bg-white/5 border border-white/10 rounded-lg font-mono text-sm text-white/80 truncate">
                                {creatorId}
                            </div>
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={handleCopyId}
                                className="text-white/60 hover:text-white hover:bg-white/10 shrink-0"
                            >
                                {copied ? (
                                    <Check className="w-4 h-4 text-success" />
                                ) : (
                                    <Copy className="w-4 h-4" />
                                )}
                            </Button>
                        </div>
                    </div>

                    {/* Email */}
                    {email && (
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-white/60">Email</label>
                            <div className="px-3 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white">
                                {email}
                            </div>
                        </div>
                    )}

                    {/* Niche */}
                    {niche && (
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-white/60">Niche</label>
                            <div className="px-3 py-2.5 bg-white/5 border border-white/10 rounded-lg">
                                <Badge variant="primary">{niche}</Badge>
                            </div>
                        </div>
                    )}

                    {/* Member Since */}
                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-white/60">Member Since</label>
                        <div className="px-3 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white">
                            {formattedDate}
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
