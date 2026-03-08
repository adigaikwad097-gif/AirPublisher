import { serve } from "https://deno.land/std@0.177.0/http/server.ts"
import { S3Client, DeleteObjectCommand } from "npm:@aws-sdk/client-s3"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    // Handle CORS
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const { videoId, creatorUniqueIdentifier } = await req.json()

        if (!videoId || !creatorUniqueIdentifier) {
            return new Response(JSON.stringify({ error: 'videoId and creatorUniqueIdentifier are required' }), {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            })
        }

        // 1. Initialize Supabase
        const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
        const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        const supabaseClient = createClient(supabaseUrl, supabaseServiceKey)

        // 2. Validate creator and fetch video details
        const { data: video, error: videoError } = await supabaseClient
            .from('air_publisher_videos')
            .select('video_url, thumbnail_url, creator_unique_identifier')
            .eq('id', videoId)
            .single()

        if (videoError || !video) {
            return new Response(JSON.stringify({ error: 'Video not found' }), {
                status: 404,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            })
        }

        if (video.creator_unique_identifier !== creatorUniqueIdentifier) {
            return new Response(JSON.stringify({ error: 'Unauthorized' }), {
                status: 403,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            })
        }

        // 3. Configure R2 Client
        const accountId = Deno.env.get('R2_ACCOUNT_ID')
        const accessKeyId = Deno.env.get('R2_ACCESS_KEY_ID')
        const secretAccessKey = Deno.env.get('R2_SECRET_ACCESS_KEY')
        const bucketName = Deno.env.get('R2_BUCKET_NAME')
        const publicUrl = Deno.env.get('R2_PUBLIC_URL')

        if (accountId && accessKeyId && secretAccessKey && bucketName && publicUrl) {
            const s3Client = new S3Client({
                region: "auto",
                endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
                credentials: {
                    accessKeyId,
                    secretAccessKey,
                },
                forcePathStyle: true,
            })

            const cleanPublicUrl = publicUrl.replace(/\/$/, '')

            // Delete video file if exists in R2
            if (video.video_url && video.video_url.startsWith(cleanPublicUrl)) {
                const videoKey = video.video_url.replace(`${cleanPublicUrl}/`, '')
                try {
                    await s3Client.send(new DeleteObjectCommand({
                        Bucket: bucketName,
                        Key: videoKey,
                    }))
                    console.log(`Successfully deleted video file from R2: ${videoKey}`)
                } catch (e) {
                    console.error(`Failed to delete video file from R2: ${videoKey}`, e)
                }
            }

            // Delete thumbnail file if exists in R2
            if (video.thumbnail_url && video.thumbnail_url.startsWith(cleanPublicUrl)) {
                const thumbKey = video.thumbnail_url.replace(`${cleanPublicUrl}/`, '')
                try {
                    await s3Client.send(new DeleteObjectCommand({
                        Bucket: bucketName,
                        Key: thumbKey,
                    }))
                    console.log(`Successfully deleted thumbnail file from R2: ${thumbKey}`)
                } catch (e) {
                    console.error(`Failed to delete thumbnail file from R2: ${thumbKey}`, e)
                }
            }
        } else {
            console.warn("R2 credentials not fully configured, skipping physical file deletion.")
        }

        // 4. Delete video record from DB
        const { error: dbDeleteError } = await supabaseClient
            .from('air_publisher_videos')
            .delete()
            .eq('id', videoId)

        if (dbDeleteError) {
            throw new Error(`DB Delete Error: ${dbDeleteError.message}`)
        }

        return new Response(JSON.stringify({ success: true, message: 'Video deleted successfully' }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })

    } catch (error: any) {
        console.error('Error during video deletion:', error.message)
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
    }
})
