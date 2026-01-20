import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { Database } from '@/lib/supabase/types'

/**
 * Debug endpoint to check videos with service role (bypasses RLS)
 * Only works in development mode
 */
export async function GET() {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'Only available in development' }, { status: 403 })
  }

  try {
    const supabase = await createClient()
    const serviceClient = createServiceClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    
    // Get videos with regular client (respects RLS)
    const { data: regularVideos, error: regularError } = await supabase
      .from('air_publisher_videos')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20)
    
    // Get videos with service role (bypasses RLS)
    const { data: serviceVideos, error: serviceError } = await serviceClient
      .from('air_publisher_videos')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20)
    
    return NextResponse.json({
      regularClient: {
        videos: regularVideos || [],
        count: regularVideos?.length || 0,
        error: regularError?.message || null,
        errorCode: regularError?.code || null,
      },
      serviceClient: {
        videos: serviceVideos || [],
        count: serviceVideos?.length || 0,
        error: serviceError?.message || null,
        errorCode: serviceError?.code || null,
      },
      note: 'Service client bypasses RLS - if it finds videos but regular client doesn\'t, RLS is blocking queries',
    })
  } catch (error: any) {
    return NextResponse.json({
      error: error.message || String(error),
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    }, { status: 500 })
  }
}


