import { createBrowserClient } from '@supabase/ssr'
import { Database } from './types'

/**
 * Client-side Supabase client
 * Uses @supabase/ssr which automatically handles PKCE code verifier in cookies
 * Important: Cookies must be accessible for PKCE to work across redirects
 */
import { safeLocalStorage } from '@/lib/utils/safe-storage'

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !key) {
    console.error('Missing Supabase environment variables')
    return createBrowserClient<Database>(
      'https://placeholder.supabase.co',
      'placeholder-key'
    )
  }

  try {
    return createBrowserClient<Database>(url, key, {
      cookieOptions: {
        name: 'sb-auth-token',
        // Attempt to verify if we can write to document.cookie
        // If this throws, the try-catch block will handle it
      }
    })
  } catch (error) {
    console.warn('Failed to initialize Supabase with cookies, falling back to memory storage', error)

    // Fallback: Initialize without cookie dependency if possible, or use custom storage
    // Note: Auth state might not persist across reloads in this mode
    return createBrowserClient<Database>(url, key, {
      auth: {
        storage: safeLocalStorage,
        persistSession: true,
        autoRefreshToken: true,
      },
      cookies: {
        getAll() { return [] },
        setAll() { }
      }
    })
  }
}

