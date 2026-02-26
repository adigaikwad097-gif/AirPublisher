/**
 * Centralized auth session — thin wrapper.
 * 
 * The real auth state lives in AuthContext (React state, in-memory).
 * This module exposes getCreatorId/hasCreatorSession for non-component code
 * by reading from a module-level variable kept in sync by AuthContext.
 * 
 * Also tries cookie/localStorage as fallback for page reloads.
 */

const COOKIE_NAME = 'air_creator_id'
const STORAGE_KEY = 'air_creator_id'

// Module-level variable — AuthContext syncs this on every state change
let _currentCreatorId: string | null = null

/**
 * Called by AuthContext to keep the module-level variable in sync.
 */
export function _syncCreatorId(id: string | null): void {
    _currentCreatorId = id
}

/**
 * Get the creator identifier.
 * Reads from: module variable (primary) → cookie → localStorage
 */
export function getCreatorId(): string | null {
    // Primary: in-memory (set by AuthContext)
    if (_currentCreatorId) return _currentCreatorId

    // Fallback: cookie
    try {
        const match = document.cookie.match(new RegExp(`(^| )${COOKIE_NAME}=([^;]+)`))
        const cookieVal = match ? decodeURIComponent(match[2]) : null
        if (cookieVal) return cookieVal
    } catch { /* blocked */ }

    // Fallback: localStorage
    try {
        if (typeof window !== 'undefined' && window.localStorage) {
            return window.localStorage.getItem(STORAGE_KEY)
        }
    } catch { /* blocked */ }

    return null
}

/**
 * Check if a creator session exists.
 */
export function hasCreatorSession(): boolean {
    return !!getCreatorId()
}

/**
 * Set creator ID (for use outside React components, e.g. setup-form).
 */
export function setCreatorId(identifier: string): void {
    const trimmed = identifier.trim()
    if (!trimmed) return
    _currentCreatorId = trimmed
    // Try persist
    try {
        const isSecure = window.location.protocol === 'https:'
        document.cookie = `${COOKIE_NAME}=${encodeURIComponent(trimmed)}; path=/; max-age=${30 * 24 * 60 * 60}; samesite=lax${isSecure ? '; secure' : ''}`
    } catch { /* blocked */ }
    try { window.localStorage?.setItem(STORAGE_KEY, trimmed) } catch { /* blocked */ }
}

/**
 * Clear the creator session.
 */
export function clearCreatorSession(): void {
    _currentCreatorId = null
    try { document.cookie = `${COOKIE_NAME}=; path=/; max-age=0` } catch { /* blocked */ }
    try { window.localStorage?.removeItem(STORAGE_KEY) } catch { /* blocked */ }
}
