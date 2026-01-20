import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

/**
 * Debug endpoint to inspect the actual cookie value
 * This helps diagnose if the cookie format is correct
 */
export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const allCookies = cookieStore.getAll()
    const supabaseCookie = allCookies.find(c => c.name.startsWith('sb-'))
    
    if (!supabaseCookie) {
      return NextResponse.json({
        error: 'No Supabase cookie found',
        allCookies: allCookies.map(c => ({ name: c.name, hasValue: !!c.value, valueLength: c.value?.length || 0 })),
      })
    }
    
    // Try to parse the cookie value (it's usually JSON)
    let parsedValue = null
    try {
      parsedValue = JSON.parse(supabaseCookie.value)
    } catch (e) {
      // Not JSON, that's okay
    }
    
    return NextResponse.json({
      cookie: {
        name: supabaseCookie.name,
        valueLength: supabaseCookie.value?.length || 0,
        valuePreview: supabaseCookie.value?.substring(0, 100) || '',
        isJSON: parsedValue !== null,
        parsedPreview: parsedValue ? Object.keys(parsedValue) : null,
      },
      allCookies: allCookies.map(c => ({
        name: c.name,
        hasValue: !!c.value,
        valueLength: c.value?.length || 0,
      })),
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


