import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req: Request) => {
    // Handle CORS
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const { creatorUniqueIdentifier } = await req.json()

        if (!creatorUniqueIdentifier) {
            return new Response(
                JSON.stringify({ error: 'creatorUniqueIdentifier is required' }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        // Use service role to bypass RLS
        const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
        const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        const supabase = createClient(supabaseUrl, supabaseServiceKey)

        // 1. Look up the creator profile to get user_id and related identifiers
        const { data: profile, error: profileError } = await supabase
            .from('creator_profiles')
            .select('unique_identifier, user_id')
            .eq('unique_identifier', creatorUniqueIdentifier)
            .maybeSingle()

        if (profileError || !profile) {
            return new Response(
                JSON.stringify({ error: 'Creator profile not found' }),
                { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        const userId = profile.user_id
        const uniqueId = profile.unique_identifier

        // 2. Find all connection identifiers for this creator
        const { data: connections } = await supabase
            .from('airpublisher_connections')
            .select('connection_identifier, user_id')
            .eq('primary_identifier', uniqueId)

        const connectionIds = (connections || [])
            .map(c => c.connection_identifier)
            .filter(Boolean)

        // Collect all user_ids associated with this creator (may span auth sessions)
        const allUserIds = Array.from(new Set(
            [userId, ...(connections || []).map(c => c.user_id)].filter(Boolean)
        ))

        // All creator identifiers for token lookups
        const allCreatorIds = [uniqueId, ...connectionIds]

        console.log(`[delete-account] Deleting creator: ${uniqueId}`)
        console.log(`[delete-account] User IDs: ${allUserIds.join(', ')}`)
        console.log(`[delete-account] Creator IDs: ${allCreatorIds.join(', ')}`)

        // 3. Delete from all related tables (order matters for FK constraints)
        const deletions = await Promise.allSettled([
            // Scheduled posts (has FK to air_publisher_videos)
            supabase
                .from('air_publisher_scheduled_posts')
                .delete()
                .in('creator_unique_identifier', allCreatorIds),

            // Connections
            supabase
                .from('airpublisher_connections')
                .delete()
                .in('primary_identifier', allCreatorIds),

            // Leaderboard entries
            supabase
                .from('air_leaderboards')
                .delete()
                .in('creator_unique_identifier', allCreatorIds),

            // Creator posts
            supabase
                .from('creator_posts')
                .delete()
                .in('unique_identifier', allCreatorIds),

            // Progress updates
            supabase
                .from('progress_updates')
                .delete()
                .in('unique_identifier', allCreatorIds),

            // Assets
            supabase
                .from('assets')
                .delete()
                .in('unique_identifier', allCreatorIds),
        ])

        // Log any deletion errors (non-blocking)
        deletions.forEach((result, i) => {
            if (result.status === 'rejected') {
                console.error(`[delete-account] Deletion batch ${i} failed:`, result.reason)
            }
        })

        // 4. Delete videos (after scheduled posts due to FK)
        await supabase
            .from('air_publisher_videos')
            .delete()
            .in('creator_unique_identifier', allCreatorIds)

        // 5. Delete token rows (by creator_unique_identifier and user_id)
        await Promise.allSettled([
            supabase
                .from('youtube_tokens')
                .delete()
                .in('creator_unique_identifier', allCreatorIds),
            supabase
                .from('instagram_tokens')
                .delete()
                .in('creator_unique_identifier', allCreatorIds),
            supabase
                .from('facebook_tokens')
                .delete()
                .in('user_id', allUserIds),
            supabase
                .from('tiktok_tokens')
                .delete()
                .in('creator_unique_identifier', allCreatorIds),
        ])

        // Also delete tokens by user_id (in case creator_unique_identifier didn't match)
        if (allUserIds.length > 0) {
            await Promise.allSettled([
                supabase
                    .from('youtube_tokens')
                    .delete()
                    .in('user_id', allUserIds),
                supabase
                    .from('instagram_tokens')
                    .delete()
                    .in('user_id', allUserIds),
                supabase
                    .from('tiktok_tokens')
                    .delete()
                    .in('user_id', allUserIds),
            ])
        }

        // 6. Delete the creator profile itself
        const { error: deleteProfileError } = await supabase
            .from('creator_profiles')
            .delete()
            .eq('unique_identifier', uniqueId)

        if (deleteProfileError) {
            console.error('[delete-account] Failed to delete creator_profiles:', deleteProfileError)
            return new Response(
                JSON.stringify({ error: 'Failed to delete creator profile' }),
                { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        console.log(`[delete-account] Successfully deleted creator: ${uniqueId}`)

        return new Response(
            JSON.stringify({ success: true, message: 'Account deleted successfully' }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    } catch (error) {
        console.error('[delete-account] Error:', error)
        return new Response(
            JSON.stringify({ error: error.message || 'Internal Server Error' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }
})
