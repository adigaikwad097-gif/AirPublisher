import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { SetupForm } from '@/components/setup/setup-form'
import { getCurrentCreator } from '@/lib/db/creator'
import { useNavigate } from 'react-router-dom'
import { getCreatorId } from '@/lib/auth/session'

export default function SetupPage() {
    const [loading, setLoading] = useState(true)
    const navigate = useNavigate()

    useEffect(() => {
        async function checkCreator() {
            try {
                const profileId = getCreatorId()

                if (profileId) {
                    const creator = await getCurrentCreator(profileId)
                    if (creator) {
                        // If profile already exists, redirect to dashboard
                        navigate('/dashboard', { replace: true })
                        return
                    }
                }
            } catch (error) {
                console.error('[SetupPage] Error checking creator:', error)
            } finally {
                setLoading(false)
            }
        }

        checkCreator()
    }, [navigate])

    if (loading) {
        return (
            <div className="max-w-2xl mx-auto space-y-8 py-8 text-center pt-20">
                <p className="text-foreground/70">Checking profile status...</p>
            </div>
        )
    }

    return (
        <div className="max-w-2xl mx-auto space-y-8 py-8">
            <div>
                <h1 className="text-3xl font-bold mb-3 text-foreground">Complete Your Profile</h1>
                <p className="text-foreground/70 text-lg">
                    Set up your creator profile to start publishing and competing on leaderboards.
                </p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="text-foreground">Creator Information</CardTitle>
                    <CardDescription>
                        This information will be displayed on your profile and leaderboards.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <SetupForm />
                </CardContent>
            </Card>
        </div>
    )
}
