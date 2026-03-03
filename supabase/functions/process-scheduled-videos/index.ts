import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        const supabaseUrl = Deno.env.get("SUPABASE_URL");
        const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

        if (!supabaseUrl || !supabaseServiceRoleKey) {
            throw new Error("Missing SUPABASE env vars");
        }

        // Use Service Role key to bypass RLS for background processing
        const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

        console.log("Starting scheduled videos sweep at", new Date().toISOString());

        // Step 0: Recover videos stuck in 'processing' for >15 minutes (edge case: function crashed mid-run)
        const fifteenMinAgo = new Date(Date.now() - 15 * 60 * 1000).toISOString();
        const { data: stuckVideos, error: stuckError } = await supabase
            .from("air_publisher_videos")
            .update({ status: "scheduled" })
            .eq("status", "processing")
            .lt("updated_at", fifteenMinAgo)
            .select();

        if (stuckError) {
            console.error("Error recovering stuck videos:", stuckError);
        } else if (stuckVideos && stuckVideos.length > 0) {
            console.log(`Recovered ${stuckVideos.length} stuck video(s) back to 'scheduled'`);
        }

        // Step 1: Atomically grab and lock all ripe videos by updating their status to 'processing'
        // This atomic bulk update prevents any race conditions if multiple workers run concurrently.
        const { data: ripeVideos, error: updateError } = await supabase
            .from("air_publisher_videos")
            .update({ status: "processing", error_message: null, updated_at: new Date().toISOString() })
            .eq("status", "scheduled")
            .lte("scheduled_at", new Date().toISOString())
            .select();

        if (updateError) {
            console.error("Error fetching/locking scheduled videos:", updateError);
            throw updateError;
        }

        if (!ripeVideos || ripeVideos.length === 0) {
            console.log("No scheduled videos ready to be published.");
            return new Response(JSON.stringify({ message: "No ripe videos found.", count: 0 }), {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
                status: 200,
            });
        }

        console.log(`Found ${ripeVideos.length} video(s) to process. Initiating publishing...`);

        const results = [];

        // Step 2: For each video, invoke the existing 'instant-posting' edge function
        for (const video of ripeVideos) {
            console.log(`Processing video ID: ${video.id} for platform: ${video.platform_target}`);

            // Validate platform before attempting to post
            const validPlatforms = ['youtube', 'instagram', 'facebook'];
            if (!video.platform_target || !validPlatforms.includes(video.platform_target)) {
                console.error(`Skipping video ${video.id}: invalid platform '${video.platform_target}'`);
                const revertStatus = video.platform_target === 'internal' ? 'draft' : 'failed';
                await supabase
                    .from("air_publisher_videos")
                    .update({
                        status: revertStatus,
                        scheduled_at: null,
                        platform_target: null,
                        error_message: revertStatus === 'failed' ? `Invalid platform: ${video.platform_target || 'null'}` : null,
                    })
                    .eq("id", video.id);
                results.push({
                    id: video.id,
                    status: "skipped",
                    error: `Invalid platform: ${video.platform_target || 'null'}`,
                });
                continue;
            }

            try {
                // We use the same service role key to authenticate the cross-function call
                const response = await fetch(`${supabaseUrl}/functions/v1/instant-posting`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${supabaseServiceRoleKey}`,
                    },
                    body: JSON.stringify({
                        video_id: video.id,
                        creator_unique_identifier: video.creator_unique_identifier,
                        platform: video.platform_target,
                    }),
                });

                const responseData = await response.text();

                if (!response.ok) {
                    throw new Error(`instant-posting failed with status ${response.status}: ${responseData}`);
                }

                console.log(`Successfully published video ID: ${video.id}`);
                results.push({ id: video.id, status: "success" });
                // Note: instant-posting function already updates the status to 'published' internally.

            } catch (err) {
                console.error(`Failed to publish video ID: ${video.id}`, err);

                // Step 3: Handle failures by setting status to 'failed' with error message
                const errorMessage = err instanceof Error ? err.message : "Unknown error";
                const { error: markFailedError } = await supabase
                    .from("air_publisher_videos")
                    .update({ status: "failed", error_message: errorMessage })
                    .eq("id", video.id);

                if (markFailedError) {
                    console.error(`Could not mark video ${video.id} as failed:`, markFailedError);
                }

                results.push({
                    id: video.id,
                    status: "failed",
                    error: err instanceof Error ? err.message : "Unknown error",
                });
            }
        }

        return new Response(
            JSON.stringify({
                message: "Sweep completed",
                processed: ripeVideos.length,
                results,
            }),
            {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
                status: 200,
            }
        );
    } catch (error) {
        console.error("Sweep task failed entirely:", error);
        return new Response(
            JSON.stringify({
                error: error instanceof Error ? error.message : "Unknown error",
            }),
            {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
                status: 500,
            }
        );
    }
});
