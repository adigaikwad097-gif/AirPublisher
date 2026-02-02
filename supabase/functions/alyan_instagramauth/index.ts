// @ts-ignore
declare const Deno: any;

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const DEFAULT_ORIGIN = Deno.env.get("FRONTEND_URL") || Deno.env.get("NEXT_PUBLIC_APP_URL") || "http://aircreator.cloud:3003";

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

  const clientId = Deno.env.get('INSTAGRAM_APP_ID_ALYAN') || Deno.env.get('INSTAGRAM_CLIENT_ID') || Deno.env.get('INSTAGRAM_APP_ID') || "";
  const clientSecret = Deno.env.get('INSTAGRAM_APP_SECRET_ALYAN') || Deno.env.get('INSTAGRAM_CLIENT_SECRET') || Deno.env.get('INSTAGRAM_APP_SECRET') || "";
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

  console.log('[alyan_instagramauth] Environment check:', {
    hasSupabaseUrl: !!supabaseUrl,
    hasServiceKey: !!supabaseServiceKey,
    hasClientId: !!clientId,
    hasClientSecret: !!clientSecret,
    clientIdLength: clientId?.length || 0,
    clientSecretLength: clientSecret?.length || 0,
  });

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('[alyan_instagramauth] Missing Supabase configuration');
    return new Response(JSON.stringify({ error: "Missing Supabase configuration" }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  const cleanSupabaseUrl = supabaseUrl.replace(/\/$/, "");
  const REDIRECT_URI = `${cleanSupabaseUrl}/functions/v1/alyan_instagramauth`;

  console.log('[alyan_instagramauth] Redirect URI:', REDIRECT_URI);

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // 1. INIT
  if (action === 'init') {
    if (!clientId) {
      console.error('[alyan_instagramauth] Missing Instagram Client ID');
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

    const state = JSON.stringify({ origin });
    // Build OAuth URL - Instagram requires redirect_uri to be URL encoded
    const authUrl = new URL('https://www.instagram.com/oauth/authorize');
    authUrl.searchParams.set('enable_fb_login', '0');
    authUrl.searchParams.set('force_authentication', '1');
    authUrl.searchParams.set('client_id', clientId);
    authUrl.searchParams.set('redirect_uri', REDIRECT_URI); // URLSearchParams automatically encodes
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('scope', scopes);
    authUrl.searchParams.set('state', state); // URLSearchParams will encode it

    if (url.searchParams.get('redirect') === 'false') {
      return new Response(JSON.stringify({ url: authUrl.toString() }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    return Response.redirect(authUrl.toString(), 302);
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

      try {
        const stateObj = JSON.parse(decodeURIComponent(url.searchParams.get('state') || '{}'));
        if (stateObj.origin) origin = stateObj.origin;
      } catch (e) {
        console.error('Error parsing state', e);
      }

      const email = `${userData.username}@instagram.placeholder`;
      let targetUserId: string | undefined;

      console.log(`========== INSTAGRAM AUTH DEBUG ==========`);
      console.log(`🔍 Instagram User Data: ${JSON.stringify(userData)}`);
      console.log(`🔍 Generated Email: ${email}`);

      // Try to create user first
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
      } catch (createException: any) {
        createError = { message: createException.message, code: 'EXCEPTION' };
      }

      if (createdUser?.user) {
        targetUserId = createdUser.user.id;
        console.log(`✅ SUCCESS: Created new user: ${targetUserId}`);
      } else if (createError) {
        // User likely exists - try to find them by email
        const { data: usersData, error: listError } = await supabase.auth.admin.listUsers({
          page: 1,
          perPage: 1000
        });

        if (!listError && usersData?.users) {
          const existingUser = usersData.users.find((u: any) => u.email === email);
          if (existingUser) {
            targetUserId = existingUser.id;
            console.log(`✅ Found existing user by email: ${targetUserId}`);
          } else {
            // Try searching by instagram_id in metadata
            const userByMeta = usersData.users.find((u: any) =>
              u.user_metadata?.instagram_id === userData.id
            );
            if (userByMeta) {
              targetUserId = userByMeta.id;
              console.log(`✅ Found existing user by instagram_id: ${targetUserId}`);
            }
          }
        }

        // Last resort: check instagram_tokens table
        if (!targetUserId) {
          const { data: existingToken } = await supabase
            .from('instagram_tokens')
            .select('user_id')
            .eq('instagram_id', userData.id)
            .maybeSingle();

          if (existingToken?.user_id) {
            targetUserId = existingToken.user_id;
            console.log(`✅ Found existing user via instagram_tokens: ${targetUserId}`);
          }
        }
      }

      // Update existing user metadata if found
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
          creatorUniqueIdentifier = `creator_${targetUserId.substring(0, 8)}_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
          try {
            const { error: createProfileError } = await supabase
              .from('airpublisher_creator_profiles')
              .insert({
                user_id: targetUserId,
                unique_identifier: creatorUniqueIdentifier,
                display_name: userData.username || 'Creator',
              });
            if (createProfileError) {
              console.warn('Failed to create creator profile, using generated ID:', createProfileError);
            }
          } catch (e) {
            console.warn('Error creating creator profile:', e);
          }
        }

        // Try new table first
        let tokenRecord: any = {
          user_id: targetUserId,
          instagram_id: userData.id,
          access_token_secret_id: atId,
          access_token: useRawToken ? accessToken : null,
          facebook_access_token: useRawToken ? accessToken : null, // Required field for new table
          instagram_access_token: useRawToken ? accessToken : null,
          username: userData.username,
          expires_at: expiresAt.toISOString(),
          updated_at: new Date().toISOString(),
          account_type: 'BUSINESS'
        };

        if (creatorUniqueIdentifier) {
          tokenRecord.creator_unique_identifier = creatorUniqueIdentifier;
        }

        // Check if new table exists
        const { error: tableCheckError } = await supabase
          .from('airpublisher_instagram_tokens')
          .select('id')
          .limit(1);

        if (tableCheckError && tableCheckError.code === '42P01') {
          // New table doesn't exist, use old table
          const oldTokenRecord: any = {
            user_id: targetUserId,
            instagram_id: userData.id,
            access_token_secret_id: atId,
            access_token: useRawToken ? accessToken : null,
            username: userData.username,
            expires_at: expiresAt.toISOString(),
            updated_at: new Date().toISOString()
          };
          await supabase.from('instagram_tokens').upsert(oldTokenRecord, { onConflict: 'user_id' });
        } else {
          // Check if record exists
          const { data: existing } = await supabase
            .from('airpublisher_instagram_tokens')
            .select('id, creator_unique_identifier')
            .or(`user_id.eq.${targetUserId}${creatorUniqueIdentifier ? `,creator_unique_identifier.eq.${creatorUniqueIdentifier}` : ''}`)
            .maybeSingle();
          
          if (existing) {
            const { error: updateError } = await supabase
              .from('airpublisher_instagram_tokens')
              .update(tokenRecord)
              .eq('id', existing.id);
            if (updateError) throw updateError;
          } else {
            const { error: insertError } = await supabase
              .from('airpublisher_instagram_tokens')
              .insert(tokenRecord);
            if (insertError) throw insertError;
          }
        }

        console.log(`✅ Instagram Basic auth complete for: igb_${userData.id}`);
      } else {
        return Response.redirect(`${origin}?error=user_creation_failed`, 302);
      }

      const { data: linkData } = await supabase.auth.admin.generateLink({
        type: 'magiclink',
        email: email,
        options: { redirectTo: origin }
      });

      if (linkData?.properties?.action_link) {
        return Response.redirect(linkData.properties.action_link, 302);
      }

      return Response.redirect(`${origin}?error=login_link_failed`, 302);

    } catch (err) {
      console.error("Instagram Auth Error:", err);
      return Response.redirect(`${origin}?error=${encodeURIComponent((err as Error).message)}`, 302);
    }
  }

  // 3. STATUS CHECK
  if (action === 'status') {
    if (!userId) {
      return new Response(JSON.stringify({ connected: false }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Try new table first
    let { data: tokenData } = await supabase
      .from('airpublisher_instagram_tokens')
      .select('username, instagram_id')
      .eq('user_id', userId)
      .maybeSingle();

    if (!tokenData) {
      const { data: oldTokenData } = await supabase
        .from('instagram_tokens')
        .select('username, instagram_id')
        .eq('user_id', userId)
        .maybeSingle();
      tokenData = oldTokenData;
    }

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

    // Try new table first
    let { data: row } = await supabase
      .from('airpublisher_instagram_tokens')
      .select('access_token_secret_id, instagram_id')
      .eq('user_id', userId)
      .maybeSingle();

    if (!row) {
      const { data: oldRow } = await supabase
        .from('instagram_tokens')
        .select('access_token_secret_id, instagram_id')
        .eq('user_id', userId)
        .maybeSingle();
      row = oldRow;
    }

    if (row?.access_token_secret_id && row?.instagram_id) {
      try {
        const { data: accessToken } = await supabase.rpc('get_decrypted_secret', { 
          p_secret_id: row.access_token_secret_id 
        });
        if (accessToken) {
          await fetch(
            `https://graph.facebook.com/${row.instagram_id}/permissions?access_token=${accessToken}`,
            { method: 'DELETE' }
          );
        }
      } catch (e) {
        console.error("Instagram revocation failed:", e);
      }
    }

    await supabase.from('airpublisher_instagram_tokens').delete().eq('user_id', userId);
    await supabase.from('instagram_tokens').delete().eq('user_id', userId);

    return new Response(JSON.stringify({
      success: true,
      message: "Instagram account disconnected successfully"
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  return new Response(JSON.stringify({ error: "Not Found", action: action, url: req.url }), {
    status: 404,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
});

