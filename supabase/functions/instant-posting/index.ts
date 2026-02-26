import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const body = await req.json();
    const { video_id, creator_unique_identifier, platform } = body;

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
    } else if (platform === 'tiktok') {
      publishCallbackResponse = await handleTikTokPublish(supabaseClient, creator_unique_identifier, videoData);
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

  } catch (error) {
    console.error(`[instant-posting] Error:`, error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
    );
  }
});

async function handleYouTubePublish(supabaseClient: any, creator_unique_identifier: string, videoData: any) {
  console.log('[youtube] Fetching tokens...');

  const { data: tokens, error: tokensError } = await supabaseClient
    .from('youtube_tokens')
    .select('*, google_access_token_secret_id')
    .eq('creator_unique_identifier', creator_unique_identifier)
    .single();

  if (tokensError || !tokens) throw new Error('Missing YouTube tokens');

  let accessToken = tokens.google_access_token || tokens.access_token;

  if (!accessToken && tokens.google_access_token_secret_id) {
    const { data: decrypted, error: decError } = await supabaseClient.rpc('get_decrypted_secret', {
      p_secret_id: tokens.google_access_token_secret_id
    });
    if (decError) throw new Error('Failed to decrypt Vault token');
    accessToken = decrypted;
  }

  if (!accessToken) throw new Error('No valid YouTube access token found');

  const title = videoData.title || 'Untitled Video';
  const description = videoData.description || '';
  const videoUrl = videoData.video_url;

  if (!videoUrl) throw new Error('No video_url found for publishing');

  console.log('[youtube] Starting resumable session...');

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
        categoryId: "22", // Default to People & Blogs (or generic)
        defaultLanguage: "en",
        defaultAudioLanguage: "en"
      },
      status: {
        privacyStatus: "public",
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

  await supabaseClient.from('air_publisher_videos').update({
    youtube_url: youtubeUrl,
    status: 'published' // Optional status update
  }).eq('id', videoData.id);

  return uploadData;
}

