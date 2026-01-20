'use client'

import { Button } from '@/components/ui/button'
import { LogOut } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useState } from 'react'

export function SignOutButton() {
  const [loading, setLoading] = useState(false)

  const handleSignOut = async () => {
    setLoading(true)
    const supabase = createClient()
    
    // Clear the creator profile cookie before signing out
    try {
      await fetch('/api/auth/clear-profile-cookie', { method: 'POST' })
      if (typeof window !== 'undefined') {
        localStorage.removeItem('creator_unique_identifier')
      }
    } catch (e) {
      console.warn('Could not clear creator profile cookie:', e)
    }
    
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  return (
    <Button
      variant="outline"
      onClick={handleSignOut}
      disabled={loading}
      className="flex items-center gap-2"
    >
      <LogOut className="h-4 w-4" />
      {loading ? 'Signing out...' : 'Sign Out'}
    </Button>
  )
}


