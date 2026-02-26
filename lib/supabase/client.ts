import { createClient as createBrowserClient } from '@supabase/supabase-js'

/**
 * Client-side Supabase client
 * Uses @supabase/ssr which automatically handles PKCE code verifier in cookies
 * Important: Cookies must be accessible for PKCE to work across redirects
 */
import { safeLocalStorage } from '@/lib/utils/safe-storage'

export function createClient() {
  const url = import.meta.env.VITE_SUPABASE_URL
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY

  if (!url || !key) {
    console.error('Missing Supabase environment variables')
    return createBrowserClient(
      'https://placeholder.supabase.co',
      'placeholder-key'
    )
  }

  return createBrowserClient(url, key, {
    auth: {
      storage: {
        getItem: (key: string) => {
          if (typeof document === 'undefined') return null

          try {
            let raw: string | null = null;

            // 1. Try retrieving single cookie first (legacy/small)
            const match = document.cookie.match(new RegExp('(^| )' + key + '=([^;]+)'));
            if (match) {
              raw = decodeURIComponent(match[2]);
            } else {
              // 2. Try retrieving chunked cookies
              let value = '';
              let i = 0;
              while (true) {
                const chunkKey = `${key}.${i}`;
                const chunkMatch = document.cookie.match(new RegExp('(^| )' + chunkKey + '=([^;]+)'));
                if (!chunkMatch) break;
                value += decodeURIComponent(chunkMatch[2]);
                i++;
              }
              raw = value || null;
            }

            if (!raw) return null;

            // 3. Handle Supabase's base64- prefixed session encoding
            if (raw.startsWith('base64-')) {
              try {
                return atob(raw.substring(7));
              } catch {
                return raw;
              }
            }

            return raw;
          } catch (e) {
            // SecurityError or other access issues
            console.warn('Error accessing cookies in getItem:', e)
            return null
          }
        },
        setItem: (key: string, value: string) => {
          if (typeof document === 'undefined') return

          try {
            // 1. Determine environment (IP vs Domain)
            // For localhost, we often don't need domain attribute or can use 'localhost'
            // But to share with other ports, no domain attribute usually works for localhost
            // or explicit domain=.localhost (which some browsers dislike).
            // The Air Creator code used logic to check for IP key pattern.
            const isIp = /^[0-9]+(\.[0-9]+){3}$/.test(window.location.hostname) || window.location.hostname === 'localhost';

            // For integration with Air Creator (.aircreator.cloud), we need that domain if in prod
            // But locally we likely want to start with just path=/
            const domainAttribute = isIp ? '' : `; domain=.${window.location.hostname}`;

            // Air Creator uses 1 year expiry (max-age=31536000)
            const expires = '; max-age=31536000; SameSite=Lax';

            // 2. Clear any existing single cookie to prevent conflicts
            document.cookie = `${key}=; path=/${domainAttribute}; max-age=0; SameSite=Lax`;

            // 3. Chunking logic (Limit 3000 chars per chunk)
            const chunkSize = 3000;
            const numChunks = Math.ceil(value.length / chunkSize);

            for (let i = 0; i < numChunks; i++) {
              const chunk = value.substring(i * chunkSize, (i + 1) * chunkSize);
              document.cookie = `${key}.${i}=${encodeURIComponent(chunk)}; path=/${domainAttribute}${expires}`;
            }
          } catch (e) {
            console.warn('Error accessing cookies in setItem:', e)
          }
        },
        removeItem: (key: string) => {
          if (typeof document === 'undefined') return

          try {
            const isIp = /^[0-9]+(\.[0-9]+){3}$/.test(window.location.hostname) || window.location.hostname === 'localhost';
            const domainAttribute = isIp ? '' : `; domain=.${window.location.hostname}`;
            const options = `; path=/${domainAttribute}; max-age=0; SameSite=Lax`;

            // Remove single cookie
            document.cookie = `${key}=${options}`;

            // Remove chunks (check up to 20 chunks to be safe)
            for (let i = 0; i < 20; i++) {
              document.cookie = `${key}.${i}=${options}`;
            }
          } catch (e) {
            console.warn('Error accessing cookies in removeItem:', e)
          }
        },
      },
      // Override lock to prevent SecurityError in restrictive environments (e.g. strict iframes, Brave)
      lock: typeof navigator !== 'undefined' ? async (name: string, acquireTimeout: number, fn: () => Promise<any>) => {
        return await fn()
      } : undefined,
    },
  })
}

export const supabase = createClient()
