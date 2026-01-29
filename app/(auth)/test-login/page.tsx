'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function TestLoginPage() {
  const [status, setStatus] = useState('Logging in...')
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const testLogin = async () => {
      try {
        setStatus('Attempting to sign in...')
        
        // Try to sign in with the test email
        // Note: This will only work if you know the password
        // For now, let's check if there's a session first
        const { data: { session } } = await supabase.auth.getSession()
        
        if (session) {
          setStatus('Already logged in! Redirecting...')
          router.push('/dashboard')
          return
        }

        setStatus('Please use the regular login page. This test route requires the password.')
        
        // If you want to auto-login, you'd need to call:
        // const { data, error } = await supabase.auth.signInWithPassword({
        //   email: 'alyanmr738@gmail.com',
        //   password: 'your_password_here'
        // })
        
      } catch (error) {
        setStatus(`Error: ${error}`)
      }
    }

    testLogin()
  }, [router, supabase])

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <p className="text-lg">{status}</p>
      </div>
    </div>
  )
}



