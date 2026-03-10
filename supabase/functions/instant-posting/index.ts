import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function sanitizeErrorMessage(msg: string): string {
  return msg.replace(/access_token=[^&\s"']+/gi, 'access_token=[REDACTED]');
}

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  let videoId: string | null = null;

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const body = await req.json();
    const { video_id, creator_unique_identifier, platform } = body;
    videoId = video_id;

    if (!video_id || !creator_unique_identifier || !platform) {
      throw new Error("Missing required parameters: video_id, creator_unique_identifier, platform");
    }

    console.log(`[instant-posting] Starting exact publishing logic for ${platform} - Video ID: ${video_id}`);

    // Fetch video details
    const { data: videoData, error: videoError } = await supabaseClient
      .from('air_publisher_videos')
      .select('*')
      .eq('id', video_id)
      .single();

    if (videoError || !videoData) {
      throw new Error(`Failed to fetch video: ${videoError?.message || 'Not found'}`);
    }

    let publishCallbackResponse = null;

    if (platform === 'youtube') {
      publishCallbackResponse = await handleYouTubePublish(supabaseClient, creator_unique_identifier, videoData);
    } else if (platform === 'instagram') {
      publishCallbackResponse = await handleInstagramPublish(supabaseClient, creator_unique_identifier, videoData);
    } else if (platform === 'facebook') {
      publishCallbackResponse = await handleFacebookPublish(supabaseClient, creator_unique_identifier, videoData);
    } else {
      throw new Error(`Unsupported platform: ${platform}`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Successfully published to ${platform}`,
        details: publishCallbackResponse
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    const errMsg = error?.message || String(error);
    const errStack = error?.stack || 'no stack';
    console.error(`[instant-posting] FATAL ERROR: ${errMsg}`);
    console.error(`[instant-posting] STACK: ${errStack}`);

    // Persist error to database so the user can see why it failed
    if (videoId) {
      try {
        const supabaseClient = createClient(
          Deno.env.get("SUPABASE_URL") ?? "",
          Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
        );
        await supabaseClient
          .from('air_publisher_videos')
          .update({ status: 'failed', error_message: sanitizeErrorMessage(errMsg) })
          .eq('id', videoId);
      } catch (dbErr) {
        console.error(`[instant-posting] Failed to persist error to DB: ${dbErr}`);
      }
    }

    return new Response(
      JSON.stringify({ error: errMsg, stack: errStack }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
    );
  }
});

/**
 * Try to get YouTube tokens from the NEW airpublish_* tables.
 * Returns { accessToken, refreshToken } or null if not found.
 */
async function tryNewYouTubeTokens(
  supabaseClient: any,
  creator_unique_identifier: string
): Promise<{ accessToken: string; refreshToken: string | null } | null> {
  // Look up connection by creator_id (the identifier from Air Ideas, e.g. igg_xxx)
  const { data: conn } = await supabaseClient
    .from('airpublish_connections')
    .select('id, platform_account_id')
    .eq('creator_id', creator_unique_identifier)
    .eq('platform', 'youtube')
    .eq('is_active', true)
    .maybeSingle();

  if (!conn) {
    console.log('[youtube] No connection found in airpublish_connections for:', creator_unique_identifier);
    return null;
  }

  const { data: tokens } = await supabaseClient
    .from('airpublish_youtube_tokens')
    .select('*')
    .eq('connection_id', conn.id)
    .maybeSingle();

  if (!tokens) {
    console.log('[youtube] No tokens found in airpublish_youtube_tokens for connection:', conn.id);
    return null;
  }

  let accessToken = tokens.access_token;
  let refreshToken = tokens.refresh_token;

  // If token is expired and we have a refresh token, refresh it directly
  if (accessToken && tokens.expires_at && new Date(tokens.expires_at) <= new Date() && refreshToken) {
    console.log('[youtube] NEW table token expired, refreshing directly...');
    const clientId = Deno.env.get('GOOGLE_OAUTH_CLIENT_ID_PUBLISHER') || Deno.env.get('GOOGLE_CLIENT_ID_ALYAN') || Deno.env.get('GOOGLE_CLIENT_ID') || '';
    const clientSecret = Deno.env.get('GOOGLE_OAUTH_CLIENT_SECRET_PUBLISHER') || Deno.env.get('GOOGLE_CLIENT_SECRET_ALYAN') || Deno.env.get('GOOGLE_CLIENT_SECRET') || '';

    const refreshRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
      }),
    });

    if (refreshRes.ok) {
      const data = await refreshRes.json();
      accessToken = data.access_token;
      const expiresIn = data.expires_in || 3600;
      const newExpiresAt = new Date(Date.now() + expiresIn * 1000).toISOString();

      // Update the new table with refreshed token
      await supabaseClient
        .from('airpublish_youtube_tokens')
        .update({ access_token: accessToken, expires_at: newExpiresAt, updated_at: new Date().toISOString() })
        .eq('connection_id', conn.id);

      console.log('[youtube] NEW table token refreshed successfully');
    } else {
      const err = await refreshRes.text();
      console.error(`[youtube] NEW table token refresh failed: ${err}`);
      return null;
    }
  }

  if (!accessToken) return null;

  console.log(`[youtube] Found tokens via NEW airpublish_* tables (channel: ${tokens.channel_title || conn.platform_account_id})`);
  return { accessToken, refreshToken };
}

/**
 * Resolves the actual YouTube creator_unique_identifier when the caller's
 * identity is from a different platform (e.g., igg_xxx for Instagram).
 *
 * Strategy:
 *   1. Direct match on youtube_tokens (identity IS the YouTube one)
 *   2. airpublisher_connections lookup (primary_identifier -> connection_identifier)
 *   3. creator_profiles user_id fallback (same user_id across token tables)
 */
async function resolveYouTubeIdentifier(
  supabaseClient: any,
  creator_unique_identifier: string
): Promise<string | null> {
  // Strategy 1: Direct match
  const { data: directMatch } = await supabaseClient
    .from('youtube_tokens')
    .select('creator_unique_identifier')
    .eq('creator_unique_identifier', creator_unique_identifier)
    .maybeSingle();

  if (directMatch) {
    console.log('[youtube] Token found via direct creator_unique_identifier match');
    return creator_unique_identifier;
  }

  // Strategy 2: airpublisher_connections lookup
  const { data: connection } = await supabaseClient
    .from('airpublisher_connections')
    .select('connection_identifier')
    .eq('primary_identifier', creator_unique_identifier)
    .eq('platform', 'youtube')
    .maybeSingle();

  if (connection?.connection_identifier) {
    console.log(`[youtube] Resolved via airpublisher_connections: ${creator_unique_identifier} -> ${connection.connection_identifier}`);
    return connection.connection_identifier;
  }

  // Strategy 3: creator_profiles user_id fallback
  const { data: profile } = await supabaseClient
    .from('creator_profiles')
    .select('user_id')
    .eq('unique_identifier', creator_unique_identifier)
    .maybeSingle();

  if (profile?.user_id) {
    const { data: ytByUserId } = await supabaseClient
      .from('youtube_tokens')
      .select('creator_unique_identifier')
      .eq('user_id', profile.user_id)
      .maybeSingle();

    if (ytByUserId?.creator_unique_identifier) {
      console.log(`[youtube] Resolved via creator_profiles user_id: ${creator_unique_identifier} -> ${ytByUserId.creator_unique_identifier}`);
      return ytByUserId.creator_unique_identifier;
    }
  }

  console.error(`[youtube] Could not resolve YouTube identifier for: ${creator_unique_identifier}`);
  return null;
}

async function handleYouTubePublish(supabaseClient: any, creator_unique_identifier: string, videoData: any) {
  console.log('[youtube] Fetching tokens...');

  // === PRIMARY: Try NEW airpublish_* tables first ===
  const newTokens = await tryNewYouTubeTokens(supabaseClient, creator_unique_identifier);

  let accessToken: string | null = null;

  if (newTokens) {
    accessToken = newTokens.accessToken;
  } else {
    // === FALLBACK: Try OLD youtube_tokens table ===
    console.log('[youtube] NEW tables had no tokens, falling back to OLD youtube_tokens...');

    const resolvedIdentifier = await resolveYouTubeIdentifier(supabaseClient, creator_unique_identifier);

    if (!resolvedIdentifier) {
      throw new Error(`Missing YouTube tokens: could not resolve YouTube identity for ${creator_unique_identifier}`);
    }

    let { data: tokens, error: tokensError } = await supabaseClient
      .from('youtube_tokens')
      .select('*, google_access_token_secret_id')
      .eq('creator_unique_identifier', resolvedIdentifier)
      .single();

    if (tokens && tokens.expires_at && new Date(tokens.expires_at) <= new Date()) {
      console.log('[youtube] OLD table token expired, refreshing before use...');
      const refreshRes = await fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/refresh-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`
        },
        body: JSON.stringify({
          platform: 'youtube',
          creator_unique_identifier: resolvedIdentifier
        })
      });

      if (!refreshRes.ok) {
        throw new Error(`Failed to refresh YouTube token: ${await refreshRes.text()}`);
      }

      const { data: newTokens, error: newTokensError } = await supabaseClient
        .from('youtube_tokens')
        .select('*, google_access_token_secret_id')
        .eq('creator_unique_identifier', resolvedIdentifier)
        .single();

      if (newTokensError || !newTokens) throw new Error('Missing YouTube tokens after refresh');
      tokens = newTokens;
    }

    if (tokensError || !tokens) throw new Error(`Missing YouTube tokens for ${resolvedIdentifier} (original: ${creator_unique_identifier})`);

    accessToken = tokens.google_access_token || tokens.access_token;

    if (!accessToken && tokens.google_access_token_secret_id) {
      const { data: decrypted, error: decError } = await supabaseClient.rpc('get_decrypted_secret', {
        p_secret_id: tokens.google_access_token_secret_id
      });
      if (decError) throw new Error('Failed to decrypt Vault token');
      accessToken = decrypted;
    }
  }

  if (!accessToken) throw new Error('No valid YouTube access token found');

  const title = videoData.title || 'Untitled Video';
  const description = videoData.description || '';
  const privacyStatus = videoData.youtube_privacy_status || 'public';
  const videoUrl = videoData.video_url;

  if (!videoUrl) throw new Error('No video_url found for publishing');

  console.log(`[youtube] Starting resumable session... (privacy: ${privacyStatus})`);

  const sessionRes = await fetch("https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${accessToken}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      snippet: {
        title,
        description,
        tags: [],
        categoryId: "22",
        defaultLanguage: "en",
        defaultAudioLanguage: "en"
      },
      status: {
        privacyStatus: privacyStatus,
        selfDeclaredMadeForKids: false
      }
    })
  });

  if (!sessionRes.ok) {
    const err = await sessionRes.text();
    throw new Error(`YouTube resumable init error: ${err}`);
  }

  const uploadUrl = sessionRes.headers.get("location");
  if (!uploadUrl) throw new Error('YouTube did not return an upload location');

  console.log('[youtube] Downloading video...');
  const videoStreamRes = await fetch(videoUrl);
  if (!videoStreamRes.ok) throw new Error('Failed to download source video');

  const contentLen = videoStreamRes.headers.get('content-length');

  console.log('[youtube] Uploading video binary...');
  const uploadRes = await fetch(uploadUrl, {
    method: "PUT",
    headers: {
      "Authorization": `Bearer ${accessToken}`,
      "Content-Type": "video/mp4",
      ...(contentLen ? { "Content-Length": contentLen } : {})
    },
    body: videoStreamRes.body // Pipe the stream directly
  });

  if (!uploadRes.ok) {
    const err = await uploadRes.text();
    throw new Error(`YouTube final upload error: ${err}`);
  }

  const uploadData = await uploadRes.json();
  const youtubeUrl = `https://www.youtube.com/watch?v=${uploadData.id}`;

  console.log(`[youtube] ✅ Upload successful: ${youtubeUrl}`);

  const { error: updateError } = await supabaseClient.from('air_publisher_videos').update({
    youtube_url: youtubeUrl,
    platform_target: 'youtube',
    status: 'posted',
    posted_at: new Date().toISOString(),
    error_message: null
  }).eq('id', videoData.id);

  if (updateError) {
    console.error(`[youtube] Error updating video status to posted: ${updateError.message}`, updateError);
  }

  return uploadData;
}

