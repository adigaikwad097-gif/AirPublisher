import { NextResponse } from 'next/server'
import { getNangoClient } from '@/lib/nango/client'
import { syncNangoConnectionToSupabase } from '@/lib/nango/tokens'
import { createClient } from '@/lib/supabase/server'
import { getCurrentCreator } from '@/lib/db/creator'

/**
 * Webhook endpoint for Nango to sync connection updates
 * Called when a connection is created, updated, or deleted
 * 
 * Expected payload from Nango:
 * {
 *   "type": "connection.created" | "connection.updated" | "connection.deleted",
 *   "connectionId": "user_id_platform",
 *   "provider": "google" | "facebook" | "tiktok",
 *   "connectionConfig": {...}
 * }
 */
export async function POST(request: Request) {
  try {
    // Verify webhook signature (Nango provides this)
    const nangoSignature = request.headers.get('x-nango-signature')
    // TODO: Verify signature using Nango webhook secret

    const body = await request.json()
    const { type, connectionId, provider } = body

    if (!type || !connectionId || !provider) {
      return NextResponse.json(
        { error: 'Missing required fields: type, connectionId, provider' },
        { status: 400 }
      )
    }

    // Parse connection ID to get user_id and platform
    // Format: {user_id}_{platform}
    const [userId, platform] = connectionId.split('_', 2)
    
    if (!userId || !platform) {
      return NextResponse.json(
        { error: 'Invalid connectionId format' },
        { status: 400 }
      )
    }

    // Map provider to platform
    const platformMap: Record<string, 'youtube' | 'instagram' | 'tiktok'> = {
      google: 'youtube',
      facebook: 'instagram',
      tiktok: 'tiktok',
    }

    const platformType = platformMap[provider]
    if (!platformType) {
      return NextResponse.json(
        { error: `Unknown provider: ${provider}` },
        { status: 400 }
      )
    }

    if (type === 'connection.deleted') {
      // Handle deletion - remove tokens from Supabase
      const supabase = await createClient()
      const tableName = `${platformType}_tokens`
      
      await supabase
        .from(tableName)
        .delete()
        .eq('user_id', userId)

      return NextResponse.json({ success: true, message: 'Connection deleted' })
    }

    // For created/updated, sync tokens
    const nango = getNangoClient()
    const connection = await nango.getConnection(provider, connectionId)

    if (!connection) {
      return NextResponse.json(
        { error: 'Connection not found in Nango' },
        { status: 404 }
      )
    }

    // Get creator unique identifier
    const supabase = await createClient()
    const creator = await getCurrentCreator()
    
    if (!creator) {
      console.warn(`No creator found for user ${userId}, skipping token sync`)
      return NextResponse.json({ success: true, message: 'No creator profile, skipping sync' })
    }

    // Sync to Supabase
    await syncNangoConnectionToSupabase(
      userId,
      creator.unique_identifier,
      platformType,
      connection as any
    )

    return NextResponse.json({
      success: true,
      message: `Connection ${type} and synced to Supabase`,
    })
  } catch (error: any) {
    console.error('Nango webhook error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to sync connection' },
      { status: 500 }
    )
  }
}


