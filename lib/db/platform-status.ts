import { supabase } from '@/lib/supabase/client'

export type Platform = 'internal' | 'youtube' | 'instagram' | 'tiktok'

export interface PlatformStatus {
    platform: Platform
    connected: boolean
    tokenExpired: boolean
    hasRefreshToken: boolean
}

/**
 * Check platform connection statuses by querying token tables directly.
 * Matches the same 3-state logic used in SettingsConnectionsPage:
 *   - Connected (token exists, not expired)
 *   - Auto-Refresh (token exists, expired, but refresh token available)
 *   - Needs Reconnect (token exists, expired, no refresh token)
 *   - Not Connected (no token row)
 *
 * "internal" (Air Publisher) is always connected — no OAuth needed.
 */
export async function getPlatformStatuses(
    creatorUniqueIdentifier: string
): Promise<PlatformStatus[]> {
    const [ytRes, igRes, ttRes] = await Promise.all([
        supabase
            .from('youtube_tokens')
            .select('expires_at, google_refresh_token')
            .eq('creator_unique_identifier', creatorUniqueIdentifier)
            .maybeSingle(),
        supabase
            .from('instagram_tokens')
            .select('expires_at, facebook_refresh_token')
            .eq('creator_unique_identifier', creatorUniqueIdentifier)
            .maybeSingle(),
        supabase
            .from('tiktok_tokens')
            .select('expires_at, refresh_token')
            .eq('creator_unique_identifier', creatorUniqueIdentifier)
            .maybeSingle(),
    ])

    const now = new Date()

    function buildStatus(
        platform: Platform,
        tokenRow: any | null,
        refreshTokenField: string
    ): PlatformStatus {
        if (!tokenRow) {
            return { platform, connected: false, tokenExpired: false, hasRefreshToken: false }
        }

        const isExpired = tokenRow.expires_at
            ? new Date(tokenRow.expires_at) < now
            : false

        const hasRefresh = !!tokenRow[refreshTokenField]

        // Connected if: token exists AND (not expired OR has refresh token for auto-refresh)
        const isConnected = !isExpired || hasRefresh

        return {
            platform,
            connected: isConnected,
            tokenExpired: isExpired,
            hasRefreshToken: hasRefresh,
        }
    }

    return [
        // Internal (Air Publisher) is always connected
        { platform: 'internal', connected: true, tokenExpired: false, hasRefreshToken: false },
        buildStatus('youtube', ytRes.data, 'google_refresh_token'),
        buildStatus('instagram', igRes.data, 'facebook_refresh_token'),
        buildStatus('tiktok', ttRes.data, 'refresh_token'),
    ]
}
