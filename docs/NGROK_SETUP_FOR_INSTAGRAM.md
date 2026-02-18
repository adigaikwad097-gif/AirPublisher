# Ngrok Setup for Instagram OAuth

## Issue: Ngrok Not Working Properly

If localhost works but ngrok doesn't, check these:

### 1. Set NEXT_PUBLIC_APP_URL in .env.local

Make sure your `.env.local` has:

```bash
NEXT_PUBLIC_APP_URL=https://untasting-overhugely-kortney.ngrok-free.dev
```

**Important**: 
- Use `https://` (not `http://`)
- No trailing slash
- Full ngrok URL

### 2. Restart Dev Server After Updating

After adding/updating `NEXT_PUBLIC_APP_URL`:
1. Stop dev server: `Ctrl+C`
2. Start again: `npm run dev`

### 3. Verify Redirect URI in Meta Dashboard

In **Instagram** → **Business login settings** → **Valid OAuth Redirect URIs**, make sure you have:

```
https://untasting-overhugely-kortney.ngrok-free.dev/api/auth/instagram/callback
```

### 4. Check Terminal Logs

When you click "Connect Instagram" on ngrok, check terminal logs:

```
[Instagram OAuth] Base URL: https://untasting-overhugely-kortney.ngrok-free.dev
[Instagram OAuth] Full redirect URI: https://untasting-overhugely-kortney.ngrok-free.dev/api/auth/instagram/callback
```

If it shows `http://localhost:3000` instead, then `NEXT_PUBLIC_APP_URL` isn't set correctly.

### 5. Ngrok URL Changes

**Important**: Free ngrok URLs change every time you restart ngrok!

If your ngrok URL changes:
1. Update `.env.local`:
   ```bash
   NEXT_PUBLIC_APP_URL=https://new-ngrok-url.ngrok-free.dev
   ```
2. Add new redirect URI to Meta Dashboard
3. Restart dev server

## Quick Fix

1. **Check `.env.local`** has:
   ```bash
   NEXT_PUBLIC_APP_URL=https://untasting-overhugely-kortney.ngrok-free.dev
   ```

2. **Restart dev server**

3. **Check terminal logs** - should show ngrok URL, not localhost

4. **Try connecting Instagram** on ngrok URL

## If Still Not Working

The 404 errors you're seeing are because I cleared the `.next` cache. Wait for the dev server to finish rebuilding, then try again.

The hardcoded Instagram App ID (`836687999185692`) should work now - it will use that instead of reading from `.env.local`.






