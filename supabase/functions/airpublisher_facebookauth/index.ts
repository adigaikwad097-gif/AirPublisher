// @ts-ignore
declare const Deno: any;

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.1";
import { corsHeaders } from "../_shared/cors.ts";
import { FRONTEND_URL } from "../_shared/constants.ts";

const DEFAULT_ORIGIN = FRONTEND_URL;

serve(async (req: Request) => {
    if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

    const url = new URL(req.url);
    let action = url.searchParams.get('action');
    let origin = url.searchParams.get('origin') || DEFAULT_ORIGIN;
    let code = url.searchParams.get('code');

    if (req.method === 'POST') {
        try {
            const body = await req.json();
            if (body.action) action = body.action;
            if (body.origin) origin = body.origin;
            if (body.code) code = body.code;
        } catch (e) { }
    }

    if (!action && code) action = 'callback';

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const FB_APP_ID = Deno.env.get("FACEBOOK_APP_ID_PUBLISHER") || Deno.env.get("FACEBOOK_APP_ID")!;
    const FB_APP_SECRET = Deno.env.get("FACEBOOK_APP_SECRET_PUBLISHER") || Deno.env.get("FACEBOOK_APP_SECRET")!;
    const FB_GRAPH_VERSION = Deno.env.get("FACEBOOK_GRAPH_VERSION") || "v22.0";

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !FB_APP_ID || !FB_APP_SECRET) {
        return new Response(JSON.stringify({ error: "Missing configuration" }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
    }

    const cleanSupabaseUrl = SUPABASE_URL.replace(/\/$/, "");
    const REDIRECT_URI = `${cleanSupabaseUrl}/functions/v1/airpublisher_facebookauth`;
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // ==========================================
    // 1. INIT - Start Facebook OAuth
    // ==========================================
    if (action === 'init') {
        const scopes = [
            'public_profile',
            'email',
            'pages_show_list',
            'pages_read_engagement',
            'pages_manage_posts',
            'pages_manage_metadata',
            'pages_read_user_content'
        ].join(',');

        const creator_id = url.searchParams.get("creator_id") || "";
        const user_id = url.searchParams.get("user_id") || "";
        const state = encodeURIComponent(JSON.stringify({ origin, creator_id, user_id }));
        const authUrl = `https://www.facebook.com/${FB_GRAPH_VERSION}/dialog/oauth?client_id=${FB_APP_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&state=${state}&scope=${scopes}`;

        if (url.searchParams.get('redirect') === 'false') {
            return new Response(JSON.stringify({ url: authUrl }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }
        return Response.redirect(authUrl, 302);
    }

    // ==========================================
    // 2. CALLBACK - Handle Facebook OAuth Response
    // ==========================================
    if (action === 'callback') {
        console.log('🔵 [airpublisher_facebookauth] Callback received');

        if (!code) return new Response("Error: No code received", { status: 400 });

        try {
            // Exchange code for Access Token
            const tokenUrl = `https://graph.facebook.com/${FB_GRAPH_VERSION}/oauth/access_token?client_id=${FB_APP_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&client_secret=${FB_APP_SECRET}&code=${code}`;
            const tokenRes = await fetch(tokenUrl);
            const tokenData = await tokenRes.json();

            if (tokenData.error || !tokenData.access_token) {
                throw new Error(`Facebook Token Error: ${JSON.stringify(tokenData)}`);
            }

            const shortLivedToken = tokenData.access_token;

            // Exchange for Long-Lived Token (~60 days)
            const longTokenUrl = `https://graph.facebook.com/${FB_GRAPH_VERSION}/oauth/access_token?grant_type=fb_exchange_token&client_id=${FB_APP_ID}&client_secret=${FB_APP_SECRET}&fb_exchange_token=${shortLivedToken}`;
            const longRes = await fetch(longTokenUrl);
            const longData = await longRes.json();
            const userAccessToken = longData.access_token || shortLivedToken;

            // Fetch User Profile
            const userRes = await fetch(`https://graph.facebook.com/${FB_GRAPH_VERSION}/me?fields=id,name,email&access_token=${userAccessToken}`);
            const userData = await userRes.json();
            if (userData.error) throw new Error(`User Info Error: ${JSON.stringify(userData)}`);

            // Parse State
            let creatorIdFromState = "";
            let userIdFromState = "";
            try {
                const stateObj = JSON.parse(decodeURIComponent(url.searchParams.get("state") || "{}"));
                if (stateObj.origin) origin = stateObj.origin;
                if (stateObj.creator_id) creatorIdFromState = stateObj.creator_id;
                if (stateObj.user_id) userIdFromState = stateObj.user_id;
            } catch { }

            // Resolve target user — prefer user_id from state (already logged in)
            let targetUserId = userIdFromState;
            if (!targetUserId) {
                const email = userData.email || `${userData.id}@facebook.placeholder`;
                const { data: usersData } = await supabase.auth.admin.listUsers();
                const existingUser = usersData.users.find((u: any) => u.email === email);

                if (existingUser) {
                    targetUserId = existingUser.id;
                } else {
                    const { data: createdUser, error: createErr } = await supabase.auth.admin.createUser({
                        email,
                        email_confirm: true,
                        user_metadata: {
                            full_name: userData.name,
                            avatar_url: `https://graph.facebook.com/${userData.id}/picture?type=large`,
                            provider: 'facebook',
                            providers: ['facebook'],
                            facebook_id: userData.id
                        }
                    });
                    if (createErr) throw createErr;
                    targetUserId = createdUser?.user?.id;
                }
            }

            if (!targetUserId) throw new Error("Failed to resolve user ID");

            // Fetch Facebook Pages
            const pagesUrl = `https://graph.facebook.com/${FB_GRAPH_VERSION}/me/accounts?fields=id,name,access_token,username&access_token=${userAccessToken}`;
            const pagesRes = await fetch(pagesUrl);
            const pagesJson = await pagesRes.json();

            if (!pagesJson.data || pagesJson.data.length === 0) {
                const errorUrl = new URL(origin);
                errorUrl.searchParams.set('error', 'no_facebook_pages');
                return Response.redirect(errorUrl.toString(), 302);
            }

            const page = pagesJson.data[0];
            console.log(`✅ Found Facebook Page: ${page.name} (${page.id})`);

            // Vault encryption for page token
            let pageAtId: string | null = null;
            let userAtId: string | null = null;
            let useRawPageToken = false;
            let useRawUserToken = false;

            try {
                const { data: vd, error: ve } = await supabase.rpc('create_vault_secret', {
                    p_secret: page.access_token,
                    p_name: `fb_page_access_${page.id}`
                });
                if (!ve && vd) pageAtId = vd;
                else useRawPageToken = true;
            } catch { useRawPageToken = true; }

            try {
                const { data: vd, error: ve } = await supabase.rpc('create_vault_secret', {
                    p_secret: userAccessToken,
                    p_name: `fb_user_access_${targetUserId}`
                });
                if (!ve && vd) userAtId = vd;
                else useRawUserToken = true;
            } catch { useRawUserToken = true; }

            // Upsert to facebook_tokens
            console.log(`🔵 Upserting facebook_tokens for user=${targetUserId}, page=${page.id}, pageAtId=${pageAtId}, userAtId=${userAtId}, useRawPage=${useRawPageToken}, useRawUser=${useRawUserToken}`);
            const { error: fbTokenError } = await supabase.from("facebook_tokens").upsert({
                user_id: targetUserId,
                page_id: page.id,
                page_name: page.name,
                page_access_token_secret_id: pageAtId,
                page_access_token: useRawPageToken ? page.access_token : null,
                user_access_token_secret_id: userAtId,
                user_access_token_long_lived: useRawUserToken ? userAccessToken : null,
                creator_unique_identifier: `fb_${page.id}`,
                user_token_expires_at: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
                updated_at: new Date().toISOString()
            }, { onConflict: "user_id,page_id" });
            if (fbTokenError) {
                console.error(`❌ facebook_tokens upsert error:`, JSON.stringify(fbTokenError));
                throw new Error(`facebook_tokens upsert failed: ${fbTokenError.message}`);
            }
            console.log(`✅ facebook_tokens upsert successful`);

            // Resolve primary_identifier
            let primaryIdentifier = creatorIdFromState;
            if (!primaryIdentifier) {
                const { data: profileLinks } = await supabase
                    .from('creator_profiles')
                    .select('unique_identifier')
                    .eq('user_id', targetUserId);

                primaryIdentifier = profileLinks?.find((p: any) =>
                    !p.unique_identifier.startsWith('yt_') &&
                    !p.unique_identifier.startsWith('igg_') &&
                    !p.unique_identifier.startsWith('igb_') &&
                    !p.unique_identifier.startsWith('fb_')
                )?.unique_identifier || profileLinks?.[0]?.unique_identifier || `fb_${page.id}`;
            }

            // Register in airpublisher_connections
            console.log(`🔵 Upserting airpublisher_connections for user=${targetUserId}, platform=facebook, id=fb_${page.id}`);
            const { error: connError } = await supabase.from("airpublisher_connections").upsert({
                user_id: targetUserId,
                primary_identifier: primaryIdentifier,
                platform: 'facebook',
                connection_identifier: `fb_${page.id}`,
                platform_name: page.name || null,
                updated_at: new Date().toISOString()
            }, { onConflict: "user_id,platform,connection_identifier" });
            if (connError) {
                console.error(`❌ airpublisher_connections upsert error:`, JSON.stringify(connError));
                // Non-blocking: log but don't throw — facebook_tokens is the critical one
            }

            console.log(`✅ Facebook Pages auth complete for: fb_${page.id}`);

            // Direct redirect back — no magic link needed since user is already logged in
            const successUrl = new URL(origin);
            successUrl.searchParams.set('success', 'facebook_connected');
            return Response.redirect(successUrl.toString(), 302);

        } catch (e: any) {
            console.error("Facebook Auth Error:", e);
            const errorUrl = new URL(origin);
            errorUrl.searchParams.set('error', e.message);
            return Response.redirect(errorUrl.toString(), 302);
        }
    }

    // ==========================================
    // 3. STATUS
    // ==========================================
    if (action === 'status') {
        const userId = url.searchParams.get('user_id');
        if (!userId) {
            return new Response(JSON.stringify({ connected: false }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        const { data } = await supabase
            .from('facebook_tokens')
            .select('page_name, page_id, user_token_expires_at')
            .eq('user_id', userId)
            .limit(1)
            .maybeSingle();

        return new Response(JSON.stringify({
            connected: !!data,
            page_name: data?.page_name,
            page_id: data?.page_id
        }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // ==========================================
    // 4. DISCONNECT
    // ==========================================
    if (action === 'disconnect') {
        const authHeader = req.headers.get("Authorization");
        if (!authHeader) {
            return new Response(JSON.stringify({ error: "Missing Auth" }), {
                status: 401,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }
        const { data: { user } } = await supabase.auth.getUser(authHeader.replace("Bearer ", ""));
        if (!user) {
            return new Response(JSON.stringify({ error: "Unauthorized" }), {
                status: 401,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        // Attempt to revoke Facebook permissions
        try {
            const { data: row } = await supabase
                .from('facebook_tokens')
                .select('user_access_token_secret_id, user_access_token_long_lived')
                .eq('user_id', user.id)
                .maybeSingle();

            if (row) {
                let tokenToRevoke = row.user_access_token_long_lived;
                if (!tokenToRevoke && row.user_access_token_secret_id) {
                    const { data: decrypted } = await supabase.rpc('get_decrypted_secret', {
                        p_secret_id: row.user_access_token_secret_id
                    });
                    tokenToRevoke = decrypted;
                }
                if (tokenToRevoke) {
                    const meRes = await fetch(`https://graph.facebook.com/${FB_GRAPH_VERSION}/me?access_token=${tokenToRevoke}`);
                    const meData = await meRes.json();
                    if (meData.id) {
                        await fetch(`https://graph.facebook.com/${FB_GRAPH_VERSION}/${meData.id}/permissions?access_token=${tokenToRevoke}`, {
                            method: "DELETE"
                        });
                    }
                }
            }
        } catch { /* Non-blocking: proceed with local cleanup */ }

        await supabase.from("facebook_tokens").delete().eq("user_id", user.id);
        await supabase.from("airpublisher_connections")
            .delete()
            .eq("user_id", user.id)
            .eq("platform", "facebook");

        return new Response(JSON.stringify({ success: true }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }

    return new Response(JSON.stringify({ error: "Invalid action" }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
});
