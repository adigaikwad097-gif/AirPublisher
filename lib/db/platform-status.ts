import { supabase } from '@/lib/supabase/client'
import { createClient } from '@supabase/supabase-js'

export type Platform = 'youtube' | 'instagram' | 'facebook'

// Module-level singleton — created once and reused across all getPlatformStatuses calls.
// Prevents "Multiple GoTrueClient instances" warnings caused by creating a new client per call.
let _serviceClient: ReturnType<typeof createClient> | null = null

function getServiceClient() {
    if (_serviceClient) return _serviceClient
    try {
        const serviceKey = (import.meta as any).env?.VITE_SUPABASE_SERVICE_ROLE_KEY
        if (!serviceKey) return null
        _serviceClient = createClient(
            (import.meta as any).env.VITE_SUPABASE_URL,
            serviceKey,
            { auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false } }
        )
    } catch { /* non-blocking */ }
    return _serviceClient
}

export interface PlatformStatus {
    platform: Platform
    connected: boolean
    tokenExpired: boolean
    hasRefreshToken: boolean
}

/**
 * Check platform connection statuses with cross-identity awareness.
 *
 * Uses `airpublisher_connections` as the primary source of truth (via service role client
 * to bypass RLS). This handles connections made under different Supabase auth sessions
 * (e.g. YouTube connected with a different login than Instagram).
 *
 * Falls back to direct token table queries if no connections table entry exists.
 */
export async function getPlatformStatuses(
    creatorUniqueIdentifier: string
): Promise<PlatformStatus[]> {
    // Resolve cross-identity: find all related creator IDs with same handle
    let allCreatorIds = [creatorUniqueIdentifier]
    const { data: currentProfile } = await supabase
        .from('creator_profiles')
        .select('handles, user_id')
        .eq('unique_identifier', creatorUniqueIdentifier)
        .maybeSingle()

    if (currentProfile?.handles) {
        const normalizedHandle = currentProfile.handles.replace('@', '').toLowerCase()
        const { data: profilesWithHandles } = await supabase
            .from('creator_profiles')
            .select('unique_identifier, handles')
            .neq('unique_identifier', creatorUniqueIdentifier)
        if (profilesWithHandles) {
            const related = profilesWithHandles
                .filter(p => p.handles?.replace('@', '').toLowerCase() === normalizedHandle)
                .map(p => p.unique_identifier)
            allCreatorIds = [creatorUniqueIdentifier, ...related]
        }
    }

    // Get the shared service role client (singleton — see module level above).
    // Required to bypass RLS on airpublisher_connections and to read token rows
    // that belong to a different auth session's user_id.
    const serviceClient = getServiceClient()

    // Primary lookup: airpublisher_connections (handles cross-auth-session links)
    let ytConnId: string | null = null
    let igConnId: string | null = null
    let fbConnId: string | null = null

    if (serviceClient) {
        const { data: connections } = await serviceClient
            .from('airpublisher_connections')
            .select('platform, connection_identifier')
            .in('primary_identifier', allCreatorIds)

        if (connections) {
            for (const conn of connections) {
                const cid: string = conn.connection_identifier || ''
                if (cid.startsWith('yt_')) ytConnId = cid
                else if (cid.startsWith('igg_') || cid.startsWith('igb_')) igConnId = cid
                else if (cid.startsWith('fb_')) fbConnId = cid
            }
        }
    }

    // Collect user_ids from creator_profiles for fallback token lookups
    const { data: profilesWithUids } = await supabase
        .from('creator_profiles')
        .select('user_id')
        .in('unique_identifier', allCreatorIds)
    const allUserIds: string[] = Array.from(new Set(
        (profilesWithUids || []).map((p: any) => p.user_id).filter(Boolean)
    ))

    // Determine which creator IDs to use for each token table query.
    // Prefer connection_identifier from airpublisher_connections (works across auth sessions).
    const ytIds = ytConnId
        ? [ytConnId]
        : allCreatorIds.filter(id => id.startsWith('yt_'))
    const igIds = igConnId
        ? [igConnId]
        : allCreatorIds.filter(id => id.startsWith('igb_') || id.startsWith('igg_'))

    // Use service role client for token queries when available — needed for cross-auth-session
    // tokens where the token's user_id differs from the current auth session's user_id.
    const queryClient = serviceClient || supabase

    // Query all 3 token tables
    const [ytRes, igRes, fbRes] = await Promise.all([
        queryClient
            .from('youtube_tokens')
            .select('expires_at, google_refresh_token')
            .in('creator_unique_identifier', ytIds.length > 0 ? ytIds : ['__none__'])
            .limit(1),
        queryClient
            .from('instagram_tokens')
            .select('expires_at, facebook_refresh_token')
            .in('creator_unique_identifier', igIds.length > 0 ? igIds : ['__none__'])
            .limit(1),
        fbConnId
            ? queryClient
                .from('facebook_tokens')
                .select('user_token_expires_at, page_access_token, user_access_token_long_lived, page_access_token_secret_id, user_access_token_secret_id')
                .eq('creator_unique_identifier', fbConnId)
                .limit(1)
            : queryClient
                .from('facebook_tokens')
                .select('user_token_expires_at, page_access_token, user_access_token_long_lived, page_access_token_secret_id, user_access_token_secret_id')
                .in('user_id', allUserIds.length > 0 ? allUserIds : ['__none__'])
                .limit(1)
    ])

    // YouTube fallback: if still not found, try by user_id
    let ytData = ytRes.data?.[0] || null
    if (!ytData && allUserIds.length > 0) {
        const { data } = await queryClient
            .from('youtube_tokens')
            .select('expires_at, google_refresh_token')
            .in('user_id', allUserIds)
            .limit(1)
        ytData = data?.[0] || null
    }

    const now = new Date()

    function buildStatus(
        platform: Platform,
        tokenRow: any | null,
        refreshTokenField: string,
        expiresAtField: string = 'expires_at'
    ): PlatformStatus {
        if (!tokenRow) {
            return { platform, connected: false, tokenExpired: false, hasRefreshToken: false }
        }

        const isExpired = tokenRow[expiresAtField]
            ? new Date(tokenRow[expiresAtField]) < now
            : false

        const hasRefresh = !!tokenRow[refreshTokenField]

        // Connected = "platform is configured" (row exists).
        // Expiry is a posting-time concern, not a setup concern — matches Connections page behavior.
        return {
            platform,
            connected: true,
            tokenExpired: isExpired,
            hasRefreshToken: hasRefresh,
        }
    }

    // Facebook: only treat as connected if actual token values exist (not just a row with an expiry)
    const fbRow = fbRes.data?.[0] || null
    const fbHasTokens = !!(
        fbRow?.page_access_token ||
        fbRow?.user_access_token_long_lived ||
        fbRow?.page_access_token_secret_id ||
        fbRow?.user_access_token_secret_id
    )

    return [
        buildStatus('youtube', ytData, 'google_refresh_token'),
        buildStatus('instagram', igRes.data?.[0] || null, 'facebook_refresh_token'),
        buildStatus('facebook', fbHasTokens ? fbRow : null, '', 'user_token_expires_at'),
    ]
}
