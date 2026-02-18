export const safeLocalStorage = {
    getItem: (key: string): string | null => {
        try {
            if (typeof window !== 'undefined' && window.localStorage) {
                return window.localStorage.getItem(key)
            }
        } catch (e) {
            console.warn(`[SafeStorage] Access denied for key: ${key}`)
        }
        return null
    },

    setItem: (key: string, value: string): void => {
        try {
            if (typeof window !== 'undefined' && window.localStorage) {
                window.localStorage.setItem(key, value)
            }
        } catch (e) {
            console.warn(`[SafeStorage] Access denied for setting key: ${key}`)
        }
    },

    removeItem: (key: string): void => {
        try {
            if (typeof window !== 'undefined' && window.localStorage) {
                window.localStorage.removeItem(key)
            }
        } catch (e) {
            console.warn(`[SafeStorage] Access denied for removing key: ${key}`)
        }
    },
}
