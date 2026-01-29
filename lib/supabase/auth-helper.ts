import { cookies } from 'next/headers'

/**
 * Helper to manually parse Supabase auth cookie
 * This is a workaround for @supabase/ssr v0.1.0 not parsing cookies correctly
 */
export async function getUserIdFromCookie(): Promise<string | null> {
  try {
    const cookieStore = await cookies()
    const authCookie = cookieStore.get('sb-pezvnqhexxttlhcnbtta-auth-token')
    
    if (!authCookie?.value) {
      return null
    }

    // Parse the cookie JSON
    const cookieData = JSON.parse(authCookie.value)
    
    // Extract user ID from the cookie
    if (cookieData?.user?.id) {
      return cookieData.user.id
    }

    return null
  } catch (e) {
    console.error('[getUserIdFromCookie] Error parsing cookie:', e)
    return null
  }
}

/**
 * Get user email from cookie
 */
export async function getUserEmailFromCookie(): Promise<string | null> {
  try {
    const cookieStore = await cookies()
    const authCookie = cookieStore.get('sb-pezvnqhexxttlhcnbtta-auth-token')
    
    if (!authCookie?.value) {
      return null
    }

    const cookieData = JSON.parse(authCookie.value)
    
    if (cookieData?.user?.email) {
      return cookieData.user.email
    }

    return null
  } catch (e) {
    return null
  }
}



