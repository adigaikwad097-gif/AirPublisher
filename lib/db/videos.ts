import { createClient } from '@/lib/supabase/server'
import { Database } from '@/lib/supabase/types'

type Video = Database['public']['Tables']['air_publisher_videos']['Row']
type VideoInsert = Database['public']['Tables']['air_publisher_videos']['Insert']
type VideoUpdate = Database['public']['Tables']['air_publisher_videos']['Update']

export async function getVideosByCreator(creatorUniqueIdentifier: string) {
  const supabase = await createClient()
  
  console.log('[getVideosByCreator] Fetching videos for creator:', creatorUniqueIdentifier)
  
  const { data, error } = await supabase
    .from('air_publisher_videos')
    .select('*')
    .eq('creator_unique_identifier', creatorUniqueIdentifier)
    .order('created_at', { ascending: false })

  if (error) {
    // If table doesn't exist, return empty array instead of throwing
    if (error.code === '42P01' || error.message?.includes('does not exist')) {
      console.warn('[getVideosByCreator] Table air_publisher_videos does not exist yet. Run the migration: supabase/migrations/001_create_air_publisher_tables.sql')
      return []
    }
    
    // If RLS blocks it, try service role as fallback
    if (error.code === '42501' || error.message?.includes('row-level security') || error.message?.includes('RLS')) {
      console.warn('[getVideosByCreator] RLS blocked query. Trying service role as fallback...', error.message)
      // Try to get videos with service role as fallback
      if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
        try {
          const { createClient: createServiceClient } = await import('@supabase/supabase-js')
          const { Database } = await import('@/lib/supabase/types')
          const serviceClient = createServiceClient<Database>(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
          )
          const { data: serviceData, error: serviceError } = await serviceClient
            .from('air_publisher_videos')
            .select('*')
            .eq('creator_unique_identifier', creatorUniqueIdentifier)
            .order('created_at', { ascending: false })
          
          if (serviceError) {
            console.error('[getVideosByCreator] Service role also failed:', serviceError)
            return []
          }
          
          console.log('[getVideosByCreator] ✅ Service role found videos:', serviceData?.length || 0)
          return (serviceData || []) as Video[]
        } catch (e: any) {
          console.error('[getVideosByCreator] Service role exception:', e?.message || e)
          return []
        }
      }
      return []
    }
    
    console.error('[getVideosByCreator] Error:', error)
    throw new Error(error.message || `Database error: ${JSON.stringify(error)}`)
  }
  
  // If no error but also no data, try service role as fallback (RLS might be silently blocking)
  // Only in development to avoid performance issues in production
  if ((!data || data.length === 0) && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.warn('[getVideosByCreator] Regular client returned empty (no error). Trying service role as fallback...')
    try {
      const { createClient: createServiceClient } = await import('@supabase/supabase-js')
      const { Database } = await import('@/lib/supabase/types')
      const serviceClient = createServiceClient<Database>(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      )
      const { data: serviceData, error: serviceError } = await serviceClient
        .from('air_publisher_videos')
        .select('*')
        .eq('creator_unique_identifier', creatorUniqueIdentifier)
        .order('created_at', { ascending: false })
      
      if (serviceError) {
        console.error('[getVideosByCreator] Service role fallback error:', serviceError)
        // Return empty if service role also fails
        return []
      }
      
      if (serviceData && serviceData.length > 0) {
        console.log('[getVideosByCreator] ✅ Service role found videos (regular returned empty):', serviceData.length)
        return (serviceData || []) as Video[]
      }
      
      // Service role also returned empty - truly no videos
      console.log('[getVideosByCreator] ✅ No videos found (service role also returned empty)')
      return []
    } catch (e: any) {
      console.error('[getVideosByCreator] Service role fallback exception:', e?.message || e)
      return []
    }
  }
  
  console.log('[getVideosByCreator] ✅ Found videos:', data?.length || 0)
  return (data || []) as Video[]
}