async function handleInstagramPublish(supabaseClient: any, creator_unique_identifier: string, videoData: any) {
  console.log('[instagram] Fetching tokens...');

  const { data: tokens, error: tokensError } = await supabaseClient
    .from('instagram_tokens')
    .select('instagram_id, access_token, access_token_secret_id')
    .eq('creator_unique_identifier', creator_unique_identifier)
    .single();

  if (tokensError || !tokens) throw new Error(`Missing Instagram tokens: ${tokensError?.message || ''}`);

  let accessToken = tokens.access_token;
  const instagramId = tokens.instagram_id;

  if (!instagramId) throw new Error('Missing instagram_id in token table record');

  if (!accessToken && tokens.access_token_secret_id) {
    const { data: decrypted, error: decError } = await supabaseClient.rpc('get_decrypted_secret', {
      p_secret_id: tokens.access_token_secret_id
    });
    if (decError) throw new Error('Failed to decrypt Vault token');
    accessToken = decrypted;
  }

  if (!accessToken) throw new Error('No valid Instagram access token found');

  const caption = videoData.description || '';
  const videoUrl = videoData.video_url;

  if (!videoUrl) throw new Error('No video_url found for publishing');

  console.log('[instagram] Step 1: Creating media container...');
  const createMediaRes = await fetch(`https://graph.instagram.com/v18.0/${instagramId}/media`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${accessToken}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      media_type: "REELS",
      video_url: videoUrl,
      caption: caption,
      thumb_offset: 0
    })
  });

  if (!createMediaRes.ok) {
    const err = await createMediaRes.text();
    throw new Error(`Instagram Create Media failed: ${err}`);
  }

  const mediaData = await createMediaRes.json();
  const mediaId = mediaData.id;

  console.log(`[instagram] Container created: ${mediaId}. Polling status...`);

  // Simple polling to wait for FINISHED status (Instagram video processing)
  let status = "IN_PROGRESS";
  let attempts = 0;
  while (status !== "FINISHED" && attempts < 15) {
    attempts++;
    await new Promise(r => setTimeout(r, 5000)); // wait 5 seconds

    const statusRes = await fetch(`https://graph.instagram.com/v18.0/${mediaId}?fields=status_code&access_token=${accessToken}`);
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
  const publishRes = await fetch(`https://graph.instagram.com/v18.0/${instagramId}/media_publish`, {
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
  const finalRes = await fetch(`https://graph.instagram.com/v18.0/${publishedMediaId}?fields=permalink&access_token=${accessToken}`);
  let permalink = null;
  if (finalRes.ok) {
    const finalData = await finalRes.json();
    permalink = finalData.permalink;
  }

  console.log(`[instagram] ✅ Published successfully: ${permalink || publishedMediaId}`);

  await supabaseClient.from('air_publisher_videos').update({
    instagram_url: permalink || `https://instagram.com/p/${publishedMediaId}`,
    status: 'published'
  }).eq('id', videoData.id);

  return publishData;
}

async function handleTikTokPublish(supabaseClient: any, creator_unique_identifier: string, videoData: any) {
  console.log('[tiktok] Fetching tokens...');

  const { data: tokens, error: tokensError } = await supabaseClient
    .from('tiktok_tokens')
    .select('access_token, tiktok_open_id, access_token_secret_id')
    .eq('creator_unique_identifier', creator_unique_identifier)
    .single();

  if (tokensError || !tokens) throw new Error(`Missing TikTok tokens: ${tokensError?.message || ''}`);

  let accessToken = tokens.access_token;
  const openId = tokens.tiktok_open_id;

  if (!accessToken && tokens.access_token_secret_id) {
    const { data: decrypted, error: decError } = await supabaseClient.rpc('get_decrypted_secret', {
      p_secret_id: tokens.access_token_secret_id
    });
    if (decError) throw new Error('Failed to decrypt Vault token');
    accessToken = decrypted;
  }

  if (!accessToken) throw new Error('No valid TikTok access token found');

  const videoUrl = videoData.video_url;
  if (!videoUrl) throw new Error('No video_url found for publishing');

  console.log('[tiktok] Downloading video to determine size...');
  // For TikTok, we must know the exact file size for the INIT request. 
  // We can fetch headers.
  const headRes = await fetch(videoUrl, { method: 'HEAD' });
  const fileSizeStr = headRes.headers.get('content-length');
  if (!fileSizeStr) throw new Error('Could not determine video content-length for TikTok init');

  const videoSize = parseInt(fileSizeStr, 10);

  // Use recommended 10MB chunk size, or single chunk if < 20MB
  const MAX_SINGLE_CHUNK = 20000000;
  let chunkSize = (videoSize <= MAX_SINGLE_CHUNK) ? videoSize : 10000000;
  let totalChunkCount = Math.ceil(videoSize / chunkSize);

  console.log(`[tiktok] Step 1: Init Video Upload (Size: ${videoSize})`);
  const initRes = await fetch("https://open.tiktokapis.com/v2/post/publish/video/init/", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${accessToken}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      post_info: {
        title: videoData.title || 'Untitled Video',
        privacy_level: "SELF_ONLY", // From n8n settings
        disable_duet: false,
        disable_comment: false,
        disable_stitch: false,
        video_cover_timestamp_ms: 1000
      },
      source_info: {
        source: "FILE_UPLOAD",
        video_size: videoSize,
        chunk_size: chunkSize,
        total_chunk_count: totalChunkCount
      }
    })
  });

  if (!initRes.ok) {
    const err = await initRes.text();
    throw new Error(`TikTok Upload Init failed: ${err}`);
  }

  const initData = await initRes.json();
  const publishId = initData.data?.publish_id;
  const uploadUrl = initData.data?.upload_url;

  if (!publishId || !uploadUrl) {
    throw new Error('TikTok Init did not return publish_id or upload_url');
  }

  console.log(`[tiktok] Step 2: Streaming Upload to URL...`);
  const videoStreamRes = await fetch(videoUrl);
  if (!videoStreamRes.ok) throw new Error('Failed to download source video for TikTok upload');

  const uploadRes = await fetch(uploadUrl, {
    method: "PUT",
    headers: {
      "Content-Type": "video/mp4",
      "Content-Range": `bytes 0-${videoSize - 1}/${videoSize}`
    },
    body: videoStreamRes.body
  });

  if (!uploadRes.ok) {
    const err = await uploadRes.text();
    throw new Error(`TikTok Final Upload failed: ${err}`);
  }

  // Polling for publish complete (n8n JSON shows they fetch status)
  console.log(`[tiktok] Step 3: Fast Polling verify status...`);

  let attempts = 0;
  let success = false;
  while (attempts < 5 && !success) {
    attempts++;
    await new Promise(r => setTimeout(r, 2000));
    const verifyRes = await fetch("https://open.tiktokapis.com/v2/post/publish/status/fetch/", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ publish_id: publishId })
    });

    if (verifyRes.ok) {
      const vData = await verifyRes.json();
      if (vData?.data?.status === 'PUBLISH_COMPLETE' || vData?.data?.status === 'PROCESSING') {
        success = true;
      }
    }
  }

  console.log(`[tiktok] ✅ Upload pushed to queue: ${publishId}`);

  await supabaseClient.from('air_publisher_videos').update({
    status: 'published'
  }).eq('id', videoData.id);

  return { publish_id: publishId };
}
