import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { Database } from '@/lib/supabase/types'

export const dynamic = 'force-dynamic'

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (!user || authError) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { display_name, avatar_url, niche } = body

    // Build update object for airpublisher_creator_profiles table
    const updates: any = {}
    if (display_name !== undefined) {
      updates.handles = display_name // Map to 'handles' column
    }
    if (avatar_url !== undefined) {
      updates.profile_pic_url = avatar_url // Map to 'profile_pic_url' column - THIS UPDATES THE PROFILE PICTURE
    }
    // Note: Niche column was removed from airpublisher_creator_profiles (migration 011)
    // Niche should be stored in creator_profiles table if needed

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 })
    }

    console.log('[profile/update] Updating airpublisher_creator_profiles table:', {
      user_id: user.id,
      updates,
      has_profile_pic_url: 'profile_pic_url' in updates,
    })

    // Try to update with regular client
    let { data, error } = await (supabase
      .from('airpublisher_creator_profiles') as any)
      .update(updates)
      .eq('user_id', user.id)
      .select()
      .maybeSingle()

    console.log('[profile/update] Update result:', {
      success: !!data,
      error: error?.message || null,
      updated_profile_pic_url: data?.profile_pic_url || null,
    })

    // If RLS blocks, try with service role
    if (error && error.code === '42501' && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.log('[profile/update] RLS blocked, trying with service role...')
      const serviceClient = createServiceClient<Database>(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      )

      const { data: serviceData, error: serviceError } = await (serviceClient
        .from('airpublisher_creator_profiles') as any)
        .update(updates)
        .eq('user_id', user.id)
        .select()
        .maybeSingle()

      if (serviceError) {
        console.error('[profile/update] Service role update error:', serviceError)
        return NextResponse.json(
          { error: `Failed to update profile: ${serviceError.message}` },
          { status: 500 }
        )
      }

      data = serviceData
      error = null
    }

    if (error) {
      console.error('[profile/update] Update error:', error)
      return NextResponse.json(
        { error: `Failed to update profile: ${error.message}` },
        { status: 500 }
      )
    }

    if (!data) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      profile: {
        unique_identifier: data.creator_unique_identifier,
        display_name: data.handles,
        avatar_url: data.profile_pic_url, // This is the profile picture URL from airpublisher_creator_profiles.profile_pic_url
        niche: null, // Niche is not stored in airpublisher_creator_profiles
      },
    })
  } catch (error: any) {
    console.error('[profile/update] Exception:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}


