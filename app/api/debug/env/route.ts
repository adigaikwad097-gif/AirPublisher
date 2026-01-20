import { NextResponse } from 'next/server'

/**
 * Debug endpoint to check environment variables
 * Only works in development mode
 */
export async function GET() {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'Only available in development' }, { status: 403 })
  }

  return NextResponse.json({
    environment: process.env.NODE_ENV,
    hasMETA_APP_ID: !!process.env.META_APP_ID,
    hasINSTAGRAM_APP_ID: !!process.env.INSTAGRAM_APP_ID,
    hasYOUTUBE_CLIENT_ID: !!process.env.YOUTUBE_CLIENT_ID,
    hasYOUTUBE_CLIENT_SECRET: !!process.env.YOUTUBE_CLIENT_SECRET,
    hasNEXT_PUBLIC_APP_URL: !!process.env.NEXT_PUBLIC_APP_URL,
    hasSUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    // Show first 3 chars of IDs (for verification without exposing full values)
    META_APP_ID_preview: process.env.META_APP_ID ? `${process.env.META_APP_ID.substring(0, 3)}...` : 'NOT SET',
    INSTAGRAM_APP_ID_preview: process.env.INSTAGRAM_APP_ID ? `${process.env.INSTAGRAM_APP_ID.substring(0, 3)}...` : 'NOT SET',
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'NOT SET',
  })
}


