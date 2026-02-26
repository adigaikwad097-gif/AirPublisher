

import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { X, LayoutDashboard, Upload, Calendar, Trophy, Settings, Video, Compass, LogOut, User } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase/client'
import { safeLocalStorage } from '@/lib/utils/safe-storage'
import { getCurrentCreator } from '@/lib/db/creator'
import { getCreatorId, clearCreatorSession } from '@/lib/auth/session'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Discover', href: '/discover', icon: Compass },
  { name: 'Upload', href: '/upload', icon: Upload },
  { name: 'Videos', href: '/videos', icon: Video },
  { name: 'Schedule', href: '/schedule', icon: Calendar },
  { name: 'Leaderboard', href: '/leaderboard', icon: Trophy },
  { name: 'Profile', href: '/settings/profile', icon: User },
  { name: 'Connections', href: '/settings/connections', icon: Settings },
]

interface SlideInMenuProps {
  isOpen: boolean
  onClose: () => void
}

export function SlideInMenu({ isOpen, onClose }: SlideInMenuProps) {
  const { pathname } = useLocation()
  const [profile, setProfile] = useState<{ display_name: string | null; avatar_url: string | null } | null>(null)

  useEffect(() => {
    async function fetchProfile() {
      if (!isOpen) return

      try {
        const profileId = getCreatorId()
        if (!profileId) return

        const currentCreator = await getCurrentCreator(profileId)
        if (currentCreator) {
          setProfile({
            display_name: currentCreator.display_name || 'User',
            avatar_url: currentCreator.avatar_url || null,
          })
        }
      } catch (err) {
        console.error('Failed to fetch profile:', err)
      }
    }

    fetchProfile()
  }, [isOpen])

  const handleSignOut = async () => {

    // Clear the creator profile cookie before signing out
    try {
      await fetch('/api/auth/clear-profile-cookie', { method: 'POST' })
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
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Slide-in Menu */}
      <div
        className={cn(
          'fixed top-0 left-0 h-full w-80 bg-black border-r border-white/10 z-50 transform transition-transform duration-300 ease-in-out',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between h-20 border-b border-white/10 px-6">
          <div className="flex items-center gap-3">
            {profile?.avatar_url ? (
              <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-white/20 shrink-0">
                <img
                  src={profile.avatar_url}
                  alt={profile.display_name || 'User'}
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className="w-12 h-12 bg-[#89CFF0]/20 rounded-full flex items-center justify-center border border-[#89CFF0]/30 shrink-0">
                <span className="text-[#89CFF0] font-semibold text-xl">
                  {profile?.display_name?.charAt(0).toUpperCase() || 'U'}
                </span>
              </div>
            )}
            <h1 className="text-2xl font-bold text-white tracking-tight truncate max-w-[170px]">
              {profile?.display_name || 'Loading...'}
            </h1>
          </div>
          <button
            onClick={onClose}
            className="text-white/70 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-0.5 px-3 py-4 overflow-y-auto">
          {navigation.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.name}
                to={item.href}
                onClick={onClose}
                className={cn(
                  'flex items-center gap-3 rounded-md px-4 py-3 text-base font-medium transition-all',
                  isActive
                    ? 'bg-white/10 text-[#89CFF0] border-l-2 border-[#89CFF0]'
                    : 'text-white/60 hover:bg-white/5 hover:text-white'
                )}
              >
                <item.icon className="h-5 w-5" />
                {item.name}
              </Link>
            )
          })}
        </nav>

        {/* Sign Out */}
        <div className="border-t border-white/10 p-4">
          <Button
            variant="ghost"
            className="w-full justify-start text-white/60 hover:text-white hover:bg-white/5 text-base font-medium"
            onClick={handleSignOut}
          >
            <LogOut className="mr-2 h-5 w-5" />
            Sign Out
          </Button>
        </div>
      </div>
    </>
  )
}

