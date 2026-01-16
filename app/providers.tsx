'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'

type CreatorContextType = {
  user: User | null
  creatorProfile: any | null
  loading: boolean
}

const CreatorContext = createContext<CreatorContextType>({
  user: null,
  creatorProfile: null,
  loading: true,
})

export function useCreator() {
  return useContext(CreatorContext)
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [creatorProfile, setCreatorProfile] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  return (
    <CreatorContext.Provider value={{ user, creatorProfile, loading }}>
      {children}
    </CreatorContext.Provider>
  )
}

