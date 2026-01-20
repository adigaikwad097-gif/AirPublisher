import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  
  // Get all cookies from request
  const requestCookies = request.cookies.getAll()
  
  // Try to get user
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  const { data: { session }, error: sessionError } = await supabase.auth.getSession()
  
  return NextResponse.json({
    cookies: {
      all: requestCookies.map(c => ({ name: c.name, valueLength: c.value.length })),
      supabase: requestCookies
        .filter(c => c.name.startsWith('sb-') || c.name.includes('supabase') || c.name.includes('auth'))
        .map(c => ({ name: c.name, valueLength: c.value.length })),
    },
    auth: {
      hasUser: !!user,
      userId: user?.id || null,
      userEmail: user?.email || null,
      hasSession: !!session,
      userError: userError?.message || null,
      sessionError: sessionError?.message || null,
    },
  })
}


