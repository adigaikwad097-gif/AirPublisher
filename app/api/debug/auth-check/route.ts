import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { Database } from '@/lib/supabase/types'
import { cookies } from 'next/headers'

/**
 * Debug endpoint to check if we can query Supabase Auth users
 * This helps diagnose if the issue is with auth validation
 */
export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const allCookies = cookieStore.getAll()
    
    // Try regular client (requires cookies)
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    // Try service role client (bypasses auth, can query any user)
    let serviceClient = null
    let serviceTest = null
    if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
      serviceClient = createServiceClient<Database>(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      )
      
      // Try to list some users (this requires admin access)
      try {
        const { data: users, error: listError } = await serviceClient.auth.admin.listUsers({
          page: 1,
          perPage: 5,
        })
        serviceTest = {
          canQueryAuth: !listError,
          userCount: users?.users?.length || 0,
          error: listError?.message || null,
        }
      } catch (e: any) {
        serviceTest = {
          canQueryAuth: false,
          error: e?.message || String(e),
        }
      }
    }
    
    return NextResponse.json({
      timestamp: new Date().toISOString(),
      cookies: {
        total: allCookies.length,
        names: allCookies.map(c => c.name),
        hasSupabaseCookies: allCookies.some(c => c.name.startsWith('sb-')),
      },
      regularClient: {
        canGetUser: !userError && !!user,
        canGetSession: !sessionError && !!session,
        userId: user?.id || null,
        userEmail: user?.email || null,
        hasSession: !!session,
        errors: {
          getUser: userError?.message || null,
          getSession: sessionError?.message || null,
        },
      },
      serviceClient: serviceTest || {
        available: false,
        error: 'SUPABASE_SERVICE_ROLE_KEY not configured',
      },
      environment: {
        hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        hasAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        hasServiceRoleKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
        nodeEnv: process.env.NODE_ENV,
      },
    })
  } catch (error: any) {
    return NextResponse.json(
      {
        error: error.message || 'Internal server error',
        stack: error.stack,
      },
      { status: 500 }
    )
  }
}