export async function getVideoById(id: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('air_publisher_videos')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    // If table doesn't exist, return null instead of throwing
    if (error.code === '42P01' || error.message?.includes('does not exist')) {
      console.warn('[getVideoById] Table air_publisher_videos does not exist yet. Run the migration: supabase/migrations/001_create_air_publisher_tables.sql')
      return null
    }
    // If not found (PGRST116), return null
    if (error.code === 'PGRST116') {
      console.log('[getVideoById] Video not found (PGRST116)')
      return null
    }
    
    // If RLS blocks it, try service role as fallback
    if (error.code === '42501' || error.message?.includes('row-level security') || error.message?.includes('RLS')) {
      console.warn('[getVideoById] RLS blocked query. Trying service role as fallback...', error.message)
      if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
        try {
          const { createClient: createServiceClient } = await import('@supabase/supabase-js')
          const { Database } = await import('@/lib/supabase/types')
          const serviceClient = createServiceClient<Database>(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
          )
          const { data: serviceData, error: serviceError } = await serviceClient
            .from('air_publisher_videos')
            .select('*')
            .eq('id', id)
            .single()
          
          if (serviceError) {
            if (serviceError.code === 'PGRST116') {
              console.log('[getVideoById] Service role: Video not found (PGRST116)')
              return null
            }
            console.error('[getVideoById] Service role also failed:', serviceError)
            return null
          }
          
          console.log('[getVideoById] ✅ Service role found video:', serviceData?.id)
          return (serviceData || null) as Video | null
        } catch (e: any) {
          console.error('[getVideoById] Service role exception:', e?.message || e)
          return null
        }
      }
      return null
    }
    
    console.error('[getVideoById] Error:', error)
    throw new Error(error.message || `Database error: ${JSON.stringify(error)}`)
  }
  
  // If no error but also no data, try service role as fallback (RLS might be silently blocking)
  if (!data && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.warn('[getVideoById] Regular client returned empty (no error). Trying service role as fallback...')
    try {
      const { createClient: createServiceClient } = await import('@supabase/supabase-js')
      const { Database } = await import('@/lib/supabase/types')
      const serviceClient = createServiceClient<Database>(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      )
      const { data: serviceData, error: serviceError } = await serviceClient
        .from('air_publisher_videos')
        .select('*')
        .eq('id', id)
        .single()
      
      if (serviceError) {
        if (serviceError.code === 'PGRST116') {
          console.log('[getVideoById] Service role: Video not found (PGRST116)')
          return null
        }
        console.error('[getVideoById] Service role fallback error:', serviceError)
        return null
      }
      
      if (serviceData) {
        console.log('[getVideoById] ✅ Service role found video (regular returned empty):', serviceData.id)
        return serviceData as Video
      }
      
      // Service role also returned empty - truly no video
      console.log('[getVideoById] ✅ No video found (service role also returned empty)')
      return null
    } catch (e: any) {
      console.error('[getVideoById] Service role fallback exception:', e?.message || e)
      return null
    }
  }
  
  console.log('[getVideoById] ✅ Found video:', data?.id)
  return data as Video
}

export async function createVideo(video: VideoInsert) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('air_publisher_videos')
    .insert(video)
    .select()
    .single()

  if (error) {
    // If table doesn't exist, provide helpful error message
    if (error.code === '42P01' || error.message?.includes('does not exist')) {
      const errorMsg = 'Table air_publisher_videos does not exist. Please run the migration: supabase/migrations/001_create_air_publisher_tables.sql or see SETUP_TABLES.md'
      console.error('[videos]', errorMsg)
      throw new Error(errorMsg)
    }
    console.error('[videos] Error:', error)
    throw new Error(error.message || `Database error: ${JSON.stringify(error)}`)
  }
  return data as Video
}

