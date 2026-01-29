import { Navbar } from '@/components/dashboard/navbar'
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
  const { isDevelopment, isNgrok, isVercel, getAppUrl } = await import('@/lib/utils/app-url')
  const appUrl = getAppUrl()
  const isDevOrNgrok = isDevelopment() || isNgrok()
  
  if (isDevOrNgrok) {
    console.log('[DashboardLayout] ⚠️ Dev/ngrok mode: Skipping server-side auth check')
    console.log('[DashboardLayout] App URL:', appUrl)
    console.log('[DashboardLayout] Environment:', {
      isDevelopment: isDevelopment(),
      isNgrok: isNgrok(),
      isVercel: isVercel(),
    })
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
    <div className="min-h-screen bg-black">
      <Navbar />
      <main className="pt-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">{children}</div>
      </main>
    </div>
  )
}

