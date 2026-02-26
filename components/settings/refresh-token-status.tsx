import { useEffect, useState } from 'react'
import { AlertCircle } from 'lucide-react'

interface RefreshTokenStatusProps {
    platform: 'youtube' | 'instagram' | 'tiktok'
    isConnected: boolean
    accessTokenExpired: boolean
    hasRefreshToken: boolean
}

export function RefreshTokenStatus({
    platform,
    isConnected,
    accessTokenExpired,
    hasRefreshToken
}: RefreshTokenStatusProps) {
    const [refreshTokenExpired, setRefreshTokenExpired] = useState(false)
    const [checking, setChecking] = useState(false)

    useEffect(() => {
        if (!isConnected || !accessTokenExpired || !hasRefreshToken) {
            return
        }

        const checkRefreshToken = async () => {
            setChecking(true)
            try {
                const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/refresh-token`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
                    },
                    body: JSON.stringify({
                        platform,
                    }),
                })

                const data = await response.json()

                if (data.requires_reconnection === true) {
                    setRefreshTokenExpired(true)
                } else if (data.success === true) {
                    setRefreshTokenExpired(false)
                } else {
                    setRefreshTokenExpired(false)
                }
            } catch (error) {
                console.error(`[RefreshTokenStatus] Error checking ${platform}:`, error)
                setRefreshTokenExpired(false)
            } finally {
                setChecking(false)
            }
        }

        checkRefreshToken()
    }, [platform, isConnected, accessTokenExpired, hasRefreshToken])

    if (refreshTokenExpired) {
        return (
            <div className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                <div className="flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 text-yellow-400 mt-0.5 flex-shrink-0" />
                    <div>
                        <p className="text-sm text-yellow-400 font-semibold mb-1">⚠️ Refresh Token Expired</p>
                        <p className="text-xs text-yellow-300/80">
                            Your refresh token has expired. Please update your connection to continue automatic posting.
                        </p>
                    </div>
                </div>
            </div>
        )
    }

    if (accessTokenExpired && hasRefreshToken && !refreshTokenExpired) {
        return (
            <p className="text-sm text-[#89CFF0]">Token will be automatically refreshed when needed.</p>
        )
    }

    return null
}
