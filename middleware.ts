import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  if (
    pathname.startsWith('/api/n8n/') ||
    pathname.startsWith('/api/webhooks/n8n/')
  ) {
    return NextResponse.next()
  }

  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  try {
    // Debug: Check what cookies are coming in
    const incomingCookies = request.cookies.getAll()
    const supabaseCookies = incomingCookies.filter(c => 
      c.name.startsWith('sb-') || 
      c.name.includes('supabase') ||
      c.name.includes('auth')
    )
    
    if (supabaseCookies.length > 0) {
      console.log('[Middleware] Found Supabase cookies:', supabaseCookies.map(c => `${c.name}=${c.value.substring(0, 20)}...`).join(', '))
    } else {
      console.log('[Middleware] ⚠️ No Supabase cookies in request. All cookies:', incomingCookies.map(c => c.name).join(', '))
    }
    
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              request.cookies.set(name, value)
              response.cookies.set(name, value, options)
              console.log('[Middleware] Setting cookie in response:', name, 'value length:', value?.length || 0)
            })
          },
        },
      }
    )

    // First, try to get the session from the cookie
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (session) {
      console.log('[Middleware] ✅ Session found for user:', session.user.id)
      // Refresh if needed (this updates cookies if tokens are close to expiring)
      try {
        await supabase.auth.refreshSession()
      } catch (e) {
        // Refresh failed, but we have a session so continue
        console.log('[Middleware] Could not refresh session (non-critical):', e)
      }
    } else {
      // No session from cookie - try to refresh from refresh token
      if (sessionError) {
        console.log('[Middleware] Session error:', sessionError.message)
      }
      
      // Try getUser as fallback (this will attempt to refresh if possible)
      const { data: { user }, error } = await supabase.auth.getUser()
      
      if (error) {
        console.log('[Middleware] getUser error (non-blocking):', error.message)
      } else if (user) {
        console.log('[Middleware] ✅ User found via getUser:', user.id)
      } else {
        console.log('[Middleware] No user in session (might be logged out)')
      }
    }

    // Don't redirect in middleware - let the pages handle their own auth checks
    // Middleware is just for refreshing the session

    return response
  } catch (error) {
    console.error('[Middleware] Error:', error)
    // On error, just pass through - don't block requests
    return response
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}

