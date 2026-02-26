import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase/client'
import { safeLocalStorage } from '@/lib/utils/safe-storage'
import { AvatarSelector } from './avatar-selector'
import { setCreatorId } from '@/lib/auth/session'

export function SetupForm() {
  const [displayName, setDisplayName] = useState('')
  const [niche, setNiche] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const navigate = useNavigate()

  // Get user ID from client-side session
  useEffect(() => {
    const getUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          setUserId(user.id)
          console.log('[SetupForm] Got user ID from client:', user.id)
        }
      } catch (e) {
        console.warn('[SetupForm] Could not get user ID:', e)
      }
    }
    getUser()
  }, [supabase])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const edgeFunctionUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-profile`

      const response = await fetch(edgeFunctionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({
          display_name: displayName || null,
          niche: niche || null,
          avatar_url: avatarUrl || null,
          user_id: userId || null,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create profile')
      }

      const profile = data.profile
      console.log('Profile created:', profile)

      if (profile?.unique_identifier) {
        safeLocalStorage.setItem('creator_unique_identifier', profile.unique_identifier)
        setCreatorId(profile.unique_identifier)
        console.log('✅ Profile created with unique_identifier:', profile.unique_identifier)
        navigate('/dashboard')
      } else {
        console.warn('⚠️ Profile created but no unique_identifier returned')
        navigate('/dashboard')
      }
    } catch (err: any) {
      console.error('Profile creation error:', err)
      const errorMessage = err?.message || 'Failed to create profile. Please try again.'
      setError(errorMessage)
      setLoading(false)
    }
  }

  const popularNiches = [
    'Fitness',
    'Business',
    'Technology',
    'Education',
    'Entertainment',
    'Lifestyle',
    'Gaming',
    'Finance',
    'Health',
    'Travel',
    'Food',
    'Music',
    'Art',
    'Sports',
    'Other',
  ]

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-sm text-red-500">
          {error}
        </div>
      )}

      <div>
        <label className="block text-sm font-semibold mb-2 text-foreground">
          Display Name <span className="text-foreground/50 font-normal">(optional)</span>
        </label>
        <input
          type="text"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          className="w-full px-4 py-3 bg-background border border-border rounded-lg text-foreground placeholder:text-foreground/40 focus:outline-none focus:ring-2 focus:ring-[#89CFF0]/50 focus:border-[#89CFF0]/50 transition-colors"
          placeholder="Your creator name"
        />
        <p className="text-xs text-foreground/60 mt-2">
          This will be shown on your profile and leaderboards
        </p>
      </div>

      <div>
        <label className="block text-sm font-semibold mb-2 text-foreground">
          Niche <span className="text-foreground/50 font-normal">(optional)</span>
        </label>
        <select
          value={niche}
          onChange={(e) => setNiche(e.target.value)}
          className="w-full px-4 py-3 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-[#89CFF0]/50 focus:border-[#89CFF0]/50 transition-colors"
        >
          <option value="" className="bg-background">Select a niche</option>
          {popularNiches.map((n) => (
            <option key={n} value={n} className="bg-background">
              {n}
            </option>
          ))}
        </select>
        <p className="text-xs text-foreground/60 mt-2">
          Your content category
        </p>
      </div>

      <div>
        <label className="block text-sm font-semibold mb-3 text-foreground">
          Profile Picture <span className="text-foreground/50 font-normal">(optional)</span>
        </label>
        <AvatarSelector value={avatarUrl} onChange={setAvatarUrl} />
      </div>

      <div className="flex gap-4 pt-4">
        <Button
          type="submit"
          className="flex-1"
          disabled={loading}
        >
          {loading ? 'Creating Profile...' : 'Create Profile'}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => navigate('/dashboard')}
          disabled={loading}
        >
          Skip for Now
        </Button>
      </div>
    </form>
  )
}
