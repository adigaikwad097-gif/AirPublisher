import { useEffect, useState } from 'react'
import { getCurrentCreator, type CreatorProfile } from '@/lib/db/creator'
import { supabase } from '@/lib/supabase/client'
import { useNavigate } from 'react-router-dom'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { ProfileInfoSection } from '@/components/settings/profile-info-section'
import { BillingSection } from '@/components/settings/billing-section'
import { DangerZoneSection } from '@/components/settings/danger-zone-section'
import { Settings, CreditCard } from 'lucide-react'

export default function SettingsProfilePage() {
    const [creator, setCreator] = useState<CreatorProfile | null>(null)
    const [email, setEmail] = useState<string | null>(null)
    const [loading, setLoading] = useState(true)
    const navigate = useNavigate()

    useEffect(() => {
        async function fetchData() {
            try {
                const creatorData = await getCurrentCreator()
                if (!creatorData) {
                    navigate('/setup')
                    return
                }
                setCreator(creatorData)

                // Try to get email from Supabase Auth
                try {
                    const { data: { user } } = await supabase.auth.getUser()
                    if (user?.email) {
                        setEmail(user.email)
                    }
                } catch {
                    // Auth user may not exist for cookie-only sessions
                }
            } catch (error) {
                console.error('Error fetching creator:', error)
            } finally {
                setLoading(false)
            }
        }

        fetchData()
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
                <h1 className="text-4xl font-bold text-white tracking-tight">Profile Settings</h1>
                <p className="text-lg text-white/50 mt-3">
                    Manage your account and subscription
                </p>
            </div>

            <Tabs defaultValue="settings" className="w-full">
                <TabsList className="mb-6">
                    <TabsTrigger value="settings">
                        <Settings className="w-4 h-4 mr-2" />
                        Settings
                    </TabsTrigger>
                    <TabsTrigger value="billing">
                        <CreditCard className="w-4 h-4 mr-2" />
                        Billing
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="settings" className="space-y-6">
                    <ProfileInfoSection
                        displayName={creator.display_name}
                        avatarUrl={creator.avatar_url}
                        creatorId={creator.unique_identifier}
                        email={email}
                        niche={creator.niche}
                        memberSince={creator.created_at}
                    />
                    <DangerZoneSection />
                </TabsContent>

                <TabsContent value="billing">
                    <BillingSection />
                </TabsContent>
            </Tabs>
        </div>
    )
}
