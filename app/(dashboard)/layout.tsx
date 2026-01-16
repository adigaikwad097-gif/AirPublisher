import { Sidebar } from '@/components/dashboard/sidebar'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // TEMPORARY DEVELOPMENT BYPASS: Allow access for testing
  // TODO: Remove this in production
  const isDevelopment = process.env.NODE_ENV === 'development'
  
  if (!isDevelopment) {
    try {
      const supabase = await createClient()
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser()

      // Production: require real authentication
      if (!user || authError) {
        redirect('/login')
      }
    } catch (error: any) {
      console.error('[DashboardLayout] Auth check error:', error?.message || String(error))
      // In case of error, redirect to login for safety
      redirect('/login')
    }
  }
  // In development, allow access even without auth

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="container mx-auto px-6 py-8">{children}</div>
      </main>
    </div>
  )
}

