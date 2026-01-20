# Auth Cookie Debug Guide

## Problem
Supabase authentication cookies (`sb-*`) are not being set in the browser, even though the user successfully signs in. Only the `creator_profile_id` cookie exists.

## Symptoms
- Login works client-side (session exists in `localStorage`)
- Server-side can't detect session (no `sb-*` cookies)
- Logs show: `[createClient] ⚠️ No Supabase cookies found. All cookies: creator_profile_id`

## Why This Happens
`createBrowserClient` from `@supabase/ssr` should automatically use cookies, but there might be:
1. **Cookie configuration issue** - Cookies not being set with correct options
2. **Domain/path mismatch** - Cookies set for wrong domain/path
3. **HttpOnly cookies** - Browser client can't set httpOnly cookies directly
4. **Session storage** - Session stored in `localStorage` instead of cookies

## How to Debug

### Step 1: Check Browser DevTools
1. Open Chrome DevTools (F12)
2. Go to **Application** tab → **Cookies** → `http://localhost:3000`
3. Look for cookies starting with `sb-` (like `sb-xxx-auth-token`)
4. Check if they exist and their values

### Step 2: Check localStorage
1. In DevTools, go to **Application** → **Local Storage** → `http://localhost:3000`
2. Look for Supabase session data (keys like `sb-xxx-auth-token`)

### Step 3: Verify Session After Login
In the browser console after login:
```javascript
// Check localStorage
localStorage.getItem('sb-xxx-auth-token') // Replace xxx with your Supabase project ref

// Check if session exists
const { createClient } = await import('/lib/supabase/client')
const supabase = createClient()
const { data } = await supabase.auth.getSession()
console.log('Session:', data.session)
```

## Solution
The issue is that `createBrowserClient` stores the session in `localStorage` by default, but server-side needs it in cookies. We need to ensure the session is synced to cookies after login.