async function handleInstagramPublish(supabaseClient: any, creator_unique_identifier: string, videoData: any) {
  console.log('[instagram] === STEP 0: Fetching tokens... ===');
  console.log(`[instagram] creator_unique_identifier: ${creator_unique_identifier}`);

  let { data: tokens, error: tokensError } = await supabaseClient
    .from('instagram_tokens')
    .select('*, instagram_id, access_token, access_token_secret_id')
    .eq('creator_unique_identifier', creator_unique_identifier)
    .single();

  console.log(`[instagram] Token query result - data: ${tokens ? 'found' : 'null'}, error: ${tokensError ? tokensError.message : 'none'}`);
  if (tokens) {
    console.log(`[instagram] Token details - instagram_id: ${tokens.instagram_id}, has_access_token: ${!!tokens.access_token}, secret_id: ${tokens.access_token_secret_id}, expires_at: ${tokens.expires_at}`);
  }

  if (tokens && tokens.expires_at && new Date(tokens.expires_at) <= new Date()) {
    console.log('[instagram] Token expired, refreshing before use...');
    const refreshRes = await fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/refresh-token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`
      },
      body: JSON.stringify({
        platform: 'instagram',
        creator_unique_identifier: creator_unique_identifier
      })
    });

    if (!refreshRes.ok) {
      const refreshErr = await refreshRes.text();
      console.error(`[instagram] Refresh failed: ${refreshErr}`);
      throw new Error(`Failed to refresh Instagram token: ${refreshErr}`);
    }

    const { data: newTokens, error: newTokensError } = await supabaseClient
      .from('instagram_tokens')
      .select('*, instagram_id, access_token, access_token_secret_id')
      .eq('creator_unique_identifier', creator_unique_identifier)
      .single();

    if (newTokensError || !newTokens) throw new Error(`Missing Instagram tokens after refresh: ${newTokensError?.message || 'null data'}`);
    tokens = newTokens;
  }

  if (tokensError || !tokens) throw new Error(`Missing Instagram tokens: ${tokensError?.message || 'tokens data is null'}`);

  let accessToken = tokens.access_token;
  const instagramId = tokens.instagram_id;

  console.log(`[instagram] instagram_id: ${instagramId}, has plaintext token: ${!!accessToken}`);

  if (!instagramId) throw new Error('Missing instagram_id in token table record');

  if (!accessToken && tokens.access_token_secret_id) {
    console.log(`[instagram] Decrypting token from Vault, secret_id: ${tokens.access_token_secret_id}`);
    const { data: decrypted, error: decError } = await supabaseClient.rpc('get_decrypted_secret', {
      p_secret_id: tokens.access_token_secret_id
    });
    if (decError) {
      console.error(`[instagram] Vault decrypt error: ${JSON.stringify(decError)}`);
      throw new Error(`Failed to decrypt Vault token: ${decError.message || JSON.stringify(decError)}`);
    }
    console.log(`[instagram] Vault decrypted token length: ${decrypted ? decrypted.length : 'null'}`);
    accessToken = decrypted;
  }

  if (!accessToken) throw new Error('No valid Instagram access token found (both plaintext and vault are empty)');

  const caption = videoData.description || '';
  const videoUrl = videoData.video_url;

  if (!videoUrl) throw new Error('No video_url found for publishing');

  console.log(`[instagram] === STEP 1: Creating media container ===`);
  console.log(`[instagram] instagramId: ${instagramId}, videoUrl: ${videoUrl?.substring(0, 80)}..., caption length: ${caption?.length || 0}`);
  console.log(`[instagram] accessToken length: ${accessToken?.length}, accessToken prefix: ${accessToken?.substring(0, 10)}...`);

  const createMediaUrl = `https://graph.facebook.com/v21.0/${instagramId}/media`;
  const createMediaBody = {
    media_type: "REELS",
    video_url: videoUrl,
    caption: caption,
    thumb_offset: 0,
    access_token: accessToken
  };
  console.log(`[instagram] POST ${createMediaUrl}`);

  const createMediaRes = await fetch(createMediaUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(createMediaBody)
  });

  console.log(`[instagram] Create media response status: ${createMediaRes.status}`);
  if (!createMediaRes.ok) {
    const err = await createMediaRes.text();
    console.error(`[instagram] Create media FAILED: ${err}`);
    throw new Error(`Instagram Create Media failed (HTTP ${createMediaRes.status}): ${err}`);
  }

  const mediaData = await createMediaRes.json();
  const mediaId = mediaData.id;
  console.log(`[instagram] Container created, mediaId: ${mediaId}`);

  console.log(`[instagram] Container created: ${mediaId}. Polling status...`);

  // Simple polling to wait for FINISHED status (Instagram video processing)
  let status = "IN_PROGRESS";
  let attempts = 0;
  while (status !== "FINISHED" && attempts < 15) {
    attempts++;
    await new Promise(r => setTimeout(r, 5000)); // wait 5 seconds

    const statusRes = await fetch(`https://graph.facebook.com/v21.0/${mediaId}?fields=status_code&access_token=${accessToken}`);
    if (statusRes.ok) {
      const statusData = await statusRes.json();
      status = statusData.status_code;
      console.log(`[instagram] Status attempt ${attempts}: ${status}`);
    }
  }

  if (status !== "FINISHED") {
    throw new Error('Instagram media processing timed out or failed. Did not reach FINISHED status.');
  }

  console.log('[instagram] Step 2: Publishing media...');
  const publishRes = await fetch(`https://graph.facebook.com/v21.0/${instagramId}/media_publish`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      creation_id: mediaId,
      access_token: accessToken
    })
  });

  if (!publishRes.ok) {
    const err = await publishRes.text();
    throw new Error(`Instagram Publish failed: ${err}`);
  }

  const publishData = await publishRes.json();
  const publishedMediaId = publishData.id;

  console.log(`[instagram] Step 3: Fetching permalink...`);
  const finalRes = await fetch(`https://graph.facebook.com/v21.0/${publishedMediaId}?fields=permalink&access_token=${accessToken}`);
  let permalink = null;
  if (finalRes.ok) {
    const finalData = await finalRes.json();
    permalink = finalData.permalink;
  }

  console.log(`[instagram] ✅ Published successfully: ${permalink || publishedMediaId}`);

  const { error: updateError } = await supabaseClient.from('air_publisher_videos').update({
    instagram_url: permalink || `https://instagram.com/p/${publishedMediaId}`,
    platform_target: 'instagram',
    status: 'posted',
    posted_at: new Date().toISOString(),
    error_message: null
  }).eq('id', videoData.id);

  if (updateError) {
    console.error(`[instagram] Error updating video status to posted: ${updateError.message}`, updateError);
  }

  return publishData;
}

