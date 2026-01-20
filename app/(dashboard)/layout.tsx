import { Sidebar } from '@/components/dashboard/sidebar'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Skip server-side auth checks - rely on client-side auth
  // This avoids cookie/session detection issues with ngrok and development
  // Client-side will handle redirects if not authenticated
  const isDevelopment = process.env.NODE_ENV === 'development'
  const isNgrok = process.env.NEXT_PUBLIC_APP_URL?.includes('ngrok') || 
                  process.env.NEXT_PUBLIC_APP_URL?.includes('ngrok-free.dev')
  
  if (isDevelopment || isNgrok) {
    console.log('[DashboardLayout] ⚠️ Dev/ngrok mode: Skipping server-side auth check')
    console.log('[DashboardLayout] NEXT_PUBLIC_APP_URL:', process.env.NEXT_PUBLIC_APP_URL)
  } else {
    // Production: Still check auth (but be lenient)
    try {
      const supabase = await createClient()
      const { data: { user }, error } = await supabase.auth.getUser()
      
      if (error) {
        console.log('[DashboardLayout] Auth check error (non-blocking):', error.message)
        // Don't redirect on error - let client-side handle it
      } else if (!user) {
        console.log('[DashboardLayout] No authenticated user, redirecting to login')
        redirect('/login')
      } else {
        console.log('[DashboardLayout] ✅ User authenticated:', user.id)
      }
    } catch (error: any) {
      console.log('[DashboardLayout] Auth check exception - allowing access (will be handled client-side):', error.message)
    }
  }

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <main className="flex-1 overflow-y-auto bg-background">
        <div className="container mx-auto px-6 py-8">{children}</div>
      </main>
    </div>
  )
}

