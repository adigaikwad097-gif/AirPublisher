# Test OAuth Flows

## 1. Verify Redirect URIs Are Registered

Make sure these exact redirect URIs are registered in your OAuth apps:

### YouTube (Google OAuth)
```
https://pezvnqhexxttlhcnbtta.supabase.co/functions/v1/alyan_youtubeauth
```

### Instagram (Facebook OAuth)
```
https://pezvnqhexxttlhcnbtta.supabase.co/functions/v1/alyan_instagramauth
```

### TikTok
```
https://pezvnqhexxttlhcnbtta.supabase.co/functions/v1/alyan_tiktokauth
```
(If you have a TikTok Edge Function)

## 2. Test the Flows

### Test YouTube
1. Go to: `http://aircreator.cloud:3003/settings/connections`
2. Click "Connect YouTube"
3. You should be redirected to Google OAuth
4. After authorizing, you should be redirected back

### Test Instagram
1. Go to: `http://aircreator.cloud:3003/settings/connections`
2. Click "Connect Instagram"
3. You should be redirected to Instagram OAuth
4. After authorizing, you should be redirected back

## 3. Check Edge Function Logs

If you get errors, check the logs in Supabase Dashboard:
1. Go to Supabase Dashboard → Edge Functions
2. Click on `alyan_youtubeauth` or `alyan_instagramauth`
3. Click "Logs" tab
4. Look for the debug messages:
   - `[alyan_youtubeauth] Environment check:`
   - `[alyan_instagramauth] Environment check:`

These will show if the secrets are being read correctly.

## 4. Common Issues

### "Invalid redirect_uri"
- Make sure the redirect URI in your OAuth app settings matches EXACTLY (including https://, no trailing slash)
- The redirect URI should be: `https://pezvnqhexxttlhcnbtta.supabase.co/functions/v1/alyan_youtubeauth` (or `alyan_instagramauth`)

### "OAuth not configured"
- Check that secrets are set in Supabase Dashboard → Edge Functions → Secrets
- Make sure you redeployed the Edge Functions after setting secrets
- Check the logs to see which environment variables are missing

### "State mismatch" or "Invalid state"
- This usually means the state parameter is being double-encoded
- The fix has been applied - make sure the Edge Functions are redeployed

