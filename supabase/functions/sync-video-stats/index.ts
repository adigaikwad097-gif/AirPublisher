import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Use the same Graph API version as auth functions (was hardcoded v18.0 which is deprecated)
const GRAPH_API_VERSION = Deno.env.get("FACEBOOK_GRAPH_VERSION") || "v22.0";

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

    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

    console.log(`[sync-stats] Starting video stats sync at ${new Date().toISOString()} (Graph API ${GRAPH_API_VERSION})`);

    // Fetch all posted videos
    const { data: videos, error: videosError } = await supabase
      .from("air_publisher_videos")
      .select("id, creator_unique_identifier, platform_target, youtube_url, instagram_url, facebook_url")
      .eq("status", "posted");

    if (videosError) throw new Error(`Failed to fetch videos: ${videosError.message}`);
    if (!videos || videos.length === 0) {
      console.log("[sync-stats] No posted videos found, nothing to sync.");
      return new Response(JSON.stringify({ synced: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`[sync-stats] Found ${videos.length} posted video(s) to sync`);

    let synced = 0;
    let errors = 0;

    for (const video of videos) {
      try {
        let stats: { views: number; likes: number; comments: number } | null = null;

        if (video.platform_target === "youtube" && video.youtube_url) {
          stats = await fetchYouTubeStats(supabase, video.creator_unique_identifier, video.youtube_url);
        } else if (video.platform_target === "instagram" && video.instagram_url) {
          stats = await fetchInstagramStats(supabase, video.creator_unique_identifier, video.instagram_url);
        } else if (video.platform_target === "facebook" && video.facebook_url) {
          stats = await fetchFacebookStats(supabase, video.creator_unique_identifier, video.facebook_url);
        } else {
          continue;
        }

        if (stats) {
          const { error: updateError } = await supabase
            .from("air_publisher_videos")
            .update({
              views: stats.views,
              likes: stats.likes,
              comments: stats.comments,
              stats_updated_at: new Date().toISOString(),
            })
            .eq("id", video.id);

          if (updateError) {
            console.error(`[sync-stats] Failed to update video ${video.id}: ${updateError.message}`);
            errors++;
          } else {
            console.log(`[sync-stats] ✅ ${video.platform_target} video ${video.id}: views=${stats.views}, likes=${stats.likes}, comments=${stats.comments}`);
            synced++;
          }
        } else {
          console.warn(`[sync-stats] ⚠️ No stats returned for video ${video.id} (${video.platform_target})`);
        }
      } catch (err: any) {
        console.error(`[sync-stats] ❌ Error syncing video ${video.id} (${video.platform_target}): ${err.message}`);
        errors++;
      }
    }

    console.log(`[sync-stats] Done. Synced: ${synced}, Errors: ${errors}`);

    return new Response(
      JSON.stringify({ synced, errors, total: videos.length }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    console.error(`[sync-stats] FATAL: ${err.message}`);
    return new Response(
      JSON.stringify({ error: err.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});

// ============================================================
// YouTube
// ============================================================
async function fetchYouTubeStats(supabase: any, creatorId: string, youtubeUrl: string) {
  const videoId = extractYouTubeVideoId(youtubeUrl);
  if (!videoId) {
    console.warn(`[youtube-stats] Could not extract video ID from: ${youtubeUrl}`);
    return null;
  }

  const accessToken = await getYouTubeToken(supabase, creatorId);
  if (!accessToken) return null;

  const res = await fetch(
    `https://www.googleapis.com/youtube/v3/videos?part=statistics&id=${videoId}`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`YouTube API ${res.status}: ${errText}`);
  }

  const data = await res.json();
  const item = data.items?.[0];
  if (!item) {
    console.warn(`[youtube-stats] No item returned for videoId: ${videoId}`);
    return null;
  }

  return {
    views: parseInt(item.statistics.viewCount || "0", 10),
    likes: parseInt(item.statistics.likeCount || "0", 10),
    comments: parseInt(item.statistics.commentCount || "0", 10),
  };
}

function extractYouTubeVideoId(url: string): string | null {
  try {
    const u = new URL(url);
    return u.searchParams.get("v") || u.pathname.split("/").pop() || null;
  } catch {
    return null;
  }
}

async function getYouTubeToken(supabase: any, creatorId: string): Promise<string | null> {
  let { data: tokens, error } = await supabase
    .from("youtube_tokens")
    .select("*, google_access_token_secret_id")
    .eq("creator_unique_identifier", creatorId)
    .single();

  if (error || !tokens) {
    console.warn(`[youtube-stats] No YouTube tokens for ${creatorId}`);
    return null;
  }

  // Refresh if expired
  if (tokens.expires_at && new Date(tokens.expires_at) <= new Date()) {
    console.log(`[youtube-stats] Token expired for ${creatorId}, refreshing...`);
    const refreshRes = await fetch(
      `${Deno.env.get("SUPABASE_URL")}/functions/v1/refresh-token`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
        },
        body: JSON.stringify({ platform: "youtube", creator_unique_identifier: creatorId }),
      }
    );

    if (!refreshRes.ok) {
      console.error(`[youtube-stats] Token refresh failed: ${await refreshRes.text()}`);
      return null;
    }

    const { data: newTokens } = await supabase
      .from("youtube_tokens")
      .select("*, google_access_token_secret_id")
      .eq("creator_unique_identifier", creatorId)
      .single();

    if (!newTokens) return null;
    tokens = newTokens;
  }

  let accessToken = tokens.google_access_token || tokens.access_token;

  if (!accessToken && tokens.google_access_token_secret_id) {
    const { data: decrypted, error: decError } = await supabase.rpc("get_decrypted_secret", {
      p_secret_id: tokens.google_access_token_secret_id,
    });
    if (decError) {
      console.error(`[youtube-stats] Vault decrypt failed: ${decError.message}`);
      return null;
    }
    accessToken = decrypted;
  }

  return accessToken || null;
}

// ============================================================
// Instagram
// ============================================================
async function fetchInstagramStats(supabase: any, creatorId: string, instagramUrl: string) {
  const accessToken = await getInstagramToken(supabase, creatorId);
  if (!accessToken) {
    console.error(`[instagram-stats] No access token available for ${creatorId}`);
    return null;
  }

  console.log(`[instagram-stats] Got token for ${creatorId} (length: ${accessToken.length})`);

  const mediaId = await resolveInstagramMediaId(supabase, creatorId, accessToken, instagramUrl);
  if (!mediaId) {
    console.error(`[instagram-stats] Could not resolve media ID for ${instagramUrl}`);
    return null;
  }

  console.log(`[instagram-stats] Resolved media ID: ${mediaId} for ${instagramUrl}`);

  // Fetch basic media fields (like_count, comments_count)
  const fieldsUrl = `https://graph.facebook.com/${GRAPH_API_VERSION}/${mediaId}?fields=like_count,comments_count&access_token=${accessToken}`;
  const fieldsRes = await fetch(fieldsUrl);

  let likes = 0;
  let comments = 0;

  if (fieldsRes.ok) {
    const fieldsData = await fieldsRes.json();
    likes = fieldsData.like_count || 0;
    comments = fieldsData.comments_count || 0;
    console.log(`[instagram-stats] Fields API: likes=${likes}, comments=${comments}`);
  } else {
    const errText = await fieldsRes.text();
    console.error(`[instagram-stats] Fields API failed (${fieldsRes.status}): ${errText.substring(0, 500)}`);
  }

  // Fetch plays/views from insights
  let views = 0;
  const insightsUrl = `https://graph.facebook.com/${GRAPH_API_VERSION}/${mediaId}/insights?metric=plays&access_token=${accessToken}`;
  const insightsRes = await fetch(insightsUrl);

  if (insightsRes.ok) {
    const insightsData = await insightsRes.json();
    const playsMetric = insightsData.data?.find((m: any) => m.name === "plays");
    views = playsMetric?.values?.[0]?.value || 0;
    console.log(`[instagram-stats] Insights (plays): views=${views}`);
  } else {
    const insightsErr = await insightsRes.text();
    console.warn(`[instagram-stats] Insights (plays) failed (${insightsRes.status}): ${insightsErr.substring(0, 500)}`);

    // Fallback: try ig_reels_aggregated_all_plays_count
    const fallbackUrl = `https://graph.facebook.com/${GRAPH_API_VERSION}/${mediaId}/insights?metric=ig_reels_aggregated_all_plays_count&access_token=${accessToken}`;
    const fallbackRes = await fetch(fallbackUrl);
    if (fallbackRes.ok) {
      const fallbackData = await fallbackRes.json();
      const metric = fallbackData.data?.[0];
      views = metric?.values?.[0]?.value || 0;
      console.log(`[instagram-stats] Insights (ig_reels_aggregated): views=${views}`);
    } else {
      const fallbackErr = await fallbackRes.text();
      console.error(`[instagram-stats] Insights fallback also failed (${fallbackRes.status}): ${fallbackErr.substring(0, 500)}`);
    }
  }

  console.log(`[instagram-stats] Final stats for ${mediaId}: views=${views}, likes=${likes}, comments=${comments}`);
  return { views, likes, comments };
}

async function resolveInstagramMediaId(
  supabase: any,
  creatorId: string,
  accessToken: string,
  instagramUrl: string
): Promise<string | null> {
  // First, try fetching the user's recent media and matching by permalink
  const { data: tokens } = await supabase
    .from("instagram_tokens")
    .select("instagram_id")
    .eq("creator_unique_identifier", creatorId)
    .single();

  if (!tokens?.instagram_id) {
    console.error(`[instagram-stats] No instagram_id found for ${creatorId}`);
    return null;
  }

  const mediaListUrl = `https://graph.facebook.com/${GRAPH_API_VERSION}/${tokens.instagram_id}/media?fields=id,permalink&limit=50&access_token=${accessToken}`;
  const mediaListRes = await fetch(mediaListUrl);

  if (!mediaListRes.ok) {
    const errText = await mediaListRes.text();
    console.error(`[instagram-stats] Failed to list media (${mediaListRes.status}): ${errText.substring(0, 500)}`);
    return null;
  }

  const mediaList = await mediaListRes.json();
  console.log(`[instagram-stats] Media list returned ${mediaList.data?.length || 0} items`);

  const normalizedUrl = instagramUrl.replace(/\/$/, "").toLowerCase();

  const match = mediaList.data?.find((m: any) => {
    const normalizedPermalink = (m.permalink || "").replace(/\/$/, "").toLowerCase();
    return normalizedPermalink === normalizedUrl;
  });

  if (match) {
    console.log(`[instagram-stats] Matched permalink: ${match.permalink} → mediaId: ${match.id}`);
    return match.id;
  }

  // Log all permalinks for debugging
  const permalinks = mediaList.data?.map((m: any) => m.permalink).join(", ");
  console.warn(`[instagram-stats] No permalink match for ${instagramUrl}. Available: ${permalinks}`);
  return null;
}

async function getInstagramToken(supabase: any, creatorId: string): Promise<string | null> {
  let { data: tokens, error } = await supabase
    .from("instagram_tokens")
    .select("*, access_token_secret_id")
    .eq("creator_unique_identifier", creatorId)
    .single();

  if (error || !tokens) {
    console.warn(`[instagram-stats] No Instagram tokens for ${creatorId}`);
    return null;
  }

  // Refresh if expired
  if (tokens.expires_at && new Date(tokens.expires_at) <= new Date()) {
    console.log(`[instagram-stats] Token expired for ${creatorId}, refreshing...`);
    const refreshRes = await fetch(
      `${Deno.env.get("SUPABASE_URL")}/functions/v1/refresh-token`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
        },
        body: JSON.stringify({ platform: "instagram", creator_unique_identifier: creatorId }),
      }
    );

    if (!refreshRes.ok) {
      console.error(`[instagram-stats] Token refresh failed: ${await refreshRes.text()}`);
      return null;
    }

    const { data: newTokens } = await supabase
      .from("instagram_tokens")
      .select("*, access_token_secret_id")
      .eq("creator_unique_identifier", creatorId)
      .single();

    if (!newTokens) return null;
    tokens = newTokens;
  }

  // Check multiple token fields - facebook_access_token is what instagram-fb-auth stores
  let accessToken = tokens.facebook_access_token || tokens.access_token;

  if (!accessToken && tokens.access_token_secret_id) {
    console.log(`[instagram-stats] Decrypting token from vault for ${creatorId}...`);
    const { data: decrypted, error: decError } = await supabase.rpc("get_decrypted_secret", {
      p_secret_id: tokens.access_token_secret_id,
    });
    if (decError) {
      console.error(`[instagram-stats] Vault decrypt failed: ${decError.message}`);
      return null;
    }
    if (!decrypted) {
      console.error(`[instagram-stats] Vault returned null for secret_id: ${tokens.access_token_secret_id}`);
      return null;
    }
    console.log(`[instagram-stats] Vault decrypted token (length: ${decrypted.length})`);
    accessToken = decrypted;
  }

  return accessToken || null;
}

// ============================================================
// Facebook
// ============================================================
async function fetchFacebookStats(supabase: any, creatorId: string, facebookUrl: string) {
  const videoId = extractFacebookVideoId(facebookUrl);
  if (!videoId) {
    console.warn(`[facebook-stats] Could not extract video ID from: ${facebookUrl}`);
    return null;
  }

  const accessToken = await getFacebookToken(supabase, creatorId);
  if (!accessToken) return null;

  // Fetch video stats
  const res = await fetch(
    `https://graph.facebook.com/${GRAPH_API_VERSION}/${videoId}?fields=likes.limit(0).summary(total_count),comments.limit(0).summary(total_count)&access_token=${accessToken}`
  );

  let likes = 0;
  let comments = 0;

  if (res.ok) {
    const data = await res.json();
    likes = data.likes?.summary?.total_count || 0;
    comments = data.comments?.summary?.total_count || 0;
  } else {
    console.warn(`[facebook-stats] Video stats API failed: ${await res.text()}`);
  }

  // Fetch views from video insights
  let views = 0;
  const insightsRes = await fetch(
    `https://graph.facebook.com/${GRAPH_API_VERSION}/${videoId}/video_insights?metric=total_video_impressions&access_token=${accessToken}`
  );

  if (insightsRes.ok) {
    const insightsData = await insightsRes.json();
    const metric = insightsData.data?.[0];
    views = metric?.values?.[0]?.value || 0;
  } else {
    // Fallback: try post_video_views
    const fallbackRes = await fetch(
      `https://graph.facebook.com/${GRAPH_API_VERSION}/${videoId}/video_insights?metric=post_video_views&access_token=${accessToken}`
    );
    if (fallbackRes.ok) {
      const fallbackData = await fallbackRes.json();
      const metric = fallbackData.data?.[0];
      views = metric?.values?.[0]?.value || 0;
    }
  }

  return { views, likes, comments };
}

function extractFacebookVideoId(url: string): string | null {
  try {
    const u = new URL(url);
    // Format: https://www.facebook.com/watch/?v=123456
    return u.searchParams.get("v") || null;
  } catch {
    return null;
  }
}

async function getFacebookToken(supabase: any, creatorId: string): Promise<string | null> {
  // 1. Try facebook_tokens table first
  const { data: fbTokens } = await supabase
    .from("facebook_tokens")
    .select("*")
    .eq("creator_unique_identifier", creatorId)
    .maybeSingle();

  if (fbTokens) {
    let pageToken = fbTokens.page_access_token;

    if (!pageToken && fbTokens.page_access_token_secret_id) {
      const { data: decrypted } = await supabase.rpc("get_decrypted_secret", {
        p_secret_id: fbTokens.page_access_token_secret_id,
      });
      pageToken = decrypted;
    }

    if (pageToken) return pageToken;

    return fbTokens.user_access_token_long_lived || null;
  }

  // 2. Fall back to instagram_tokens (shared OAuth)
  let { data: igTokens } = await supabase
    .from("instagram_tokens")
    .select("*, facebook_access_token, access_token, access_token_secret_id")
    .eq("creator_unique_identifier", creatorId)
    .single();

  if (!igTokens) {
    console.warn(`[facebook-stats] No Facebook tokens for ${creatorId}`);
    return null;
  }

  // Refresh if expired
  if (igTokens.expires_at && new Date(igTokens.expires_at) <= new Date()) {
    const refreshRes = await fetch(
      `${Deno.env.get("SUPABASE_URL")}/functions/v1/refresh-token`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
        },
        body: JSON.stringify({ platform: "instagram", creator_unique_identifier: creatorId }),
      }
    );

    if (refreshRes.ok) {
      const { data: newTokens } = await supabase
        .from("instagram_tokens")
        .select("*, facebook_access_token, access_token, access_token_secret_id")
        .eq("creator_unique_identifier", creatorId)
        .single();
      if (newTokens) igTokens = newTokens;
    }
  }

  let accessToken = igTokens.facebook_access_token || igTokens.access_token;

  if (!accessToken && igTokens.access_token_secret_id) {
    const { data: decrypted } = await supabase.rpc("get_decrypted_secret", {
      p_secret_id: igTokens.access_token_secret_id,
    });
    accessToken = decrypted;
  }

  return accessToken || null;
}
