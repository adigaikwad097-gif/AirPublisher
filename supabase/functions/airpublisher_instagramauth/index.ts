// @ts-ignore
declare const Deno: any;

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.1";
import { corsHeaders } from "../_shared/cors.ts";
import { AUTOMATION_WEBHOOK_URL, FRONTEND_URL } from "../_shared/constants.ts";

const DEFAULT_ORIGIN = FRONTEND_URL;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const url = new URL(req.url);
  let action = url.searchParams.get('action');
  let origin = url.searchParams.get('origin') || DEFAULT_ORIGIN;
  let code = url.searchParams.get('code');
  let userId = url.searchParams.get('user_id');

  if (req.method === 'POST') {
    try {
      const body = await req.json();
      if (body.action) action = body.action;
      if (body.origin) origin = body.origin;
      if (body.code) code = body.code;
      if (body.user_id) userId = body.user_id;
    } catch (e) {
      // ignore
    }
  }

  if (!action && code) {
    action = 'callback';
  }

  const clientId = Deno.env.get('INSTAGRAM_APP_ID_PUBLISHER') || Deno.env.get('INSTAGRAM_CLIENT_ID') || "";
  const clientSecret = Deno.env.get('INSTAGRAM_APP_SECRET_PUBLISHER') || Deno.env.get('INSTAGRAM_CLIENT_SECRET') || "";
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

  if (!supabaseUrl || !supabaseServiceKey) {
    return new Response(JSON.stringify({ error: "Missing Supabase configuration" }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  const cleanSupabaseUrl = supabaseUrl.replace(/\/$/, "");
  const REDIRECT_URI = `${cleanSupabaseUrl}/functions/v1/airpublisher_instagramauth`;

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // 1. INIT
  if (action === 'init') {
    if (!clientId) {
      return new Response(JSON.stringify({ error: "Missing Instagram Client ID" }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const scopes = [
      'instagram_business_basic',
      'instagram_business_manage_messages',
      'instagram_business_manage_comments',
      'instagram_business_content_publish',
      'instagram_business_manage_insights'
    ].join(',');

    const creator_id = url.searchParams.get("creator_id") || "";
    const state = encodeURIComponent(JSON.stringify({ origin, creator_id, user_id: userId }));
    const authUrl = `https://www.instagram.com/oauth/authorize?enable_fb_login=0&force_authentication=1&client_id=${clientId}&redirect_uri=${REDIRECT_URI}&response_type=code&scope=${scopes}&state=${state}`;

    // Handle fetch-based flow (avoids 401 on redirect)
    if (url.searchParams.get('redirect') === 'false') {
      return new Response(JSON.stringify({ url: authUrl }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    return Response.redirect(authUrl, 302);
  }

  // 2. CALLBACK
  if (action === 'callback') {
    if (!clientId || !clientSecret) {
      return new Response("Missing Instagram credentials", { status: 500 });
    }
    if (!code) {
      return new Response("Error: No code received. Please try again.", { status: 400 });
    }

    try {
      const form = new FormData();
      form.append('client_id', clientId);
      form.append('client_secret', clientSecret);
      form.append('grant_type', 'authorization_code');
      form.append('redirect_uri', REDIRECT_URI);
      form.append('code', code);

      const tokenRes = await fetch('https://api.instagram.com/oauth/access_token', {
        method: 'POST',
        body: form,
      });

      const tokenData = await tokenRes.json();
      if (tokenData.error_type || !tokenData.access_token) {
        throw new Error(`Instagram Token Error: ${JSON.stringify(tokenData)}`);
      }

      const shortLivedToken = tokenData.access_token;

      const longTokenRes = await fetch(
        `https://graph.instagram.com/access_token?grant_type=ig_exchange_token&client_secret=${clientSecret}&access_token=${shortLivedToken}`
      );
      const longTokenData = await longTokenRes.json();

      if (longTokenData.error || !longTokenData.access_token) {
        throw new Error(`Token Exchange Error: ${JSON.stringify(longTokenData)}`);
      }

      const accessToken = longTokenData.access_token;
      const expiresIn = longTokenData.expires_in || 5184000;
      const expiresAt = new Date(Date.now() + (expiresIn * 1000));

      const userRes = await fetch(
        `https://graph.instagram.com/me?fields=id,username,account_type&access_token=${accessToken}`
      );
      const userData = await userRes.json();

      if (userData.error) {
        throw new Error(`User Info Error: ${JSON.stringify(userData.error)}`);
      }

      let creatorIdFromState = "";
      let userIdFromState = "";
      try {
        const stateObj = JSON.parse(decodeURIComponent(url.searchParams.get('state') || '{}'));
        if (stateObj.origin) origin = stateObj.origin;
        if (stateObj.creator_id) creatorIdFromState = stateObj.creator_id;
        if (stateObj.user_id) userIdFromState = stateObj.user_id;
      } catch (e) {
        console.error('Error parsing state', e);
      }

      const email = `${userData.username}@instagram.placeholder`;
      let targetUserId: string | undefined;

      console.log(`========== INSTAGRAM AUTH DEBUG ==========`);
      console.log(`🔍 Instagram User Data: ${JSON.stringify(userData)}`);
      console.log(`🔍 Generated Email: ${email}`);
      console.log(`🔍 Supabase URL: ${supabaseUrl}`);
      console.log(`🔍 Service Key Present: ${!!supabaseServiceKey}`);

      // Try to create user first
      console.log(`🔍 Calling supabase.auth.admin.createUser...`);

      let createdUser: any = null;
      let createError: any = null;

      try {
        const result = await supabase.auth.admin.createUser({
          email: email,
          email_confirm: true,
          user_metadata: {
            full_name: userData.username,
            avatar_url: '',
            provider: 'instagram',
            providers: ['instagram'],
            instagram_id: userData.id
          }
        });
        createdUser = result.data;
        createError = result.error;
        console.log(`🔍 createUser RAW result: ${JSON.stringify(result)}`);
      } catch (createException: any) {
        console.log(`❌ createUser THREW EXCEPTION: ${createException.message}`);
        console.log(`❌ Exception stack: ${createException.stack}`);
        createError = { message: createException.message, code: 'EXCEPTION' };
      }

      console.log(`🔍 createdUser: ${JSON.stringify(createdUser)}`);
      console.log(`🔍 createError: ${JSON.stringify(createError)}`);
      console.log(`🔍 createdUser?.user exists: ${!!createdUser?.user}`);

      if (createdUser?.user) {
        targetUserId = createdUser.user.id;
        console.log(`✅ SUCCESS: Created new user: ${targetUserId}`);
      } else if (createError) {
        // User likely exists - try to find them by email
        console.log(`⚠️ createUser FAILED: ${createError.message} (code: ${createError.code || 'N/A'}, status: ${createError.status || 'N/A'})`);


        // Use listUsers with filter - more reliable than iterating all
        const { data: usersData, error: listError } = await supabase.auth.admin.listUsers({
          page: 1,
          perPage: 1000
        });

        console.log(`🔍 DEBUG: listUsers returned ${usersData?.users?.length || 0} users, error: ${listError?.message || 'none'}`);

        if (!listError && usersData?.users) {
          const existingUser = usersData.users.find((u: any) => u.email === email);
          if (existingUser) {
            targetUserId = existingUser.id;
            console.log(`✅ Found existing user by email: ${targetUserId}`);
          } else {
            console.log(`🔍 DEBUG: User not found by email, trying instagram_id in metadata...`);
            // Try searching by instagram_id in metadata as fallback
            const userByMeta = usersData.users.find((u: any) =>
              u.user_metadata?.instagram_id === userData.id
            );
            if (userByMeta) {
              targetUserId = userByMeta.id;
              console.log(`✅ Found existing user by instagram_id: ${targetUserId}`);
            } else {
              console.log(`🔍 DEBUG: User not found by instagram_id in metadata either`);
            }
          }
        } else {
          console.log(`❌ DEBUG: listUsers failed or returned no users`);
        }

        // Last resort: check if there's already a token entry with this instagram_id
        if (!targetUserId) {
          console.log(`🔍 DEBUG: Checking instagram_tokens table for existing entry...`);
          const { data: existingToken, error: tokenError } = await supabase
            .from('instagram_tokens')
            .select('user_id')
            .eq('instagram_id', userData.id)
            .maybeSingle();

          console.log(`🔍 DEBUG: instagram_tokens lookup - data: ${JSON.stringify(existingToken)}, error: ${tokenError?.message || 'none'}`);

          if (existingToken?.user_id) {
            targetUserId = existingToken.user_id;
            console.log(`✅ Found existing user via instagram_tokens: ${targetUserId}`);
          } else {
            console.log(`❌ DEBUG: No existing token found for instagram_id: ${userData.id}`);
          }
        }
      } else {
        console.log(`❌ DEBUG: createUser returned neither user nor error - unexpected state`);
      }

      // CRITICAL: If we found an existing user, update their metadata to instagram provider
      // This ensures proper detection in the frontend (fixes issue when user previously used another platform)
      if (targetUserId && !createdUser?.user) {
        try {
          const { data: usersData } = await supabase.auth.admin.listUsers();
          const existingUser = usersData.users.find((u: any) => u.id === targetUserId);
          if (existingUser) {
            await supabase.auth.admin.updateUserById(targetUserId, {
              user_metadata: {
                ...(existingUser.user_metadata || {}),
                provider: 'instagram',
                providers: ['instagram'],
                instagram_id: userData.id
              }
            });
            console.log(`✅ Updated existing user metadata to instagram provider`);
          }
        } catch (updateErr: any) {
          console.error(`⚠️ Failed to update user metadata (non-blocking):`, updateErr?.message);
        }
      }

      console.log(`🔍 DEBUG: Final targetUserId: ${targetUserId || 'UNDEFINED - will fail'}`);


      if (targetUserId) {
        // Try Vault encryption first, fallback to raw if unavailable
        let atId: string | null = null;
        let useRawToken = false;

        try {
          const { data, error } = await supabase.rpc('create_vault_secret', {
            p_secret: accessToken,
            p_name: `instagram_access_${targetUserId}`
          });

          if (!error && data) {
            atId = data;
            console.log("✅ Token encrypted via Vault");
          } else {
            console.warn("⚠️ Vault encryption failed, using raw token storage:", error?.message);
            useRawToken = true;
          }
        } catch (vaultError) {
          console.warn("⚠️ Vault unavailable, using raw token storage:", vaultError);
          useRawToken = true;
        }

        await supabase.from('instagram_tokens').upsert({
          user_id: targetUserId,
          instagram_id: userData.id,
          access_token_secret_id: atId,
          access_token: useRawToken ? accessToken : null, // Raw fallback
          creator_unique_identifier: `igb_${userData.id}`,
          username: userData.username,
          expires_at: expiresAt.toISOString(),
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' });

        // Register in the unified connections table
        const primaryIdentifier = creatorIdFromState || `igb_${userData.id}`;
        await supabase.from("airpublisher_connections").upsert({
          user_id: targetUserId,
          primary_identifier: primaryIdentifier,
          platform: 'instagram',
          connection_identifier: `igb_${userData.id}`,
          platform_name: userData.username,
          updated_at: new Date().toISOString()
        }, { onConflict: "user_id,platform,connection_identifier" });

        console.log(`✅ Instagram Basic auth complete for: igb_${userData.id}`);
      } else {
        return Response.redirect(`${origin}?error=user_creation_failed`, 302);
      }

      // Direct redirect back to origin (no magic link needed — AirPublisher uses creator_id cookies, not Supabase Auth sessions)
      const successUrl = new URL(origin);
      successUrl.searchParams.set('success', 'instagram_connected');
      return Response.redirect(successUrl.toString(), 302);

    } catch (err) {
      console.error("Instagram Auth Error:", err);
      return Response.redirect(`${origin}?error=${encodeURIComponent(err.message)}`, 302);
    }
  }

  // 3. STATUS CHECK
  if (action === 'status') {
    if (!userId) {
      return new Response(JSON.stringify({ connected: false }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const { data: tokenData } = await supabase
      .from('instagram_tokens')
      .select('username, instagram_id')
      .eq('user_id', userId)
      .single();

    if (!tokenData) {
      return new Response(JSON.stringify({ connected: false }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({
      connected: true,
      username: tokenData.username,
      instagram_id: tokenData.instagram_id
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  // 4. DISCONNECT
  if (action === 'disconnect') {
    if (!userId) {
      return new Response(JSON.stringify({ error: "Missing user_id" }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const { data: row } = await supabase
      .from('instagram_tokens')
      .select('access_token_secret_id, instagram_id')
      .eq('user_id', userId)
      .maybeSingle();

    if (row?.access_token_secret_id && row?.instagram_id) {
      try {
        const { data: accessToken } = await supabase.rpc('get_decrypted_secret', { p_secret_id: row.access_token_secret_id });
        if (accessToken) {
          // Revoke permissions
          await fetch(
            `https://graph.facebook.com/${row.instagram_id}/permissions?access_token=${accessToken}`,
            { method: 'DELETE' }
          );
        }
      } catch (e) {
        console.error("Instagram revocation failed:", e);
      }
    }

    const { error } = await supabase
      .from('instagram_tokens')
      .delete()
      .eq('user_id', userId);

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({
      success: true,
      message: "Instagram account disconnected successfully"
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  // 5. FETCH MEDIA (NO RATE LIMITING)
  if (action === 'fetch_media') {
    if (!userId) {
      return new Response(JSON.stringify({ error: "Missing user_id" }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const { data: tokenData, error } = await supabase
      .from('instagram_tokens')
      .select('access_token_secret_id, instagram_id, expires_at')
      .eq('user_id', userId)
      .single();

    if (error || !tokenData) {
      return new Response(JSON.stringify({ error: "No Instagram connection found" }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Decrypt Access Token
    let { data: accessToken } = await supabase.rpc('get_decrypted_secret', { p_secret_id: tokenData.access_token_secret_id });
    if (!accessToken) {
      return new Response(JSON.stringify({ error: "Token decryption failed" }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Auto-refresh if expiring within 7 days
    const now = new Date();
    const expiresAt = new Date(tokenData.expires_at);
    const daysUntilExpiry = (expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);

    if (daysUntilExpiry < 7) {
      try {
        const refreshRes = await fetch(
          `https://graph.instagram.com/refresh_access_token?grant_type=ig_refresh_token&access_token=${accessToken}`
        );

        const refreshData = await refreshRes.json();

        if (!refreshData.error && refreshData.access_token) {
          const newExpiresIn = refreshData.expires_in || 5184000;
          const newExpiresAt = new Date(Date.now() + (newExpiresIn * 1000));

          // Encrypt new token
          const { data: newAtId } = await supabase.rpc('create_vault_secret', {
            p_secret: refreshData.access_token,
            p_name: `instagram_access_${userId}`
          });

          await supabase.from('instagram_tokens').update({
            access_token_secret_id: newAtId,
            expires_at: newExpiresAt.toISOString(),
            updated_at: new Date().toISOString()
          }).eq('user_id', userId);

          accessToken = refreshData.access_token;
        }
      } catch (refreshError) {
        // Continue with current token if refresh fails
      }
    }

    try {
      const businessAccountId = tokenData.instagram_id;

      // Fetch media with pagination (get 100 posts)
      let allMedia: any[] = [];
      let nextUrl = `https://graph.instagram.com/${businessAccountId}/media?fields=id,caption,media_type,media_url,thumbnail_url,timestamp,permalink,media_product_type&access_token=${accessToken}&limit=25`;

      for (let i = 0; i < 4; i++) {
        const mediaRes = await fetch(nextUrl);
        const mediaData = await mediaRes.json();

        if (mediaData.error) {
          throw new Error(`Instagram API Error: ${mediaData.error.message}`);
        }

        if (mediaData.data && mediaData.data.length > 0) {
          allMedia.push(...mediaData.data);
        }

        if (mediaData.paging && mediaData.paging.next) {
          nextUrl = mediaData.paging.next;
        } else {
          break;
        }
      }

      // Fetch insights (views) for each video
      const mediaWithViews = await Promise.all(
        allMedia.map(async (item) => {
          if (item.media_type === 'VIDEO' || item.media_product_type === 'REELS') {
            try {
              const insightsRes = await fetch(
                `https://graph.instagram.com/${item.id}/insights?metric=impressions,reach,plays&access_token=${accessToken}`
              );
              const insightsData = await insightsRes.json();

              const plays = insightsData.data?.find((metric: any) => metric.name === 'plays');
              const viewCount = plays?.values?.[0]?.value || 0;

              return { ...item, view_count: viewCount, duration: 0 };
            } catch (e) {
              return { ...item, view_count: 0, duration: 0 };
            }
          }
          return { ...item, view_count: 0, duration: 0 };
        })
      );

      // Sort by views and take top 25
      const sortedByViews = mediaWithViews
        .sort((a, b) => b.view_count - a.view_count)
        .slice(0, 25);

      return new Response(JSON.stringify({
        success: true,
        total_fetched: allMedia.length,
        returned: sortedByViews.length,
        data: sortedByViews
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });

    } catch (e) {
      return new Response(JSON.stringify({ error: e.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
  }

  return new Response(JSON.stringify({ error: "Not Found", action: action, url: req.url }), {
    status: 404,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
});
