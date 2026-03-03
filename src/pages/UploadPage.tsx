import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { UploadForm } from '@/components/upload/upload-form'
import { getCurrentCreator } from '@/lib/db/creator'
import { Link } from 'react-router-dom'
import { CreatorProfile } from '@/lib/db/creator'
import { getCreatorId } from '@/lib/auth/session'

export default function UploadPage() {
    const [creator, setCreator] = useState<CreatorProfile | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function fetchCreator() {
            try {
                const profileId = getCreatorId()
                if (!profileId) return

                const data = await getCurrentCreator(profileId)
                setCreator(data)
            } catch (error) {
                console.error('[UploadPage] Error fetching creator:', error)
            } finally {
                setLoading(false)
            }
        }
        fetchCreator()
    }, [])

    if (loading) {
        return (
            <div className="space-y-8">
                <div className="text-center py-12">
                    <p className="text-white/70">Loading upload area...</p>
                </div>
            </div>
        )
    }

    if (!creator) {
        return (
            <div className="space-y-8">
                <div>
                    <h1 className="text-4xl font-bold text-white tracking-tight">Upload Video</h1>
                    <p className="text-lg text-white/50 mt-3">
                        Please complete your creator profile first.
                    </p>
                </div>
                <Card className="bg-white/5 border-white/10">
                    <CardContent className="pt-6">
                        <div className="text-center py-8">
                            <p className="text-2xl font-semibold mb-4 text-white/90">
                                Complete your creator profile to start uploading content.
                            </p>
                            <Link to="/setup">
                                <Button size="lg" className="bg-primary text-background hover:bg-primary-dark">
                                    Set Up Profile
                                </Button>
                            </Link>
                        </div>
                    </CardContent>
                </Card>
            </div>
        )
    }

    return (
        <div className="w-full flex flex-col gap-8" style={{ height: 'calc(100vh - 9rem)' }}>
            <div className="shrink-0">
                <h1 className="text-4xl font-bold text-white tracking-tight">Upload Video</h1>
                <p className="text-lg text-white/50 mt-3">Add new content to your library</p>
            </div>
            <div className="flex-1 min-h-0">
                <UploadForm creatorUniqueIdentifier={creator.unique_identifier} />
            </div>
        </div>
    )
}
