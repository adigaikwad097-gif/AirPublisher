import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { getCurrentCreator } from '@/lib/db/creator'
import { ProfileEditForm } from '@/components/settings/profile-edit-form'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function ProfileSettingsPage() {
  let creator = null
  
  try {
    creator = await getCurrentCreator()
  } catch (error: any) {
    console.error('[ProfileSettingsPage] Error fetching creator:', error?.message || String(error))
  }

  if (!creator) {
    redirect('/setup')
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-extrabold mb-2 text-white">Profile Settings</h1>
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


