import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ConfirmModal } from '@/components/ui/confirm-modal'
import { AlertTriangle, Trash2 } from 'lucide-react'
import { clearCreatorSession, getCreatorId } from '@/lib/auth/session'
import { supabase } from '@/lib/supabase/client'
import { useNavigate } from 'react-router-dom'

export function DangerZoneSection() {
    const [showDeleteModal, setShowDeleteModal] = useState(false)
    const [deleting, setDeleting] = useState(false)
    const navigate = useNavigate()

    const handleDeleteAccount = async () => {
        setDeleting(true)
        try {
            const creatorId = getCreatorId()
            if (!creatorId) {
                throw new Error('No creator session found')
            }

            const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
            const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

            const response = await fetch(`${supabaseUrl}/functions/v1/delete-account`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'apikey': supabaseAnonKey,
                },
                body: JSON.stringify({ creatorUniqueIdentifier: creatorId }),
            })

            if (!response.ok) {
                const errData = await response.json().catch(() => ({}))
                throw new Error(errData.error || 'Failed to delete account')
            }

            // Clear local session
            clearCreatorSession()

            // Sign out from Supabase Auth
            await supabase.auth.signOut().catch(() => {})

            // Redirect to home
            navigate('/')
        } catch (error: any) {
            console.error('Delete account error:', error)
            alert(error.message || 'Failed to delete account. Please try again.')
        } finally {
            setDeleting(false)
            setShowDeleteModal(false)
        }
    }

    return (
        <>
            <Card className="bg-red-500/5 border-red-500/20">
                <CardHeader>
                    <CardTitle className="text-red-400 flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5" />
                        Danger Zone
                    </CardTitle>
                    <CardDescription className="text-white/60">
                        Irreversible actions that affect your account
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-between p-4 bg-red-500/5 border border-red-500/10 rounded-lg">
                        <div>
                            <p className="text-sm font-medium text-white">Delete Account</p>
                            <p className="text-xs text-white/50 mt-0.5">
                                Permanently delete your account and all associated data. This action cannot be undone.
                            </p>
                        </div>
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={() => setShowDeleteModal(true)}
                            disabled={deleting}
                            className="text-red-400 hover:text-red-300 hover:bg-red-500/10 border border-red-500/20 shrink-0 ml-4"
                        >
                            <Trash2 className="w-4 h-4 mr-2" />
                            {deleting ? 'Deleting...' : 'Delete Account'}
                        </Button>
                    </div>
                </CardContent>
            </Card>

            <ConfirmModal
                isOpen={showDeleteModal}
                title="Delete Account"
                message="Are you sure you want to permanently delete your account? This will remove all your videos, connections, scheduled posts, and profile data. This action cannot be undone."
                confirmLabel="Yes, Delete My Account"
                cancelLabel="Cancel"
                variant="danger"
                onConfirm={handleDeleteAccount}
                onCancel={() => setShowDeleteModal(false)}
            />
        </>
    )
}
