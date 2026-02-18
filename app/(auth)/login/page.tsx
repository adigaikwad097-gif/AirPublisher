'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { safeLocalStorage } from '@/lib/utils/safe-storage'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  // Pre-fill email from URL or localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search)
      const emailParam = urlParams.get('email')
      const messageParam = urlParams.get('message')
      const storedEmail = safeLocalStorage.getItem('prefill_email')

      if (emailParam) {
        setEmail(emailParam)
        safeLocalStorage.removeItem('prefill_email')
      } else if (storedEmail) {
        setEmail(storedEmail)
      }

      // Show success message if present (e.g., from signup)
      if (messageParam) {
        setError(null) // Clear any existing error
        setSuccessMessage(decodeURIComponent(messageParam))
      }
    }
  }, [])

  // Debug: Check if Supabase is configured
  if (typeof window !== 'undefined') {
    console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL)
    console.log('Supabase Anon Key exists:', !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
  }

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    console.log('Form submitted!')
    setLoading(true)
    setError(null)

    console.log('Email:', email)
    console.log('Password length:', password.length)
    console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL)

    try {
      console.log('Calling signInWithPassword...')
      const result = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password,
      })

      console.log('Full result:', JSON.stringify(result, null, 2))

      if (result.error) {
        console.error('Sign in error:', result.error)
        setError(result.error.message)
        setLoading(false)
        return
      }

      if (result.data?.user && result.data.session) {
        console.log('User signed in successfully:', result.data.user.id)
        console.log('Session exists:', !!result.data.session)

        // Sync session to cookies for server-side auth
        try {
          const syncResponse = await fetch('/api/auth/sync-session', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify({
              access_token: result.data.session.access_token,
              refresh_token: result.data.session.refresh_token,
            }),
          })

          if (syncResponse.ok) {
            console.log('✅ Session synced to cookies')
          } else {
            console.warn('⚠️ Could not sync session to cookies, but continuing...')
          }
        } catch (e) {
          console.warn('Could not sync session to cookies:', e)
        }

        // Wait a moment for cookies to be set
        await new Promise(resolve => setTimeout(resolve, 500))

        // Verify session is available before redirecting
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()

        if (sessionError) {
          console.warn('Session check error (non-critical):', sessionError.message)
        }

        if (session) {
          console.log('✅ Session confirmed, redirecting to dashboard...')
          console.log('Session user ID:', session.user.id)

          // For ngrok/development, use a hard redirect to ensure cookies are sent
          // Use setTimeout to ensure all async operations complete
          setTimeout(() => {
            window.location.href = '/dashboard'
          }, 100)
        } else {
          console.warn('⚠️ Session not available yet, waiting longer...')
          // Try one more time after a longer delay
          await new Promise(resolve => setTimeout(resolve, 1000))
          const { data: { session: retrySession }, error: retryError } = await supabase.auth.getSession()

          if (retryError) {
            console.warn('Retry session check error:', retryError.message)
          }

          if (retrySession) {
            console.log('✅ Session confirmed on retry, redirecting...')
            setTimeout(() => {
              window.location.href = '/dashboard'
            }, 100)
          } else {
            console.error('❌ Session still not available after retry')
            console.log('This might be a cookie issue with ngrok. Trying redirect anyway...')
            // Even if session check fails, try redirecting - client-side will handle it
            setTimeout(() => {
              window.location.href = '/dashboard'
            }, 500)
          }
        }
      } else {
        console.error('No user in response')
        setError('Sign in failed. Invalid credentials or account not confirmed.')
        setLoading(false)
      }
    } catch (err: any) {
      console.error('Exception during sign in:', err)
      setError(err?.message || 'An unexpected error occurred. Please try again.')
      setLoading(false)
    }
  }


  return (
    <div className="h-screen bg-black relative overflow-hidden flex">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 z-50 w-full border-0 bg-transparent">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-4 sm:px-6 lg:px-8 py-4 text-white/70">
          <Link href="/" className="flex items-center gap-3">
            <Image
              src="/airpublisher-logo.png?v=3"
              alt="AIR Publisher"
              width={673}
              height={371}
              className="h-16 w-auto"
            />
          </Link>
          <Link href="/" className="text-sm uppercase tracking-[0.4em] hover:text-white transition-colors">
            Back
          </Link>
        </div>
      </nav>

      {/* Left Side - Video */}
      <div className="hidden lg:flex w-1/2 h-screen relative overflow-hidden">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="w-full h-full object-cover"
        >
          <source src="/emoji-video.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-gradient-to-r from-black/50 to-transparent" />
      </div>

      {/* Right Side - Form */}
      <div className="flex-1 lg:w-1/2 h-screen flex items-center justify-center px-4 sm:px-6 lg:px-12 overflow-y-auto">
        <div className="w-full max-w-md space-y-8">
          {/* Title Section */}
          <div className="space-y-2">
            <h1 className="text-5xl font-extrabold text-white tracking-tight">
              Sign In
            </h1>
            <p className="text-xs uppercase tracking-[0.9em] text-white/50">
              Access your creator operating system
            </p>
          </div>

          {/* Form */}
          <form
            onSubmit={(e) => {
              console.log('Form onSubmit triggered!')
              handleSignIn(e)
            }}
            className="space-y-6"
          >
            {successMessage && (
              <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg text-sm text-green-400">
                {successMessage}
              </div>
            )}
            {error && (
              <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-sm text-red-400">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <label className="block text-xs uppercase tracking-[0.4em] text-white/70 mb-3">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-white/30 focus:outline-none focus:border-white/30 focus:bg-white/10 transition-all"
                placeholder="you@example.com"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="block text-xs uppercase tracking-[0.4em] text-white/70 mb-3">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-white/30 focus:outline-none focus:border-white/30 focus:bg-white/10 transition-all"
                placeholder="••••••••"
                required
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-white text-black hover:bg-white/90 font-semibold uppercase tracking-[0.4em] py-6 rounded-lg transition-all"
              disabled={loading}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>

          {/* Sign Up Link */}
          <div className="text-center">
            <p className="text-xs uppercase tracking-[0.4em] text-white/50">
              Don&apos;t have an account?{' '}
              <Link href="/signup" className="text-white hover:text-white/70 transition-colors underline">
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

