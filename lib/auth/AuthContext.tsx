import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react'
import { _syncCreatorId, isValidUniqueIdentifier } from '@/lib/auth/session'
import { supabase } from '@/lib/supabase/client'

/**
 * Auth context — holds creator ID in React state (in-memory).
 *
 * Supports two entry paths:
 * 1. Localhost (dev): Manual login page where user types unique_identifier
 * 2. Hostinger (production): SSO via shared Supabase session cookies from Air Ideas
 */

const COOKIE_NAME = 'air_creator_id'
const STORAGE_KEY = 'air_creator_id'

interface AuthContextType {
    creatorId: string | null
    isAuthenticated: boolean
    isResolving: boolean
    setCreatorId: (id: string) => void
    clearSession: () => void
}

const AuthContext = createContext<AuthContextType | null>(null)

/**
 * Try to read creator ID from cookie (best-effort).
 */
function readCookie(): string | null {
    try {
        const match = document.cookie.match(new RegExp(`(^| )${COOKIE_NAME}=([^;]+)`))
        return match ? decodeURIComponent(match[2]) : null
    } catch {
        return null
    }
}

/**
 * Try to read creator ID from localStorage (best-effort).
 */
function readLocalStorage(): string | null {
    try {
        if (typeof window !== 'undefined' && window.localStorage) {
            return window.localStorage.getItem(STORAGE_KEY)
        }
    } catch {
        // blocked
    }
    return null
}

/**
 * Try to read creator ID from URL ?id= param (best-effort).
 * Used for direct links or future Air Ideas handoff.
 */
function readUrlParam(): string | null {
    try {
        const params = new URLSearchParams(window.location.search)
        const urlId = params.get('unique_identifier') || params.get('id')
        if (urlId && isValidUniqueIdentifier(urlId)) {
            // Clean URL immediately so params don't linger
            const url = new URL(window.location.href)
            url.searchParams.delete('unique_identifier')
            url.searchParams.delete('id')
            window.history.replaceState({}, '', url.pathname + url.search + url.hash)
            return urlId
        }
    } catch {
        // blocked
    }
    return null
}

/**
 * Try to persist creator ID to cookie + localStorage (best-effort, may silently fail).
 */
function tryPersist(id: string): void {
    // Try cookie
    try {
        const isSecure = window.location.protocol === 'https:'
        document.cookie = `${COOKIE_NAME}=${encodeURIComponent(id)}; path=/; max-age=${30 * 24 * 60 * 60}; samesite=lax${isSecure ? '; secure' : ''}`
    } catch { /* blocked */ }

    // Try localStorage
    try {
        if (typeof window !== 'undefined' && window.localStorage) {
            window.localStorage.setItem(STORAGE_KEY, id)
        }
    } catch { /* blocked */ }
}

/**
 * Try to clear persisted creator ID (best-effort).
 */
function tryClear(): void {
    try { document.cookie = `${COOKIE_NAME}=; path=/; max-age=0` } catch { /* blocked */ }
    try { window.localStorage?.removeItem(STORAGE_KEY) } catch { /* blocked */ }
}

export function AuthProvider({ children }: { children: ReactNode }) {
    // On mount, try to restore from: URL param → cookie → localStorage
    const [creatorId, setCreatorIdState] = useState<string | null>(() => {
        // 1. URL ?id= param (direct link or future Air Ideas handoff)
        const urlId = readUrlParam()
        if (urlId) {
            tryPersist(urlId)
            return urlId
        }
        // 2. Cookie / localStorage (returning user or localhost manual login)
        return readCookie() || readLocalStorage()
    })

    // Whether we're still checking the async Supabase session for SSO
    // Only true when no sync source (URL/cookie/localStorage) was found
    const [isResolving, setIsResolving] = useState<boolean>(() => {
        const urlId = new URLSearchParams(window.location.search).get('id')
        const hasUrlParam = urlId ? isValidUniqueIdentifier(urlId) : false
        return !hasUrlParam && !readCookie() && !readLocalStorage()
    })

    const setCreatorId = useCallback((id: string) => {
        const trimmed = id.trim()
        if (!trimmed) return
        setCreatorIdState(trimmed)
        _syncCreatorId(trimmed)
        tryPersist(trimmed)
    }, [])

    const clearSession = useCallback(() => {
        setCreatorIdState(null)
        _syncCreatorId(null)
        tryClear()
    }, [])

    // Keep module-level variable in sync on mount and state changes
    useEffect(() => {
        _syncCreatorId(creatorId)
    }, [creatorId])

    // SSO fallback: check shared Supabase session for unique_identifier
    // On Hostinger, Air Ideas sets user_metadata.unique_identifier via shared cookies
    // On localhost, this will find no session and fall through to the login page
    useEffect(() => {
        if (creatorId) {
            setIsResolving(false)
            return
        }

        let cancelled = false

        supabase.auth.getSession().then(({ data: { session } }) => {
            if (cancelled) return
            if (session?.user) {
                const uid = session.user.user_metadata?.unique_identifier
                if (uid && typeof uid === 'string' && isValidUniqueIdentifier(uid)) {
                    setCreatorId(uid)
                }
            }
        }).catch(() => {}).finally(() => {
            if (!cancelled) setIsResolving(false)
        })

        return () => { cancelled = true }
    }, []) // eslint-disable-line react-hooks/exhaustive-deps

    const value: AuthContextType = {
        creatorId,
        isAuthenticated: !!creatorId,
        isResolving,
        setCreatorId,
        clearSession,
    }

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextType {
    const ctx = useContext(AuthContext)
    if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
    return ctx
}
