# Instagram Business Login Setup

This guide explains how to configure Instagram OAuth using **Instagram Business Login** (not Facebook OAuth).

## Key Differences

**Instagram Business Login** uses:
- Instagram App ID and Secret (found in Instagram settings)
- `graph.instagram.com` for API calls (not `graph.facebook.com`)
- Instagram User access tokens (not Facebook Page tokens)

**NOT** Meta App ID/Secret from Facebook settings.

## Step 1: Get Instagram App ID and Secret

1. Go to [Meta for Developers Dashboard](https://developers.facebook.com/)
2. Select your app
3. Navigate to: **Instagram** > **API setup with Instagram login** > **3. Set up Instagram business login** > **Business login settings**
4. Copy the **Instagram App ID** and **Instagram App Secret**

**Important:** This is different from the Meta App ID/Secret found in App Settings > Basic.

## Step 2: Update Environment Variables

Add these to your `.env.local` file:

```bash
# Instagram Business Login (get from Instagram > API setup > Business login settings)
INSTAGRAM_APP_ID=your_instagram_app_id_here
INSTAGRAM_APP_SECRET=your_instagram_app_secret_here

# Optional: If you have a specific config_id for Instagram Login
INSTAGRAM_CONFIG_ID=your_config_id_here
```

**Note:** The code will fallback to `META_APP_ID` and `META_APP_SECRET` if `INSTAGRAM_APP_ID` is not set, but you should use Instagram-specific credentials for proper Instagram Business Login.

## Step 3: Configure Redirect URIs

Make sure your redirect URI is whitelisted in:

1. **Meta App Dashboard** > **Instagram** > **API setup with Instagram login** > **Business login settings**
   - Add: `http://localhost:3000/api/auth/instagram/callback`
   - Add: `https://your-domain.com/api/auth/instagram/callback`
   - Add: `https://your-ngrok-url.ngrok-free.app/api/auth/instagram/callback` (for testing)

2. **Meta App Dashboard** > **Settings** > **Basic** > **App Domains**
   - Add: `localhost` (for development)
   - Add: `your-domain.com` (for production)
   - Add: `your-ngrok-url.ngrok-free.app` (for testing)

3. **Meta App Dashboard** > **Facebook Login** > **Settings**
   - Enable **Client OAuth Login** and **Web OAuth Login**
   - Add redirect URIs in **Valid OAuth Redirect URIs**

## Step 4: Verify Configuration

The code now:

1. ✅ Uses `INSTAGRAM_APP_ID` (not `META_APP_ID`) - prioritized first
2. ✅ Uses `graph.instagram.com` for API calls (already implemented in callback)
3. ✅ Uses Instagram User access tokens (handled in callback)
4. ✅ Uses Facebook OAuth URL with `config_id` to force Instagram login

## How It Works

1. **OAuth Initiation** (`/api/auth/instagram/route.ts`):
   - Uses `INSTAGRAM_APP_ID` (or falls back to `META_APP_ID`)
   - Redirects to Facebook OAuth with `config_id` parameter to force Instagram login
   - Uses Instagram scopes: `instagram_business_basic`, `instagram_business_content_publish`

2. **OAuth Callback** (`/api/auth/instagram/callback/route.ts`):
   - Exchanges code for token using `https://api.instagram.com/oauth/access_token`
   - Exchanges for long-lived token using `https://graph.instagram.com/access_token`
   - Gets account info using `https://graph.instagram.com/{user_id}`
   - Stores tokens in `airpublisher_instagram_tokens` table

## Troubleshooting

### "Redirect URI not whitelisted"
- Add the exact redirect URI to **Instagram** > **Business login settings**
- Also add it to **Facebook Login** > **Settings** > **Valid OAuth Redirect URIs**

### "Still redirects to Facebook login"
- Ensure you're using `INSTAGRAM_APP_ID` (from Instagram settings, not Meta App settings)
- Check that `config_id` is set correctly (usually same as `app_id`)
- Try using the `INSTAGRAM_CONFIG_ID` environment variable if available

### "Invalid client ID"
- Double-check you're using Instagram App ID from **Instagram** > **Business login settings**
- Not the Meta App ID from **Settings** > **Basic**

## References

- [Instagram Business Login Documentation](https://developers.facebook.com/docs/instagram-platform/instagram-api-with-instagram-login/business-login)
- [Instagram API with Instagram Login Overview](https://developers.facebook.com/docs/instagram-platform/instagram-api-with-instagram-login/overview)






