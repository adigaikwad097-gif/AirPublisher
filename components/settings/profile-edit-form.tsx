import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

interface ProfileEditFormProps {
    initialDisplayName?: string
    initialAvatarUrl?: string
    initialNiche?: string
}

export function ProfileEditForm({ initialDisplayName = '', initialAvatarUrl = '', initialNiche = '' }: ProfileEditFormProps) {
    const [displayName, setDisplayName] = useState(initialDisplayName)
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        // TODO: Implement profile update using client-side supabase
        setLoading(false)
    }

    return (
        <Card className="bg-white/5 border-white/10 text-white">
            <CardContent className="pt-6">
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-2">Display Name</label>
                        <input
                            type="text"
                            value={displayName}
                            onChange={(e) => setDisplayName(e.target.value)}
                            className="w-full px-3 py-2 bg-black/50 border border-white/20 rounded-md text-white focus:outline-none focus:border-[#89CFF0]"
                        />
                    </div>
                    <Button type="submit" disabled={loading} className="bg-[#89CFF0] text-black hover:bg-[#89CFF0]/90">
                        {loading ? 'Saving...' : 'Save Changes'}
                    </Button>
                </form>
            </CardContent>
        </Card>
    )
}