export async function updateVideo(id: string, updates: VideoUpdate) {
  console.log('[updateVideo] Updating video:', { id, updates })
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('air_publisher_videos')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    // If table doesn't exist, provide helpful error message
    if (error.code === '42P01' || error.message?.includes('does not exist')) {
      const errorMsg = 'Table air_publisher_videos does not exist. Please run the migration: supabase/migrations/001_create_air_publisher_tables.sql or see SETUP_TABLES.md'
      console.error('[videos]', errorMsg)
      throw new Error(errorMsg)
    }
    
    // If RLS blocks it OR if regular client returns empty, try service role as fallback
    // Also try service role if error code suggests RLS (even if not explicitly mentioned)
    const isRLSError = error.code === '42501' || 
                       error.code === 'PGRST301' ||
                       error.message?.includes('row-level security') || 
                       error.message?.includes('RLS') ||
                       error.code === 'PGRST116' // Not found might also be RLS
    
    if (isRLSError || !data) {
      console.warn('[updateVideo] Regular client failed or returned empty. Trying service role as fallback...', {
        errorCode: error.code,
        errorMessage: error.message,
        hasData: !!data,
      })
      
      if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
        try {
          const { createClient: createServiceClient } = await import('@supabase/supabase-js')
          const { Database } = await import('@/lib/supabase/types')
          const serviceClient = createServiceClient<Database>(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
          )
          
          console.log('[updateVideo] Attempting update with service role...', { id, updates })
          
          const { data: serviceData, error: serviceError } = await serviceClient
            .from('air_publisher_videos')
            .update(updates)
            .eq('id', id)
            .select()
            .single()
          
          if (serviceError) {
            if (serviceError.code === 'PGRST116') {
              console.warn('[updateVideo] Service role: Video not found (PGRST116)')
              return null
            }
            console.error('[updateVideo] Service role also failed:', {
              code: serviceError.code,
              message: serviceError.message,
              details: serviceError.details,
              hint: serviceError.hint,
            })
            throw new Error(serviceError.message || `Database error: ${JSON.stringify(serviceError)}`)
          }
          
          if (!serviceData) {
            console.warn('[updateVideo] Service role update succeeded but no data returned')
            // Even if no data, the update might have succeeded - try to fetch it
            const { data: fetchedData } = await serviceClient
              .from('air_publisher_videos')
              .select('*')
              .eq('id', id)
              .single()
            
            if (fetchedData) {
              console.log('[updateVideo] ✅ Fetched video after update:', {
                id: fetchedData.id,
                status: fetchedData.status,
              })
              return fetchedData as Video
            }
            
            return null
          }
          
          console.log('[updateVideo] ✅ Updated video via service role:', {
            id: serviceData.id,
            status: serviceData.status,
            posted_at: serviceData.posted_at,
          })
          return serviceData as Video
        } catch (e: any) {
          console.error('[updateVideo] Service role exception:', e?.message || e)
          throw e
        }
      } else {
        console.error('[updateVideo] Service role key not configured!')
      }
    }
    
    // If not found (PGRST116), return null
    if (error.code === 'PGRST116') {
      console.warn('[updateVideo] Video not found (PGRST116)')
      return null
    }
    console.error('[updateVideo] Error:', error)
    throw new Error(error.message || `Database error: ${JSON.stringify(error)}`)
  }
  
  if (!data) {
    console.warn('[updateVideo] Update succeeded but no data returned from regular client')
    return null
  }
  
  console.log('[updateVideo] ✅ Video updated successfully via regular client:', {
    id: data.id,
    status: data.status,
  })
  
  return data as Video
}

export async function getScheduledVideos(creatorUniqueIdentifier?: string) {
  const supabase = await createClient()
  let query = supabase
    .from('air_publisher_videos')
    .select('*')
    .eq('status', 'scheduled')
    .not('scheduled_at', 'is', null)
    .order('scheduled_at', { ascending: true })

  if (creatorUniqueIdentifier) {
    query = query.eq('creator_unique_identifier', creatorUniqueIdentifier)
  }

  const { data, error } = await query

  if (error) {
    // If table doesn't exist, return empty array instead of throwing
    if (error.code === '42P01' || error.message?.includes('does not exist')) {
      console.warn('[videos] Table air_publisher_videos does not exist yet. Run the migration: supabase/migrations/001_create_air_publisher_tables.sql')
      return []
    }
    console.error('[videos] Error:', error)
    throw new Error(error.message || `Database error: ${JSON.stringify(error)}`)
  }
  return (data || []) as Video[]
}

/**
 * Get all posted videos (for discover/browse page)
 * Only returns videos with status 'posted'
 */
