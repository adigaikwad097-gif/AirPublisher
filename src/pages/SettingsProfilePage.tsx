import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { getCurrentCreator, type CreatorProfile } from '@/lib/db/creator'
import { ProfileEditForm } from '@/components/settings/profile-edit-form'
import { useNavigate } from 'react-router-dom'

export default function SettingsProfilePage() {
    const [creator, setCreator] = useState<CreatorProfile | null>(null)
    const [loading, setLoading] = useState(true)
    const navigate = useNavigate()

    useEffect(() => {
        async function fetchCreator() {
            try {
                const creatorData = await getCurrentCreator()
                if (!creatorData) {
                    navigate('/setup')
                } else {
                    setCreator(creatorData)
                }
            } catch (error) {
                console.error('Error fetching creator:', error)
            } finally {
                setLoading(false)
            }
        }

        fetchCreator()
    }, [navigate])

    if (loading) {
        return <div className="p-8 text-white">Loading profile...</div>
    }

    if (!creator) {
        return null // Will redirect
    }

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold mb-2 text-white">Profile Settings</h1>
                <p className="text-white/70 text-sm uppercase tracking-[0.4em]">
                    Update your profile information
                </p>
            </div>

            <Card className="bg-white/5 border-white/10">
                <CardHeader>
                    <CardTitle className="text-white">Edit Profile</CardTitle>
                    <CardDescription className="text-white/70">
                        Update your display name and profile picture
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <ProfileEditForm
                        initialDisplayName={creator.display_name || ''}
                        initialAvatarUrl={creator.avatar_url || ''}
                        initialNiche={creator.niche || ''}
                    />
                </CardContent>
            </Card>
        </div>
    )
}
