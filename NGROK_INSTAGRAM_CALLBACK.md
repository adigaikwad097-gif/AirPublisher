# Instagram OAuth Callback URL for Ngrok

## Ngrok Callback URL

Add this **exact** URL to your Instagram Business Login settings:

```
https://untasting-overhugely-kortney.ngrok-free.dev/api/auth/instagram/callback
```

## How to Add It

1. Go to [Meta Dashboard](https://developers.facebook.com/apps/)
2. Select your app
3. Navigate to: **Products** → **Instagram** → **API setup with Instagram login**
4. Click: **"3. Set up Instagram business login"**
5. Click: **"Business login settings"**
6. Scroll to: **"Valid OAuth Redirect URIs"**
7. Click: **"Add URI"**
8. Paste: `https://untasting-overhugely-kortney.ngrok-free.dev/api/auth/instagram/callback`
9. Click: **"Save Changes"**
10. Wait 2-5 minutes for Meta to update

## Multiple Redirect URIs

You can have all of these in the list simultaneously:

- `http://localhost:3000/api/auth/instagram/callback` (for local development)
- `https://untasting-overhugely-kortney.ngrok-free.dev/api/auth/instagram/callback` (for ngrok testing) ← **Add this one**
- `https://pezvnqhexxttlhcnbtta.supabase.co/functions/v1/instagram-auth` (for Supabase, if needed)

## Important Notes

1. **Ngrok URL Changes**: Remember that free ngrok URLs change every time you restart ngrok. If your ngrok URL changes, you'll need to update it in Meta Dashboard.

2. **Use HTTPS**: Ngrok uses `https://` (not `http://`) since it provides SSL encryption.

3. **Exact Match Required**: The redirect URI must match **exactly**:
   - ✅ `https://untasting-overhugely-kortney.ngrok-free.dev/api/auth/instagram/callback`
   - ❌ `https://untasting-overhugely-kortney.ngrok-free.dev/api/auth/instagram/callback/` (trailing slash)
   - ❌ `http://untasting-overhugely-kortney.ngrok-free.dev/api/auth/instagram/callback` (http instead of https)

## After Adding

1. **Restart your dev server** (if needed)
2. **Try connecting Instagram again** using your ngrok URL
3. It should redirect properly! ✅

## If Ngrok URL Changes

If you restart ngrok and get a new URL, you'll need to:

1. Get the new ngrok URL (e.g., `https://new-url.ngrok-free.dev`)
2. Update `.env.local`:
   ```bash
   NEXT_PUBLIC_APP_URL=https://new-url.ngrok-free.dev
   ```
3. Add the new callback URL to Meta Dashboard:
   ```
   https://new-url.ngrok-free.dev/api/auth/instagram/callback
   ```
4. Restart your dev server

## Verify It's Working

After adding the redirect URI, when you click "Connect Instagram" on your ngrok URL, it should:
1. Redirect to Instagram login ✅
2. After logging in, redirect back to: `https://untasting-overhugely-kortney.ngrok-free.dev/api/auth/instagram/callback` ✅
3. Then redirect to your app ✅


