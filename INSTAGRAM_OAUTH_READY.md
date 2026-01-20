# Instagram OAuth Ready ✅

Your `.env.local` has been updated with the correct Instagram App ID and Secret.

## Next Steps

### 1. Restart Dev Server

Stop your current dev server (if running) and restart it:

```bash
# Stop: Ctrl+C (if running)
# Start: 
npm run dev
```

This ensures the new environment variables are loaded.

### 2. Try Connecting Instagram

1. Go to your app: `http://localhost:3000/settings/connections`
2. Click **"Connect Instagram"**
3. You should now be redirected to Instagram's login page (not Facebook)
4. After logging in, you should be redirected back to your app

### 3. Verify It Works

After connecting, check:
- ✅ You're redirected back to `/settings/connections`
- ✅ The Instagram connection shows as **"Connected"** with a green status
- ✅ No errors in the browser console

## What We Fixed

1. ✅ **OAuth Endpoint**: Changed from Facebook OAuth to Instagram OAuth (`https://api.instagram.com/oauth/authorize`)
2. ✅ **App ID**: Using Instagram App ID (`836687999185692`) instead of Meta App ID
3. ✅ **App Secret**: Using Instagram App Secret instead of Meta App Secret
4. ✅ **Redirect URI**: Should be whitelisted in Instagram Business Login settings

## Troubleshooting

If you still see errors:

1. **"Invalid platform app"**: Double-check `INSTAGRAM_APP_ID` and `INSTAGRAM_APP_SECRET` in `.env.local`
2. **"Redirect URI not whitelisted"**: Add `http://localhost:3000/api/auth/instagram/callback` to Instagram Business Login settings
3. **Still redirects to Facebook**: Clear browser cache or try incognito mode

## Environment Variables Used

The code will prioritize:
- `INSTAGRAM_APP_ID` (if set) → falls back to `META_APP_ID`
- `INSTAGRAM_APP_SECRET` (if set) → falls back to `META_APP_SECRET`

Since you've set `INSTAGRAM_APP_ID=836687999185692` and `INSTAGRAM_APP_SECRET`, it will use the correct Instagram credentials.


