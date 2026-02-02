# OAuth Routes Updated to Use Edge Functions

All OAuth routes have been updated to use Supabase Edge Functions.

## Updated Routes

### YouTube OAuth
- ✅ `/api/auth/youtube` - Redirects to Edge Function for OAuth initiation
- ✅ `/api/auth/youtube/callback` - Forwards callback to Edge Function

### Instagram OAuth
- ✅ `/api/auth/instagram` - Redirects to Edge Function for OAuth initiation
- ✅ `/api/auth/instagram/callback` - Forwards callback to Edge Function

## Edge Functions

### YouTube (`alyan_youtubeauth`)
- **Redirect URI**: `https://pezvnqhexxttlhcnbtta.supabase.co/functions/v1/alyan_youtubeauth`
- Handles both `init` and `callback` actions
- Properly URL-encodes redirect_uri in OAuth request

### Instagram (`alyan_instagramauth`)
- **Redirect URI**: `https://pezvnqhexxttlhcnbtta.supabase.co/functions/v1/alyan_instagramauth`
- Handles both `init` and `callback` actions
- Properly URL-encodes redirect_uri in OAuth request

## OAuth App Configuration

Make sure these redirect URIs are registered in your OAuth apps:

### YouTube (Google Cloud Console)
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to APIs & Services → Credentials
3. Select your OAuth 2.0 Client ID
4. Add to **Authorized redirect URIs**:
   ```
   https://pezvnqhexxttlhcnbtta.supabase.co/functions/v1/alyan_youtubeauth
   ```

### Instagram (Meta for Developers)
1. Go to [Meta for Developers](https://developers.facebook.com/)
2. Select your app
3. Go to Instagram → Basic Display or Instagram Graph API
4. Add to **Valid OAuth Redirect URIs**:
   ```
   https://pezvnqhexxttlhcnbtta.supabase.co/functions/v1/alyan_instagramauth
   ```

## Next Steps

1. **Redeploy Edge Functions** to apply the URL encoding fix:
   ```bash
   supabase functions deploy alyan_youtubeauth
   supabase functions deploy alyan_instagramauth
   ```

2. **Verify Redirect URIs** are registered in OAuth apps (see above)

3. **Test the flows**:
   - Go to `http://aircreator.cloud:3003/settings/connections`
   - Click "Connect YouTube"
   - Click "Connect Instagram"

## Troubleshooting

### "Invalid redirect_uri" Error
- Make sure the redirect URI in your OAuth app settings matches EXACTLY (including `https://`, no trailing slash)
- The redirect URI should be: `https://pezvnqhexxttlhcnbtta.supabase.co/functions/v1/alyan_youtubeauth` (or `alyan_instagramauth`)

### "OAuth not configured" Error
- Check that secrets are set in Supabase Dashboard → Edge Functions → Secrets
- Make sure you redeployed the Edge Functions after setting secrets
- Check the Edge Function logs for debug messages showing which environment variables are missing