async function handleFacebookPublish(supabaseClient: any, creator_unique_identifier: string, videoData: any) {
  console.log('[facebook] Fetching tokens...');

  // Try facebook_tokens first (direct Facebook OAuth), then fall back to instagram_tokens
  let tokens: any = null;
  let tokensError: any = null;
  let tokenSource = '';

  // 1. Try facebook_tokens table first — by creator_unique_identifier (e.g. fb_...)
  const { data: fbTokens } = await supabaseClient
    .from('facebook_tokens')
    .select('*, page_access_token, user_access_token_long_lived, user_token_expires_at, page_id, page_access_token_secret_id, user_access_token_secret_id')
    .eq('creator_unique_identifier', creator_unique_identifier)
    .maybeSingle();

  if (fbTokens) {
    console.log('[facebook] Found token in facebook_tokens table (by creator_unique_identifier)');
    tokenSource = 'facebook_tokens';
    tokens = fbTokens;

    if (tokens.user_token_expires_at && new Date(tokens.user_token_expires_at) <= new Date()) {
      console.warn('[facebook] Facebook token expired. Direct Facebook tokens cannot be auto-refreshed.');
    }
  }

  // 1b. Cross-identity fallback: facebook_tokens stores 'fb_...' but we may be called with 'igg_...'
  //     Look up the user_id from creator_profiles and query by user_id instead
  if (!tokens) {
    const { data: profileData } = await supabaseClient
      .from('creator_profiles')
      .select('user_id')
      .eq('unique_identifier', creator_unique_identifier)
      .maybeSingle();

    if (profileData?.user_id) {
      const { data: fbByUserId } = await supabaseClient
        .from('facebook_tokens')
        .select('*, page_access_token, user_access_token_long_lived, user_token_expires_at, page_id, page_access_token_secret_id, user_access_token_secret_id')
        .eq('user_id', profileData.user_id)
        .maybeSingle();

      if (fbByUserId) {
        console.log('[facebook] Found token in facebook_tokens via user_id cross-identity lookup');
        tokenSource = 'facebook_tokens';
        tokens = fbByUserId;

        if (tokens.user_token_expires_at && new Date(tokens.user_token_expires_at) <= new Date()) {
          console.warn('[facebook] Facebook token expired. Direct Facebook tokens cannot be auto-refreshed.');
        }
      }
    }
  }

  // 1c. airpublisher_connections lookup: primary_identifier -> facebook connection_identifier
  if (!tokens) {
    const { data: fbConnection } = await supabaseClient
      .from('airpublisher_connections')
      .select('connection_identifier')
      .eq('primary_identifier', creator_unique_identifier)
      .eq('platform', 'facebook')
      .maybeSingle();

    if (fbConnection?.connection_identifier) {
      const { data: fbByConnection } = await supabaseClient
        .from('facebook_tokens')
        .select('*, page_access_token, user_access_token_long_lived, user_token_expires_at, page_id, page_access_token_secret_id, user_access_token_secret_id')
        .eq('creator_unique_identifier', fbConnection.connection_identifier)
        .maybeSingle();

      if (fbByConnection) {
        console.log(`[facebook] Found token via airpublisher_connections: ${creator_unique_identifier} -> ${fbConnection.connection_identifier}`);
        tokenSource = 'facebook_tokens';
        tokens = fbByConnection;

        if (tokens.user_token_expires_at && new Date(tokens.user_token_expires_at) <= new Date()) {
          console.warn('[facebook] Facebook token expired. Direct Facebook tokens cannot be auto-refreshed.');
        }
      }
    }
  }

  // 2. Fall back to instagram_tokens (Instagram/Facebook shared OAuth)
  if (!tokens) {
    console.log('[facebook] No facebook_tokens found, falling back to instagram_tokens...');
    const { data: igTokens, error: igTokensError } = await supabaseClient
      .from('instagram_tokens')
      .select('*, facebook_access_token, access_token, access_token_secret_id')
      .eq('creator_unique_identifier', creator_unique_identifier)
      .single();

    if (igTokens) {
      tokenSource = 'instagram_tokens';
      tokens = igTokens;
      tokensError = igTokensError;

      if (tokens.expires_at && new Date(tokens.expires_at) <= new Date()) {
        console.log('[facebook] Token expired, refreshing before use (via Instagram)...');
        const refreshRes = await fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/refresh-token`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`
          },
          body: JSON.stringify({
            platform: 'instagram',
            creator_unique_identifier: creator_unique_identifier
          })
        });

        if (!refreshRes.ok) {
          console.error(`Failed to refresh Facebook/Instagram token: ${await refreshRes.text()}`);
        } else {
          const { data: newTokens, error: newTokensError } = await supabaseClient
            .from('instagram_tokens')
            .select('*, facebook_access_token, access_token, access_token_secret_id')
            .eq('creator_unique_identifier', creator_unique_identifier)
            .single();

          if (!newTokensError && newTokens) {
            tokens = newTokens;
          }
        }
      }
    } else {
      tokensError = igTokensError;
    }
  }

  if (!tokens) throw new Error(`Missing Facebook tokens: no row found in facebook_tokens or instagram_tokens for ${creator_unique_identifier}`);

  // Resolve access token based on which table it came from
  let accessToken: string | null = null;
  if (tokenSource === 'facebook_tokens') {
    accessToken = tokens.user_access_token_long_lived || tokens.page_access_token;
  } else {
    accessToken = tokens.facebook_access_token || tokens.access_token;
  }

  // Vault fallback for facebook_tokens (page token preferred, user token as backup)
  if (!accessToken && tokens.page_access_token_secret_id) {
    const { data: decrypted } = await supabaseClient.rpc('get_decrypted_secret', {
      p_secret_id: tokens.page_access_token_secret_id
    });
    if (decrypted) accessToken = decrypted;
  }
  if (!accessToken && tokens.user_access_token_secret_id) {
    const { data: decrypted } = await supabaseClient.rpc('get_decrypted_secret', {
      p_secret_id: tokens.user_access_token_secret_id
    });
    if (decrypted) accessToken = decrypted;
  }
  // Vault fallback for instagram_tokens (access_token_secret_id)
  if (!accessToken && tokens.access_token_secret_id) {
    const { data: decrypted, error: decError } = await supabaseClient.rpc('get_decrypted_secret', {
      p_secret_id: tokens.access_token_secret_id
    });
    if (decError) throw new Error('Failed to decrypt Vault token');
    accessToken = decrypted;
  }

  if (!accessToken) throw new Error('No valid Facebook access token found');

  const caption = videoData.description || '';
  const videoUrl = videoData.video_url;

  if (!videoUrl) throw new Error('No video_url found for publishing');

  // Determine page ID and page access token for publishing
  let pageId: string | null = null;
  let pageAccessToken: string = accessToken;

  // If we have page_id from facebook_tokens, use it directly with the already-decrypted token
  if (tokenSource === 'facebook_tokens' && tokens.page_id) {
    pageId = tokens.page_id;
    console.log(`[facebook] Using stored Page ID ${pageId} with decrypted page token`);
  } else {
    // Fallback: fetch pages via /me/accounts (requires a User Access Token)
    console.log('[facebook] Fetching User Pages via /me/accounts...');
    const pagesRes = await fetch(`https://graph.facebook.com/v21.0/me/accounts?access_token=${accessToken}`);
    const pagesData = await pagesRes.json();

    if (pagesData.error || !pagesData.data || pagesData.data.length === 0) {
      throw new Error(`Failed to fetch Facebook Pages. Please ensure you have connected a Facebook Page. Error: ${JSON.stringify(pagesData.error || 'No pages found')}`);
    }

    const page = pagesData.data[0];
    pageId = page.id;
    pageAccessToken = page.access_token;
    console.log(`[facebook] Resolved Page ID ${pageId} via /me/accounts`);
  }

  console.log(`[facebook] Publishing video to Page ${pageId}...`);

  const publishRes = await fetch(`https://graph.facebook.com/v21.0/${pageId}/videos`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      file_url: videoUrl,
      description: caption,
      access_token: pageAccessToken
    })
  });

  if (!publishRes.ok) {
    const err = await publishRes.text();
    throw new Error(`Facebook Publish failed: ${err}`);
  }

  const publishData = await publishRes.json();
  const publishedVideoId = publishData.id;

  console.log(`[facebook] ✅ Published successfully: ${publishedVideoId}`);

  const facebookUrl = publishedVideoId ? `https://www.facebook.com/watch/?v=${publishedVideoId}` : null;

  const { error: updateError } = await supabaseClient.from('air_publisher_videos').update({
    facebook_url: facebookUrl,
    platform_target: 'facebook',
    status: 'posted',
    posted_at: new Date().toISOString(),
    error_message: null
  }).eq('id', videoData.id);

  if (updateError) {
    console.error(`[facebook] Error updating video status to posted: ${updateError.message}`, updateError);
  }

  return publishData;
}
