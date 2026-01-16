import { createClient } from '@/lib/supabase/server'

const BUCKET_NAME = 'air-publisher-videos'

export async function uploadVideo(file: File, path: string) {
  const supabase = await createClient()
  
  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(path, file, {
      cacheControl: '3600',
      upsert: false,
    })

  if (error) throw error

  // Get public URL
  const {
    data: { publicUrl },
  } = supabase.storage.from(BUCKET_NAME).getPublicUrl(path)

  return { path: data.path, url: publicUrl }
}

export async function deleteVideo(path: string) {
  const supabase = await createClient()
  const { error } = await supabase.storage
    .from(BUCKET_NAME)
    .remove([path])

  if (error) throw error
}

export function getVideoUrl(path: string) {
  // This would be used to generate signed URLs for private videos
  // For now, returning public URL structure
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${BUCKET_NAME}/${path}`
}

