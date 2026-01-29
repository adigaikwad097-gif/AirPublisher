# Complete PKCE Fix for Production/Ngrok

## 🔴 Problem

**Error**: `PKCE code verifier not found in storage`

This happens because:
1. PKCE code verifier is stored in browser cookies by `createBrowserClient`
2. When OAuth redirects back, the server callback route needs to read those cookies
3. Cookies might not be sent correctly with ngrok/production URLs

## ✅ Solution: Proper Cookie Handling

### Key Requirements

1. **Client-side**: `createBrowserClient` stores PKCE code verifier in cookies
2. **Server-side**: `createServerClient` must read the same cookies
3. **Cookie options**: Must allow cookies to be sent with requests

## 🔧 Implementation

### 1. Client (`lib/supabase/client.ts`)

✅ Already correct - `createBrowserClient` automatically handles PKCE cookies

### 2. Callback Route (`app/auth/callback/route.ts`)

✅ Updated to:
- Read cookies from incoming request
- Set proper cookie options for ngrok/production
- Log cookies for debugging

### 3. Cookie Options

The callback route now sets cookies with:
- `httpOnly: false` - So client can access PKCE code verifier
- `sameSite: 'lax'` - Allows OAuth redirects
- `secure: true` - For HTTPS (ngrok/production)
- `path: '/'` - Available site-wide
- `domain: undefined` - For ngrok (let browser handle it)

## 🚀 Next Steps

### Step 1: Verify Supabase Configuration

1. **Go to Supabase Dashboard**: https://supabase.com/dashboard
2. **Select your project**
3. **Go to**: Authentication → URL Configuration
4. **Check**:
   - **Site URL**: Should be your ngrok URL or production URL
   - **Redirect URLs**: Should include:
     ```
     https://untasting-overhugely-kortney.ngrok-free.dev/auth/callback
     http://localhost:3000/auth/callback
     ```

### Step 2: Restart Dev Server

```bash
# Stop (Ctrl+C)
npm run dev
```

### Step 3: Test Google Sign-In

1. Go to your ngrok URL login page
2. Click "Continue with Google"
3. Complete Google OAuth
4. Should redirect back and work!

## 🔍 Debugging

### Check Server Logs

After clicking "Continue with Google", check your terminal for:

```
[OAuth Callback] Available cookies: {
  count: X,
  cookieNames: [...],
  supabaseCookies: [...],
  hasSupabaseCookies: true/false,
  pkceCookies: [...]
}
```

**If `hasSupabaseCookies: false`**, the cookies aren't being sent to the server. This means:
- Cookie domain/path is wrong
- Cookies are being blocked
- Browser security settings

### Check Browser Cookies

1. Open DevTools (F12)
2. Go to **Application** → **Cookies**
3. Look for cookies starting with:
   - `sb-`
   - `supabase`
   - `pkce`
4. Check their **Domain** and **Path** settings

### Common Issues

1. **Cookies not sent**: Domain mismatch between where cookie is set and where it's read
2. **Cookie blocked**: Browser security or CORS issues
3. **Cookie expired**: PKCE code verifier expires quickly (should be used immediately)

## ✅ Expected Flow

1. User clicks "Continue with Google"
2. `createBrowserClient` stores PKCE code verifier in cookie
3. Redirects to Google OAuth
4. Google redirects back to `/auth/callback`
5. Callback route reads PKCE code verifier from cookies
6. Exchanges code for session
7. ✅ Success!

## 🐛 If Still Not Working

1. **Check Supabase redirect URLs** - Must match exactly
2. **Check cookie logs** - See what cookies are available
3. **Try incognito mode** - Rules out browser extensions
4. **Check ngrok URL** - Make sure it's the same in all places
5. **Verify environment variables** - `NEXT_PUBLIC_SUPABASE_URL` must be correct

---

**The fix is already applied!** Just restart your dev server and test. Check the server logs to see if cookies are being read correctly.



