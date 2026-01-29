'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'

export default function SignUpPage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          data: {
            full_name: name.trim() || null, // Store name in user metadata
            name: name.trim() || null, // Also store as 'name' for compatibility
          },
        },
      })

      if (error) {
        setError(error.message)
        setLoading(false)
        return
      }

      if (data.user) {
        console.log('User created:', data.user.id)
        console.log('Session available:', !!data.session)
        
        // Wait for session to be set in cookies
        await new Promise(resolve => setTimeout(resolve, 300))
        
        // Check for session
        const { data: { session } } = await supabase.auth.getSession()
        if (session || data.session) {
          console.log('Session confirmed, redirecting to dashboard...')
          window.location.href = '/dashboard'
        } else {
          console.warn('Session not available, waiting longer...')
          // Try one more time after a longer delay
          await new Promise(resolve => setTimeout(resolve, 500))
          const { data: { session: retrySession } } = await supabase.auth.getSession()
          if (retrySession) {
            console.log('Session confirmed on retry, redirecting...')
            window.location.href = '/dashboard'
          } else {
            // If still no session, redirect to login (might need email verification)
            console.log('No session available, redirecting to login...')
            router.push(`/login?email=${encodeURIComponent(email)}&message=${encodeURIComponent('Account created! Please sign in.')}`)
            setLoading(false)
          }
        }
      } else {
        setError('Sign up failed. Please try again.')
        setLoading(false)
      }
    } catch (err) {
      console.error('Sign up error:', err)
      setError('An unexpected error occurred. Please try again.')
      setLoading(false)
    }
  }


  return (
    <div className="flex h-screen bg-black relative overflow-hidden">
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

      {/* Left Half: Video Background (Hidden on small screens) */}
      <div className="hidden md:flex md:w-1/2 h-screen relative overflow-hidden">
        <video
          className="absolute inset-0 w-full h-full object-cover"
          autoPlay
          loop
          muted
          playsInline
          src="/emoji-video.mp4"
        >
          Your browser does not support the video tag.
        </video>
        {/* Optional: Gradient overlay for better text readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"></div>
      </div>

      {/* Right Half: Sign Up Form */}
      <div className="w-full md:w-1/2 h-screen flex items-center justify-center px-4 py-16 overflow-y-auto">
        <div className="w-full max-w-md space-y-8">
          {/* Title Section */}
          <div className="space-y-2">
            <h1 className="text-5xl font-extrabold text-white tracking-tight">
              Sign Up
            </h1>
            <p className="text-xs uppercase tracking-[0.9em] text-white/50">
              Create your creator account
            </p>
          </div>

          {/* Form */}
          <form
            onSubmit={(e) => {
              console.log('Form onSubmit triggered!')
              handleSignUp(e)
            }}
            className="space-y-6"
          >
            {error && (
              <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-sm text-red-400">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <label className="block text-xs uppercase tracking-[0.4em] text-white/70 mb-3">
                Full Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-white/30 focus:outline-none focus:border-white/30 focus:bg-white/10 transition-all"
                placeholder="John Doe"
                required
              />
            </div>

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
                minLength={6}
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-white text-black hover:bg-white/90 font-semibold uppercase tracking-[0.4em] py-6 rounded-lg transition-all"
              disabled={loading}
            >
              {loading ? 'Creating account...' : 'Sign Up'}
            </Button>
          </form>

          {/* Sign In Link */}
          <div className="text-center">
            <p className="text-xs uppercase tracking-[0.4em] text-white/50">
              Already have an account?{' '}
              <Link href="/login" className="text-white hover:text-white/70 transition-colors underline">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
