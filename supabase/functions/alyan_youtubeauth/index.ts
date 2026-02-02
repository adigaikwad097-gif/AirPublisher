// @ts-ignore
declare const Deno: any;

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const DEFAULT_ORIGIN = Deno.env.get("FRONTEND_URL") || Deno.env.get("NEXT_PUBLIC_APP_URL") || "http://aircreator.cloud:3003";

serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  // Allow anonymous access for OAuth flows (init and callback actions)
  // Supabase Edge Functions require auth by default, but we need public access for OAuth redirects
  const url = new URL(req.url);
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
    } catch (e) {
      // ignore JSON parse error for empty body
    }
  }

  if (!action && code) action = "callback";

  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  const clientId = (Deno.env.get("GOOGLE_CLIENT_ID_ALYAN") || Deno.env.get("GOOGLE_OAUTH_CLIENT_ID") || Deno.env.get("GOOGLE_CLIENT_ID")) ?? "";
  const clientSecret = (Deno.env.get("GOOGLE_CLIENT_SECRET_ALYAN") || Deno.env.get("GOOGLE_OAUTH_CLIENT_SECRET") || Deno.env.get("GOOGLE_CLIENT_SECRET")) ?? "";

  console.log('[alyan_youtubeauth] Environment check:', {
    hasSupabaseUrl: !!supabaseUrl,
    hasServiceKey: !!supabaseServiceKey,
    hasClientId: !!clientId,
    hasClientSecret: !!clientSecret,
    clientIdLength: clientId?.length || 0,
    clientSecretLength: clientSecret?.length || 0,
  });

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('[alyan_youtubeauth] Missing Supabase configuration');
    return new Response(JSON.stringify({ error: "Missing Supabase configuration" }), { 
      status: 500, 
      headers: { ...corsHeaders, "Content-Type": "application/json" } 
    });
  }

  if (!clientId || !clientSecret) {
    console.error('[alyan_youtubeauth] Missing OAuth credentials:', {
      hasGOOGLE_CLIENT_ID_ALYAN: !!Deno.env.get("GOOGLE_CLIENT_ID_ALYAN"),
      hasGOOGLE_OAUTH_CLIENT_ID: !!Deno.env.get("GOOGLE_OAUTH_CLIENT_ID"),
      hasGOOGLE_CLIENT_ID: !!Deno.env.get("GOOGLE_CLIENT_ID"),
      hasGOOGLE_CLIENT_SECRET_ALYAN: !!Deno.env.get("GOOGLE_CLIENT_SECRET_ALYAN"),
      hasGOOGLE_OAUTH_CLIENT_SECRET: !!Deno.env.get("GOOGLE_OAUTH_CLIENT_SECRET"),
      hasGOOGLE_CLIENT_SECRET: !!Deno.env.get("GOOGLE_CLIENT_SECRET"),
    });
    return new Response(JSON.stringify({ 
      error: "YouTube OAuth not configured. Please set GOOGLE_CLIENT_ID_ALYAN (or GOOGLE_OAUTH_CLIENT_ID or GOOGLE_CLIENT_ID) and GOOGLE_CLIENT_SECRET_ALYAN (or GOOGLE_OAUTH_CLIENT_SECRET or GOOGLE_CLIENT_SECRET) in Supabase Edge Function secrets." 
    }), { 
      status: 500, 
      headers: { ...corsHeaders, "Content-Type": "application/json" } 
    });
  }

  const cleanSupabaseUrl = supabaseUrl.replace(/\/$/, "");
  const REDIRECT_URI = `${cleanSupabaseUrl}/functions/v1/alyan_youtubeauth`;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // 1. INIT
  if (action === "init") {
    const state = JSON.stringify({ origin }); // Will be encoded in URL
    // 'offline' access type is required to get a refresh_token
    const scope = [
      "https://www.googleapis.com/auth/youtube.readonly",
      "https://www.googleapis.com/auth/yt-analytics.readonly",
      "https://www.googleapis.com/auth/userinfo.email",
      "https://www.googleapis.com/auth/userinfo.profile",
      "openid"
    ].join(" ");

    // Build OAuth URL with proper URL encoding
    const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    authUrl.searchParams.set('client_id', clientId);
    authUrl.searchParams.set('redirect_uri', REDIRECT_URI); // URLSearchParams automatically encodes
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('scope', scope);
    authUrl.searchParams.set('access_type', 'offline');
    authUrl.searchParams.set('state', state); // URLSearchParams will encode it

    if (url.searchParams.get("redirect") === "false") {
      return new Response(JSON.stringify({ url: authUrl.toString() }), { 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      });
    }
    return Response.redirect(authUrl.toString(), 302);
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

      const { access_token, refresh_token, expires_in } = tokenData;
      const expiresAt = new Date(Date.now() + (expires_in || 3600) * 1000);

      // Fetch User Info
      const userRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
        headers: { Authorization: `Bearer ${access_token}` },
      });
      const userInfo = await userRes.json();
      if (!userRes.ok) throw new Error(`User Info Error: ${JSON.stringify(userInfo)}`);

      // Parse State
      try {
        const stateObj = JSON.parse(decodeURIComponent(url.searchParams.get("state") || "{}"));
        if (stateObj.origin) origin = stateObj.origin;
      } catch { }

      // Upsert User
      const email = userInfo.email;
      if (!email) throw new Error("No email in Google User Info");

      // Fetch YouTube Channel Details
      const channelRes = await fetch("https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true", {
        headers: { Authorization: `Bearer ${access_token}` },
      });
      const channelData = await channelRes.json();

      let channelId: string | null = null;
      let handle: string | null = null;

      if (channelData.items && channelData.items.length > 0) {
        const ch = channelData.items[0];
        channelId = ch.id;
        if (ch.snippet.customUrl) {
          handle = ch.snippet.customUrl.startsWith('@') ? ch.snippet.customUrl : `@${ch.snippet.customUrl}`;
        } else {
          const safeTitle = ch.snippet.title.replace(/\s+/g, '');
          handle = `@${safeTitle}`;
        }
      }

      let targetUserId: string | undefined;
      const { data: usersData } = await supabase.auth.admin.listUsers();
      const existingUser = usersData.users.find((u: any) => u.email === email);

      if (existingUser) {
        targetUserId = existingUser.id;
        // Update existing user's metadata to google provider
        try {
          await supabase.auth.admin.updateUserById(targetUserId, {
            user_metadata: {
              ...(existingUser.user_metadata || {}),
              provider: 'google',
              providers: ['google']
            }
          });
          console.log(`✅ Updated existing user metadata to google provider`);
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

      if (!targetUserId) throw new Error("Failed to resolve User ID");

      // Upsert Tokens with Encryption
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

      const upsertPayload: any = {
        user_id: targetUserId,
        google_access_token_secret_id: accessTokenId,
        google_access_token: useRawAccessToken ? access_token : null,
        expires_at: expiresAt.toISOString(),
        scope: tokenData.scope,
        token_type: tokenData.token_type,
        updated_at: new Date().toISOString()
      };
      if (refreshTokenId) upsertPayload.google_refresh_token_secret_id = refreshTokenId;
      if (refresh_token) upsertPayload.google_refresh_token = useRawRefreshToken ? refresh_token : null;

      if (handle) upsertPayload.handle = handle;
      if (channelId) upsertPayload.channel_id = channelId;

      // Try new table first, fallback to old table
      let tableName = 'airpublisher_youtube_tokens';
      const { error: tableCheckError } = await supabase
        .from(tableName)
        .select('id')
        .limit(1);

      if (tableCheckError && tableCheckError.code === '42P01') {
        tableName = 'youtube_tokens';
      }

      // Get or create creator_unique_identifier
      let creatorUniqueIdentifier: string | null = null;
      const { data: creatorProfile } = await supabase
        .from('airpublisher_creator_profiles')
        .select('unique_identifier')
        .eq('user_id', targetUserId)
        .maybeSingle();

      if (creatorProfile?.unique_identifier) {
        creatorUniqueIdentifier = creatorProfile.unique_identifier;
      } else {
        // Try to create a creator profile if it doesn't exist
        // Generate a unique identifier based on user_id
        creatorUniqueIdentifier = `creator_${targetUserId.substring(0, 8)}_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
        try {
          const { error: createProfileError } = await supabase
            .from('airpublisher_creator_profiles')
            .insert({
              user_id: targetUserId,
              unique_identifier: creatorUniqueIdentifier,
              display_name: userInfo.name || 'Creator',
            });
          if (createProfileError) {
            console.warn('Failed to create creator profile, using generated ID:', createProfileError);
          }
        } catch (e) {
          console.warn('Error creating creator profile:', e);
        }
      }

      if (tableName === 'airpublisher_youtube_tokens') {
        if (creatorUniqueIdentifier) {
          upsertPayload.creator_unique_identifier = creatorUniqueIdentifier;
        }
        // Check if record exists by user_id or creator_unique_identifier
        const { data: existing } = await supabase
          .from(tableName)
          .select('id, creator_unique_identifier')
          .or(`user_id.eq.${targetUserId}${creatorUniqueIdentifier ? `,creator_unique_identifier.eq.${creatorUniqueIdentifier}` : ''}`)
          .maybeSingle();
        
        if (existing) {
          const { error: updateError } = await supabase
            .from(tableName)
            .update(upsertPayload)
            .eq('id', existing.id);
          if (updateError) throw updateError;
        } else {
          const { error: insertError } = await supabase
            .from(tableName)
            .insert(upsertPayload);
          if (insertError) throw insertError;
        }
      } else {
        // Old table - use user_id
        const { error: upsertError } = await supabase
          .from(tableName)
          .upsert(upsertPayload, { onConflict: 'user_id' });
        if (upsertError) throw upsertError;
      }

      console.log(`✅ YouTube auth complete for: yt_${channelId}`);

      // Magic Link Login
      const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
        type: 'magiclink',
        email: email,
        options: { redirectTo: origin }
      });
      if (linkError || !linkData?.properties?.action_link) throw linkError;

      return Response.redirect(linkData.properties.action_link, 302);

    } catch (e) {
      console.error("YouTube Logic Error:", e);
      return Response.redirect(`${origin}?error=${encodeURIComponent((e as Error).message)}`, 302);
    }
  }

  // 3. STATUS
  if (action === "status") {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return new Response(JSON.stringify({ error: "Missing Auth" }), { status: 401 });

    const { data: { user }, error: userErr } = await supabase.auth.getUser(authHeader.replace("Bearer ", ""));
    if (userErr || !user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });

    // Try new table first
    let { data } = await supabase
      .from("airpublisher_youtube_tokens")
      .select("user_id, channel_id, handle, creator_unique_identifier")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!data) {
      // Fallback to old table
      const { data: oldData } = await supabase
        .from("youtube_tokens")
        .select("user_id, channel_id, handle")
        .eq("user_id", user.id)
        .maybeSingle();
      data = oldData;
    }

    return new Response(JSON.stringify({ 
      connected: !!data, 
      channel_id: data?.channel_id, 
      handle: data?.handle 
    }), { 
      headers: { ...corsHeaders, "Content-Type": "application/json" } 
    });
  }

  // 4. DISCONNECT
  if (action === "disconnect") {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return new Response(JSON.stringify({ error: "Missing Auth" }), { status: 401 });
    const { data: { user } } = await supabase.auth.getUser(authHeader.replace("Bearer ", ""));
    if (!user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });

    // Try new table first
    let { data: row } = await supabase
      .from("airpublisher_youtube_tokens")
      .select("google_access_token_secret_id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!row) {
      const { data: oldRow } = await supabase
        .from("youtube_tokens")
        .select("google_access_token_secret_id")
        .eq("user_id", user.id)
        .maybeSingle();
      row = oldRow;
    }

    if (row?.google_access_token_secret_id) {
      try {
        const { data: accessToken } = await supabase.rpc('get_decrypted_secret', { 
          p_secret_id: row.google_access_token_secret_id 
        });
        if (accessToken) {
          await fetch(`https://oauth2.googleapis.com/revoke?token=${accessToken}`, { method: "POST" });
        }
      } catch { }
    }

    // Delete from both tables
    await supabase.from("airpublisher_youtube_tokens").delete().eq("user_id", user.id);
    await supabase.from("youtube_tokens").delete().eq("user_id", user.id);

    return new Response(JSON.stringify({ success: true }), { 
      headers: { ...corsHeaders, "Content-Type": "application/json" } 
    });
  }

  return new Response(JSON.stringify({ error: "Invalid Action" }), { 
    status: 400, 
    headers: { ...corsHeaders, "Content-Type": "application/json" } 
  });
});

