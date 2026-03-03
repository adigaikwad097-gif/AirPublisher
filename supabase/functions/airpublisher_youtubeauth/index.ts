// @ts-ignore
declare const Deno: any;

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.1";
import { corsHeaders } from "../_shared/cors.ts";
import { FRONTEND_URL } from "../_shared/constants.ts";

const DEFAULT_ORIGIN = FRONTEND_URL;

// =========================================================================
// Helper Functions (Preserved from original code)
// =========================================================================

async function youtubeApiGet(accessToken: string, url: string): Promise<any> {
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/json",
    },
  });
  const text = await res.text();
  let data: any = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { raw: text };
  }
  if (!res.ok) {
    throw new Error(`YouTube API error ${res.status}: ${JSON.stringify(data)}`);
  }
  return data;
}

async function refreshGoogleAccessToken(refreshToken: string) {
  const clientId = Deno.env.get("GOOGLE_OAUTH_CLIENT_ID_PUBLISHER") ?? Deno.env.get("GOOGLE_OAUTH_CLIENT_ID") ?? "";
  const clientSecret = Deno.env.get("GOOGLE_OAUTH_CLIENT_SECRET_PUBLISHER") ?? Deno.env.get("GOOGLE_OAUTH_CLIENT_SECRET") ?? "";
  if (!clientId || !clientSecret) {
    throw new Error("Missing GOOGLE_OAUTH_CLIENT_ID / GOOGLE_OAUTH_CLIENT_SECRET secrets");
  }

  const form = new URLSearchParams();
  form.set("client_id", clientId);
  form.set("client_secret", clientSecret);
  form.set("refresh_token", refreshToken);
  form.set("grant_type", "refresh_token");

  const tokenUrl = "https://oauth2.googleapis.com/token";
  const res = await fetch(tokenUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: form.toString(),
  });
  const data = await res.json();

  if (!res.ok) {
    throw new Error(`Refresh error ${res.status}: ${JSON.stringify(data)}`);
  }

  return {
    access_token: data.access_token as string,
    expires_in: Number(data.expires_in ?? 3600),
    scope: (data.scope as string | undefined) ?? null,
    token_type: (data.token_type as string | undefined) ?? null,
  };
}

// =========================================================================
// Main Handler
// =========================================================================

serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const url = new URL(req.url); // Use a new variable for the URL object
  let action = url.searchParams.get("action");
  let origin = url.searchParams.get("origin") || DEFAULT_ORIGIN;
  let code = url.searchParams.get("code");
  let userId = url.searchParams.get("user_id");

  if (req.method === "POST") {
    try {
      const body = await req.json();
      if (body.action) action = body.action;
      if (body.origin) origin = body.origin;
      if (body.code) code = body.code;
      if (body.user_id) userId = body.user_id;

      // Support legacy 'fetch_top_videos' / 'status' calls passing params in body
      if (body.limit) url.searchParams.set("limit", String(body.limit));

    } catch (e) {
      // ignore JSON parse error for empty body
    }
  }

  if (!action && code) action = "callback";

  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  const clientId = Deno.env.get("GOOGLE_OAUTH_CLIENT_ID_PUBLISHER") ?? Deno.env.get("GOOGLE_OAUTH_CLIENT_ID") ?? "";
  const clientSecret = Deno.env.get("GOOGLE_OAUTH_CLIENT_SECRET_PUBLISHER") ?? Deno.env.get("GOOGLE_OAUTH_CLIENT_SECRET") ?? "";

  if (!supabaseUrl || !supabaseServiceKey || !clientId || !clientSecret) {
    return new Response(JSON.stringify({ error: "Missing Env Vars" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  const cleanSupabaseUrl = supabaseUrl.replace(/\/$/, "");
  const REDIRECT_URI = `${cleanSupabaseUrl}/functions/v1/airpublisher_youtubeauth`;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // 1. INIT
  if (action === "init") {
    let creator_id = url.searchParams.get("creator_id") || "";
    // Note: userId is already extracted from url.searchParams.get("user_id") near the top
    const state = encodeURIComponent(JSON.stringify({ origin, creator_id, user_id: userId }));
    // 'offline' access type is required to get a refresh_token
    const scope = [
      "https://www.googleapis.com/auth/youtube.readonly",
      "https://www.googleapis.com/auth/youtube.upload",  // Upload videos to user's channel
      "https://www.googleapis.com/auth/yt-analytics.readonly",
      "https://www.googleapis.com/auth/userinfo.email",
      "https://www.googleapis.com/auth/userinfo.profile",
      "openid"
    ].join(" ");

    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${REDIRECT_URI}&response_type=code&scope=${scope}&access_type=offline&prompt=consent&state=${state}`;

    if (url.searchParams.get("redirect") === "false") {
      return new Response(JSON.stringify({ url: authUrl }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    return Response.redirect(authUrl, 302);
  }

  // 2. CALLBACK
  if (action === "callback") {
    if (!code) return new Response("Error: No code received", { status: 400 });

    try {
      // Exchange code for tokens
      const tokenParams = new URLSearchParams();
      tokenParams.set("client_id", clientId);
      tokenParams.set("client_secret", clientSecret);
      tokenParams.set("code", code);
      tokenParams.set("grant_type", "authorization_code");
      tokenParams.set("redirect_uri", REDIRECT_URI);

      const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: tokenParams.toString(),
      });
      const tokenData = await tokenRes.json();

      if (!tokenRes.ok || !tokenData.access_token) {
        throw new Error(`Google Token Error: ${JSON.stringify(tokenData)}`);
      }

      const { access_token, refresh_token, expires_in } = tokenData; // refresh_token might be undefined if not first time
      const expiresAt = new Date(Date.now() + (expires_in || 3600) * 1000);

      // Fetch User Info
      const userRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
        headers: { Authorization: `Bearer ${access_token}` },
      });
      const userInfo = await userRes.json();
      if (!userRes.ok) throw new Error(`User Info Error: ${JSON.stringify(userInfo)}`);

      // Parse State
      let creatorIdFromState = "";
      let userIdFromState = "";
      try {
        const stateObj = JSON.parse(decodeURIComponent(url.searchParams.get("state") || "{}"));
        if (stateObj.origin) origin = stateObj.origin;
        if (stateObj.creator_id) creatorIdFromState = stateObj.creator_id;
        if (stateObj.user_id) userIdFromState = stateObj.user_id;
      } catch { }

      // Upsert User
      const email = userInfo.email;
      if (!email) throw new Error("No email in Google User Info");

      // Fetch YouTube Channel Details specifically
      const channelRes = await fetch("https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true", {
        headers: { Authorization: `Bearer ${access_token}` },
      });
      const channelData = await channelRes.json();

      let channelId = null;
      let handle = null;

      if (channelData.items && channelData.items.length > 0) {
        const ch = channelData.items[0];
        channelId = ch.id;
        // Priority: Custom URL (already has @) -> Channel Title (add @)
        if (ch.snippet.customUrl) {
          handle = ch.snippet.customUrl.startsWith('@') ? ch.snippet.customUrl : `@${ch.snippet.customUrl}`;
        } else {
          const safeTitle = ch.snippet.title.replace(/\s+/g, '');
          handle = `@${safeTitle}`;
        }
      }

      let targetUserId = userIdFromState;

      // If we don't have a userId from state, resolve it by email
      if (!targetUserId) {
        const { data: usersData } = await supabase.auth.admin.listUsers();
        const existingUser = usersData.users.find((u: any) => u.email === email);

        if (existingUser) {
          targetUserId = existingUser.id;

          // CRITICAL: Update existing user's metadata to google provider
          try {
            await supabase.auth.admin.updateUserById(targetUserId, {
              user_metadata: {
                ...(existingUser.user_metadata || {}),
                provider: 'google',
                providers: ['google']
              }
            });
          } catch (updateErr: any) {
            console.error(`⚠️ Failed to update user metadata (non-blocking):`, updateErr?.message);
          }
        } else {
          const { data: createdUser, error: createError } = await supabase.auth.admin.createUser({
            email: email,
            email_confirm: true,
            user_metadata: {
              full_name: userInfo.name,
              avatar_url: userInfo.picture,
              provider: 'google',
              providers: ['google']
            }
          });
          if (createError) throw createError;
          targetUserId = createdUser?.user?.id;
        }
      }

      if (!targetUserId) throw new Error("Failed to resolve User ID");

      // Upsert Tokens with Encryption
      // Try Vault encryption, fallback to raw if unavailable
      let accessTokenId: string | null = null;
      let refreshTokenId: string | null = null;
      let useRawAccessToken = false;
      let useRawRefreshToken = false;

      // Access Token Encryption
      try {
        const { data, error } = await supabase.rpc('create_vault_secret', {
          p_secret: access_token,
          p_name: `youtube_access_${targetUserId}`
        });
        if (!error && data) {
          accessTokenId = data;
          console.log("✅ Access token encrypted via Vault");
        } else {
          console.warn("⚠️ Vault encryption failed for access token:", error?.message);
          useRawAccessToken = true;
        }
      } catch (vaultError) {
        console.warn("⚠️ Vault unavailable for access token:", vaultError);
        useRawAccessToken = true;
      }

      // Refresh Token Encryption
      if (refresh_token) {
        try {
          const { data, error } = await supabase.rpc('create_vault_secret', {
            p_secret: refresh_token,
            p_name: `youtube_refresh_${targetUserId}`
          });
          if (!error && data) {
            refreshTokenId = data;
            console.log("✅ Refresh token encrypted via Vault");
          } else {
            console.warn("⚠️ Vault encryption failed for refresh token:", error?.message);
            useRawRefreshToken = true;
          }
        } catch (vaultError) {
          console.warn("⚠️ Vault unavailable for refresh token:", vaultError);
          useRawRefreshToken = true;
        }
      }

      // 1. Resolve Primary Identifier
      // Prefer the creatorId passed from the frontend state
      let primaryIdentifier = creatorIdFromState;
      if (!primaryIdentifier) {
        const { data: profileLinks } = await supabase
          .from('creator_profiles')
          .select('unique_identifier')
          .eq('user_id', targetUserId);

        primaryIdentifier = profileLinks?.find(p =>
          !p.unique_identifier.startsWith('yt_') &&
          !p.unique_identifier.startsWith('igg_')
        )?.unique_identifier || profileLinks?.[0]?.unique_identifier || `yt_${channelId}`;
      }

      const upsertPayload: any = {
        user_id: targetUserId,
        google_access_token_secret_id: accessTokenId,
        google_access_token: useRawAccessToken ? access_token : null,
        creator_unique_identifier: `yt_${channelId}`,
        expires_at: expiresAt.toISOString(),
        scope: tokenData.scope,
        token_type: tokenData.token_type,
        updated_at: new Date().toISOString()
      };
      if (refreshTokenId) upsertPayload.google_refresh_token_secret_id = refreshTokenId;
      if (refresh_token && useRawRefreshToken) upsertPayload.google_refresh_token = refresh_token;

      if (handle) upsertPayload.handle = handle;
      if (channelId) upsertPayload.channel_id = channelId;

      const { error: upsertError } = await supabase.from("youtube_tokens").upsert(upsertPayload, { onConflict: "user_id" });
      if (upsertError) throw upsertError;

      // 2. Register in the unified connections table
      await supabase.from("airpublisher_connections").upsert({
        user_id: targetUserId,
        primary_identifier: primaryIdentifier,
        platform: 'youtube',
        connection_identifier: `yt_${channelId}`,
        platform_name: channelData.items?.[0]?.snippet?.title || handle,
        platform_avatar_url: channelData.items?.[0]?.snippet?.thumbnails?.default?.url || null,
        updated_at: new Date().toISOString()
      }, { onConflict: "user_id,platform,connection_identifier" });

      console.log(`✅ YouTube auth complete for: yt_${channelId}`);

      // SUCCESS REDIRECT
      // If the user already has a session (we passed userId from state), we can simply redirect back.
      // If we need to establish a session, magic link is the only way, but it fails on unknown origins.
      // Since Air Publisher relies on creatorId which we've now saved, a direct redirect is safer.
      const successUrl = new URL(origin);
      successUrl.searchParams.set('success', 'youtube_connected');

      // If we established a NEW user, we might still want to try magic link, 
      // but only if we trust the redirect URI is allowed.
      // For now, let's prioritize the direct redirect back to wherever they came from.
      return Response.redirect(successUrl.toString(), 302);

    } catch (e) {
      console.error("YouTube Logic Error:", e);
      const errorUrl = new URL(origin);
      errorUrl.searchParams.set('error', (e as Error).message);
      return Response.redirect(errorUrl.toString(), 302);
    }
  }

  // 3. STATUS
  if (action === "status") {
    // Authenticate request (expecting Supabase User JWT)
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return new Response(JSON.stringify({ error: "Missing Auth" }), { status: 401 });

    const { data: { user }, error: userErr } = await supabase.auth.getUser(authHeader.replace("Bearer ", ""));
    if (userErr || !user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });

    const { data } = await supabase.from("youtube_tokens").select("user_id, channel_id, handle").eq("user_id", user.id).maybeSingle();
    return new Response(JSON.stringify({ connected: !!data, channel_id: data?.channel_id, handle: data?.handle }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  // 4. DISCONNECT
  if (action === "disconnect") {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return new Response(JSON.stringify({ error: "Missing Auth" }), { status: 401 });
    const { data: { user } } = await supabase.auth.getUser(authHeader.replace("Bearer ", ""));
    if (!user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });

    const { data: row } = await supabase.from("youtube_tokens").select("google_access_token_secret_id").eq("user_id", user.id).maybeSingle();
    if (row?.google_access_token_secret_id) {
      try {
        // Decrypt
        const { data: accessToken } = await supabase.rpc('get_decrypted_secret', { p_secret_id: row.google_access_token_secret_id });
        if (accessToken) {
          await fetch(`https://oauth2.googleapis.com/revoke?token=${accessToken}`, { method: "POST" });
        }
      } catch { }
    }
    await supabase.from("youtube_tokens").delete().eq("user_id", user.id);
    await supabase.from("airpublisher_connections").delete().eq("user_id", user.id).eq("platform", "youtube");
    return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  return new Response(JSON.stringify({ error: "Invalid Action" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
});
