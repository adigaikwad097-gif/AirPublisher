'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Upload,
  Calendar,
  Trophy,
  User,
  LogOut,
  Settings,
  Video,
  Compass,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { safeLocalStorage } from '@/lib/utils/safe-storage'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Discover', href: '/discover', icon: Compass },
  { name: 'Upload', href: '/upload', icon: Upload },
  { name: 'Videos', href: '/videos', icon: Video },
  { name: 'Schedule', href: '/schedule', icon: Calendar },
  { name: 'Leaderboard', href: '/leaderboard', icon: Trophy },
  { name: 'Settings', href: '/settings/connections', icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()

  const handleSignOut = async () => {
    const supabase = createClient()

    // Clear the creator profile cookie before signing out
    // This prevents the next user from seeing the previous user's profile
    try {
      // Call API route to clear httpOnly cookie
      await fetch('/api/auth/clear-profile-cookie', { method: 'POST' })
      // Also clear from localStorage if it exists
      if (typeof window !== 'undefined') {
        safeLocalStorage.removeItem('creator_unique_identifier')
      }
    } catch (e) {
      console.warn('Could not clear creator profile cookie:', e)
    }

    await supabase.auth.signOut()
    window.location.href = '/'
  }

  return (
    <div className="flex h-screen w-64 flex-col border-r border-border/20 bg-background">
      <div className="flex h-20 items-center border-b border-border/20 px-6">
        <h1 className="text-lg font-semibold text-foreground tracking-tight">AIR Publisher</h1>
      </div>
      <nav className="flex-1 space-y-0.5 px-3 py-4">
        {navigation.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-md px-4 py-2.5 text-sm font-medium transition-all',
                isActive
                  ? 'bg-card text-primary border-l-2 border-primary'
                  : 'text-muted hover:bg-card hover:text-foreground'
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.name}
            </Link>
          )
        })}
      </nav>
      <div className="border-t border-border/20 p-4">
        <Button
          variant="ghost"
          className="w-full justify-start"
          onClick={handleSignOut}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Sign Out
        </Button>
      </div>
    </div>
  )
}

