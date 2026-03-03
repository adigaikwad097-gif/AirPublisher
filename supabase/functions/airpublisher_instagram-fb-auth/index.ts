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
    const REDIRECT_URI = `${cleanSupabaseUrl}/functions/v1/airpublisher_instagram-fb-auth`;
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // ==========================================
    // 1. INIT - Start Facebook OAuth for Instagram
    // ==========================================
    if (action === 'init') {
        // Request Instagram-specific permissions through Facebook OAuth
        const scopes = [
            'public_profile',
            'email',
            'pages_show_list',
            'pages_read_engagement',
            'instagram_basic',
            'instagram_manage_insights',  // Required for video_view_count
            'instagram_manage_comments', // Required for fetching comments
            'instagram_content_publish'
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
        console.log('🔵 [airpublisher_instagram-fb-auth] Callback received');
        console.log('🔵 Code:', code?.substring(0, 20) + '...');

        if (!code) {
            return new Response("Error: No code received", { status: 400 });
        }

        try {
            console.log('🔵 Exchanging code for access token...');
            // Exchange code for Access Token
            const tokenUrl = `https://graph.facebook.com/${FB_GRAPH_VERSION}/oauth/access_token?client_id=${FB_APP_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&client_secret=${FB_APP_SECRET}&code=${code}`;
            const tokenRes = await fetch(tokenUrl);
            const tokenData = await tokenRes.json();

            if (tokenData.error || !tokenData.access_token) {
                throw new Error(`Facebook Token Error: ${JSON.stringify(tokenData)}`);
            }

            const shortLivedToken = tokenData.access_token;

            // Exchange for Long-Lived Token
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

            // Get Pages and check for Instagram Business Account
            const pagesUrl = `https://graph.facebook.com/${FB_GRAPH_VERSION}/me/accounts?fields=id,name,access_token,username,instagram_business_account{id,username,name,profile_picture_url,followers_count,follows_count,biography}&access_token=${userAccessToken}`;
            const pagesRes = await fetch(pagesUrl);
            const pagesJson = await pagesRes.json();

            // Find a page with linked Instagram Business Account
            let igBusinessPage = null;
            let igBusinessAccount = null;

            if (pagesJson.data && pagesJson.data.length > 0) {
                for (const page of pagesJson.data) {
                    if (page.instagram_business_account) {
                        igBusinessPage = page;
                        igBusinessAccount = page.instagram_business_account;
                        break;
                    }
                }
            }

            // If no Instagram Business Account found, redirect back with error
            if (!igBusinessAccount) {
                console.log("⚠️ No Instagram Business Account found");
                const errorUrl = new URL(origin);
                errorUrl.searchParams.set('error', 'no_instagram_business_account');
                return Response.redirect(errorUrl.toString(), 302);
            }

            console.log(`✅ Found Instagram Business Account: @${igBusinessAccount.username}`);

            // Get/Create Supabase User
            const email = userData.email || `${userData.id}@facebook.placeholder`;
            let targetUserId = userIdFromState;

            if (!targetUserId) {
                const { data: usersData } = await supabase.auth.admin.listUsers();
                const existingUser = usersData.users.find((u: any) => u.email === email);

                if (existingUser) {
                    targetUserId = existingUser.id;

                    // CRITICAL: Update existing user's metadata to instagram_fb provider
                    try {
                        await supabase.auth.admin.updateUserById(targetUserId, {
                            user_metadata: {
                                ...(existingUser.user_metadata || {}),
                                provider: 'instagram_fb',
                                providers: ['instagram_fb'],
                                facebook_id: userData.id,
                                instagram_id: igBusinessAccount.id
                            }
                        });
                    } catch (updateErr: any) {
                        console.error(`⚠️ Failed to update user metadata (non-blocking):`, updateErr?.message);
                    }
                } else {
                    const { data: createdUser, error: createErr } = await supabase.auth.admin.createUser({
                        email: email,
                        email_confirm: true,
                        user_metadata: {
                            full_name: userData.name,
                            avatar_url: igBusinessAccount.profile_picture_url || `https://graph.facebook.com/${userData.id}/picture?type=large`,
                            provider: 'instagram_fb',
                            providers: ['instagram_fb'],
                            facebook_id: userData.id,
                            instagram_id: igBusinessAccount.id
                        }
                    });
                    if (createErr) throw createErr;
                    targetUserId = createdUser?.user?.id;
                }
            }

            if (!targetUserId) throw new Error("Failed to resolve user ID");

            // Store tokens in instagram_tokens table (with auth_type = 'graph_api')
            let pageAtId: string | null = null;
            let useRawToken = false;

            // Try Vault encryption
            try {
                const { data, error } = await supabase.rpc('create_vault_secret', {
                    p_secret: igBusinessPage.access_token,
                    p_name: `ig_fb_page_access_${igBusinessAccount.id}`
                });
                if (!error && data) {
                    pageAtId = data;
                    console.log("✅ Token encrypted via Vault");
                } else {
                    console.warn("⚠️ Vault encryption failed:", error?.message);
                    useRawToken = true;
                }
            } catch (vaultError) {
                console.warn("⚠️ Vault unavailable:", vaultError);
                useRawToken = true;
            }

            // Upsert to instagram_tokens (match existing schema + add auth_type)
            await supabase.from("instagram_tokens").upsert({
                user_id: targetUserId,
                instagram_id: igBusinessAccount.id,
                username: igBusinessAccount.username,
                access_token_secret_id: pageAtId,
                access_token: useRawToken ? igBusinessPage.access_token : null,
                creator_unique_identifier: `igg_${igBusinessAccount.id}`,
                instagram_business_account_id: igBusinessAccount.id,  // Store IG Business ID
                page_id: igBusinessPage.id,  // Store FB Page ID
                expires_at: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(), // ~60 days
                updated_at: new Date().toISOString()
            }, { onConflict: "user_id" });

            // Use igg_ prefix for Instagram Graph API (via Facebook)
            const uniqueId = `igg_${igBusinessAccount.id}`;

            // 1. Resolve Primary Identifier
            let primaryIdentifier = creatorIdFromState;
            if (!primaryIdentifier) {
                const { data: profileLinks } = await supabase
                    .from('creator_profiles')
                    .select('unique_identifier')
                    .eq('user_id', targetUserId);

                primaryIdentifier = profileLinks?.find((p: any) =>
                    !p.unique_identifier.startsWith('yt_') &&
                    !p.unique_identifier.startsWith('igg_')
                )?.unique_identifier || profileLinks?.[0]?.unique_identifier || uniqueId;
            }

            // 2. Register in the unified connections table
            await supabase.from("airpublisher_connections").upsert({
                user_id: targetUserId,
                primary_identifier: primaryIdentifier,
                platform: 'instagram',
                connection_identifier: uniqueId,
                platform_name: igBusinessAccount.username,
                platform_avatar_url: igBusinessAccount.profile_picture_url || null,
                updated_at: new Date().toISOString()
            }, { onConflict: "user_id,platform,connection_identifier" });

            console.log(`✅ Instagram Graph API auth complete for: ${uniqueId}`);

            // Direct SUCCESS REDIRECT back to origin
            const successUrl = new URL(origin);
            successUrl.searchParams.set('success', 'instagram_connected');
            return Response.redirect(successUrl.toString(), 302);

        } catch (error: any) {
            console.error("Instagram-FB Auth Error:", error);
            const errorUrl = new URL(origin);
            errorUrl.searchParams.set('error', error.message);
            return Response.redirect(errorUrl.toString(), 302);
        }
    }

    // ==========================================
    // 3. STATUS CHECK
    // ==========================================
    if (action === 'status') {
        const userId = url.searchParams.get('user_id');
        if (!userId) {
            return new Response(JSON.stringify({ connected: false }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        const { data: tokenData } = await supabase
            .from('instagram_tokens')
            .select('username, instagram_id, expires_at')
            .eq('user_id', userId)
            .like('creator_unique_identifier', 'igg_%')
            .maybeSingle();

        if (!tokenData) {
            return new Response(JSON.stringify({ connected: false }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        const expiresAt = new Date(tokenData.expires_at);
        const now = new Date();
        const daysUntilExpiry = Math.floor((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

        return new Response(JSON.stringify({
            connected: true,
            expired: daysUntilExpiry <= 0,
            days_until_expiry: Math.max(0, daysUntilExpiry),
            username: tokenData.username,
            instagram_id: tokenData.instagram_id
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
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

        // Delete instagram_tokens row for this user (igg_ flow)
        await supabase.from("instagram_tokens")
            .delete()
            .eq("user_id", user.id)
            .like("creator_unique_identifier", "igg_%");

        // Delete from unified connections table
        await supabase.from("airpublisher_connections")
            .delete()
            .eq("user_id", user.id)
            .eq("platform", "instagram")
            .like("connection_identifier", "igg_%");

        return new Response(JSON.stringify({ success: true }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }

    return new Response(JSON.stringify({ error: "Invalid action" }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
});
