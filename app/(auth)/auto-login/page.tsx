'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function AutoLoginPage() {
  const [status, setStatus] = useState('Setting up...')
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const autoLogin = async () => {
      try {
        // Check if already logged in
        const { data: { session } } = await supabase.auth.getSession()
        if (session?.user) {
          setStatus('Already logged in! Redirecting...')
          setTimeout(() => {
            window.location.href = '/dashboard'
          }, 500)
          return
        }

        setStatus('Please enter your password to auto-login...')
        
        // For security, we can't auto-login without password
        // But we can create a magic link or check if there's a way to bypass
        // For now, redirect to login with email pre-filled
        
        // Store email in localStorage for convenience
        if (typeof window !== 'undefined') {
          localStorage.setItem('prefill_email', 'alyanmr738@gmail.com')
        }
        
        setStatus('Redirecting to login page...')
        setTimeout(() => {
          window.location.href = '/login?email=alyanmr738@gmail.com'
        }, 1000)
        
      } catch (error: any) {
        setStatus(`Error: ${error.message}`)
      }
    }

    autoLogin()
  }, [router, supabase])

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <p className="text-lg text-foreground">{status}</p>
      </div>
    </div>
  )
}



