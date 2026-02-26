import { serve } from "https://deno.land/std@0.177.0/http/server.ts"
import { S3Client, PutObjectCommand } from "npm:@aws-sdk/client-s3"
import { getSignedUrl } from "npm:@aws-sdk/s3-request-presigner"
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
        // 1. Parse request body
        const { title, description, contentType = 'video/mp4', creatorUniqueIdentifier } = await req.json()

        if (!title) {
            return new Response(JSON.stringify({ error: 'Title is required' }), {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            })
        }

        if (!creatorUniqueIdentifier) {
            return new Response(JSON.stringify({ error: 'creatorUniqueIdentifier is required' }), {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            })
        }

        // 2. Validate creator exists in DB (replaces JWT auth)
        const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
        const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        const supabaseClient = createClient(supabaseUrl, supabaseServiceKey)

        const { data: profile, error: profileError } = await supabaseClient
            .from('creator_profiles')
            .select('unique_identifier')
            .eq('unique_identifier', creatorUniqueIdentifier)
            .single()

        if (profileError || !profile) {
            return new Response(JSON.stringify({ error: 'Invalid creator identifier' }), {
                status: 401,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            })
        }

        // 3. Configure R2 Client
        const accountId = Deno.env.get('R2_ACCOUNT_ID')
        const accessKeyId = Deno.env.get('R2_ACCESS_KEY_ID')
        const secretAccessKey = Deno.env.get('R2_SECRET_ACCESS_KEY')
        const bucketName = Deno.env.get('R2_BUCKET_NAME')
        const publicUrl = Deno.env.get('R2_PUBLIC_URL')

        if (!accountId || !accessKeyId || !secretAccessKey || !bucketName || !publicUrl) {
            throw new Error('R2 configuration is missing')
        }

        const s3Client = new S3Client({
            region: 'auto',
            endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
            credentials: {
                accessKeyId,
                secretAccessKey,
            },
        })

        // 4. Generate unique filename and Presigned URL
        const timestamp = Date.now()
        const randomString = crypto.randomUUID().split('-')[0]
        const ext = contentType === 'video/quicktime' ? 'mov' : 'mp4'
        const fileName = `${creatorUniqueIdentifier}/uploads/${timestamp}-${randomString}.${ext}`

        const command = new PutObjectCommand({
            Bucket: bucketName,
            Key: fileName,
            ContentType: contentType,
        })

        // URL expires in 1 hour (3600 seconds)
        const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 })
        const finalVideoUrl = `${publicUrl}/${fileName}`

        // 5. Return the presigned URL and public URL
        return new Response(
            JSON.stringify({
                uploadUrl: signedUrl,
                videoUrl: finalVideoUrl,
                fileName
            }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200,
            }
        )
    } catch (error) {
        console.error('Error generating upload URL:', error)
        return new Response(JSON.stringify({ error: error.message || 'Internal Server Error' }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
    }
})
