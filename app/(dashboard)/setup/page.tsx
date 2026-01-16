import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { SetupForm } from '@/components/setup/setup-form'
import { getCurrentCreator } from '@/lib/db/creator'
import { redirect } from 'next/navigation'

export default async function SetupPage() {
  let creator = null
  
  try {
    creator = await getCurrentCreator()
  } catch (error: any) {
    console.error('[SetupPage] Error fetching creator:', error?.message || String(error))
    // Continue to show setup form if there's an error
    creator = null
  }

  // If profile already exists, redirect to dashboard
  if (creator) {
    // redirect() throws a NEXT_REDIRECT error internally, which is expected behavior
    // We don't need to catch it - Next.js handles it
    redirect('/dashboard')
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div>
        <h1 className="text-4xl font-extrabold mb-3">Complete Your Profile</h1>
        <p className="text-foreground/80 text-lg font-medium">
          Set up your creator profile to start publishing and competing on leaderboards.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Creator Information</CardTitle>
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

