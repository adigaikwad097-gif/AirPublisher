import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react'
import { _syncCreatorId } from '@/lib/auth/session'

/**
 * Auth context — holds creator ID in React state (in-memory).
 * 
 * This works even when the browser blocks localStorage AND cookies.
 * Cookie/localStorage writes are still attempted for cross-session persistence,
 * but the app does NOT depend on them.
 */

const COOKIE_NAME = 'air_creator_id'
const STORAGE_KEY = 'air_creator_id'

interface AuthContextType {
    creatorId: string | null
    isAuthenticated: boolean
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
    // On mount, try to restore from cookie or localStorage
    const [creatorId, setCreatorIdState] = useState<string | null>(() => {
        return readCookie() || readLocalStorage()
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

    const value: AuthContextType = {
        creatorId,
        isAuthenticated: !!creatorId,
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