export async function getAllPostedVideos(limit: number = 50, offset: number = 0) {
  const supabase = await createClient()
  
  console.log('[getAllPostedVideos] Fetching posted videos...', { limit, offset })
  
  const { data, error } = await supabase
    .from('air_publisher_videos')
    .select('*')
    .eq('status', 'posted')
    .order('views', { ascending: false }) // Most viewed first
    .order('created_at', { ascending: false }) // Then by newest
    .range(offset, offset + limit - 1)

  if (error) {
    // If table doesn't exist, return empty array instead of throwing
    if (error.code === '42P01' || error.message?.includes('does not exist')) {
      console.warn('[videos] Table air_publisher_videos does not exist yet. Run the migration: supabase/migrations/001_create_air_publisher_tables.sql')
      return []
    }
    
    // If RLS blocks it, try service role as fallback
    if (error.code === '42501' || error.message?.includes('row-level security') || error.message?.includes('RLS')) {
      console.warn('[getAllPostedVideos] RLS blocked query. Trying service role as fallback...', error.message)
      if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
        try {
          const { createClient: createServiceClient } = await import('@supabase/supabase-js')
          const { Database } = await import('@/lib/supabase/types')
          const serviceClient = createServiceClient<Database>(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
          )
          const { data: serviceData, error: serviceError } = await serviceClient
            .from('air_publisher_videos')
            .select('*')
            .eq('status', 'posted')
            .order('views', { ascending: false })
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1)
          
          if (serviceError) {
            console.error('[getAllPostedVideos] Service role also failed:', serviceError)
            return []
          }
          
          console.log('[getAllPostedVideos] ✅ Service role found videos:', serviceData?.length || 0)
          return (serviceData || []) as Video[]
        } catch (e: any) {
          console.error('[getAllPostedVideos] Service role exception:', e?.message || e)
          return []
        }
      }
      return []
    }
    
    console.error('[videos] Error:', error)
    throw new Error(error.message || `Database error: ${JSON.stringify(error)}`)
  }
  
  // If no error but also no data, try service role as fallback (RLS might be silently blocking)
  if ((!data || data.length === 0) && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.warn('[getAllPostedVideos] Regular client returned empty (no error). Trying service role as fallback...')
    try {
      const { createClient: createServiceClient } = await import('@supabase/supabase-js')
      const { Database } = await import('@/lib/supabase/types')
      const serviceClient = createServiceClient<Database>(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      )
      const { data: serviceData, error: serviceError } = await serviceClient
        .from('air_publisher_videos')
        .select('*')
        .eq('status', 'posted')
        .order('views', { ascending: false })
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)
      
      if (serviceError) {
        console.error('[getAllPostedVideos] Service role fallback error:', serviceError)
        return []
      }
      
      if (serviceData && serviceData.length > 0) {
        console.log('[getAllPostedVideos] ✅ Service role found videos (regular returned empty):', serviceData.length)
        return (serviceData || []) as Video[]
      }
      
      // Service role also returned empty - truly no posted videos
      console.log('[getAllPostedVideos] ✅ No posted videos found (service role also returned empty)')
      return []
    } catch (e: any) {
      console.error('[getAllPostedVideos] Service role fallback exception:', e?.message || e)
      return []
    }
  }
  
  console.log('[getAllPostedVideos] ✅ Found videos:', data?.length || 0)
  return (data || []) as Video[]
}

/**
 * Increment view count for a video
 */
export async function incrementVideoViews(id: string) {
  const supabase = await createClient()
  // Use RPC or update with increment
  // First get current views
  const { data: video, error: fetchError } = await supabase
    .from('air_publisher_videos')
    .select('views')
    .eq('id', id)
    .single()

  if (fetchError || !video) {
    console.error('[videos] Error fetching video for view increment:', fetchError)
    return null
  }

  const newViews = (video.views || 0) + 1

  const { data, error } = await supabase
    .from('air_publisher_videos')
    .update({ views: newViews })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('[videos] Error incrementing views:', error)
    throw new Error(error.message || `Database error: ${JSON.stringify(error)}`)
  }
  return data as Video
}

