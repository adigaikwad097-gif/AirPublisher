import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

/**
 * Clear the creator profile cookie
 * Called when user signs out to prevent next user from seeing previous user's profile
 */
export async function POST() {
  try {
    const cookieStore = await cookies()
    cookieStore.delete('creator_profile_id')
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error clearing profile cookie:', error)
    return NextResponse.json({ success: false }, { status: 500 })
  }
}


