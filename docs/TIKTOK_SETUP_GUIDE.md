# TikTok Developer App Setup Guide

This guide will help you set up a TikTok developer app and obtain the credentials needed to connect TikTok accounts to AirPublisher.

## Step 1: Create a TikTok Developer Account

1. Go to [TikTok for Developers](https://developers.tiktok.com/)
2. Click **"Log in"** or **"Sign up"** in the top right
3. Log in with your TikTok account (or create one if you don't have one)

## Step 2: Create a TikTok App

1. Once logged in, go to the [TikTok Developers Portal](https://developers.tiktok.com/apps/)
2. Click **"Create an app"** or **"Add an app"**
3. Fill in the app information:
   - **App name**: `AirPublisher` (or your preferred name)
   - **App icon**: Upload a logo/icon (optional but recommended)
   - **App description**: Describe your app (e.g., "Content publishing and scheduling platform")
   - **Website URL**: Your website URL (e.g., `https://airpublisher.com`)
   - **Privacy Policy URL**: Link to your privacy policy
   - **Terms of Service URL**: Link to your terms of service (optional)

4. Click **"Submit"** or **"Create"**

## Step 3: Configure App Settings

After creating your app:

1. Go to your app dashboard
2. Click on **"Basic Information"** or **"Settings"**

### Get Your Credentials

You'll see:
- **Client Key** (also called **App ID** or **Client ID**)
- **Client Secret** (also called **App Secret**)

**⚠️ Save these immediately - you'll need them for your `.env.local` file**

### Add Redirect URI

1. Go to **"Redirect URI"** or **"OAuth Settings"** section
2. Add your redirect URIs:

   For local development:
   ```
   http://localhost:3000/api/auth/tiktok/callback
   ```

   For ngrok (if using):
   ```
   https://your-ngrok-url.ngrok-free.dev/api/auth/tiktok/callback
   ```

   For production:
   ```
   https://your-production-domain.com/api/auth/tiktok/callback
   ```

3. Click **"Save"** or **"Submit"**

## Step 4: Request Permissions

1. Go to **"Products"** or **"Permissions"** in your app dashboard
2. Enable the following permissions/scopes:
   - ✅ **User info.basic** - Basic user information
   - ✅ **Video upload** - Upload videos to TikTok
   - ✅ **Video publish** - Publish videos to TikTok

3. Submit for review if required (some permissions may require TikTok's approval)

## Step 5: Add Credentials to Your Project

1. Open your `.env.local` file in the project root
2. Add your TikTok credentials:

```env
# TikTok OAuth Configuration
TIKTOK_CLIENT_KEY=your_client_key_here
TIKTOK_CLIENT_SECRET=your_client_secret_here
```

3. Replace `your_client_key_here` and `your_client_secret_here` with your actual values from Step 3

## Step 6: Restart Your Dev Server

After adding the credentials:

```bash
# Stop your current dev server (Ctrl+C)
# Then restart it
npm run dev
```

## Step 7: Test the Connection

1. Go to your AirPublisher app: `http://localhost:3000/settings/connections`
2. Click **"Connect TikTok"**
3. You'll be redirected to TikTok to authorize the app
4. After authorizing, you'll be redirected back to AirPublisher
5. TikTok should now show as "Connected" on the settings page

## Troubleshooting

### "OAuth not configured" Error

- Make sure `TIKTOK_CLIENT_KEY` and `TIKTOK_CLIENT_SECRET` are set in `.env.local`
- Restart your dev server after adding environment variables
- Check that there are no typos in the variable names

### "Invalid redirect_uri" Error

- Make sure the exact redirect URI is added in TikTok's app settings
- The redirect URI must match exactly (including `http://` vs `https://`)
- If using ngrok, add the ngrok URL to TikTok's redirect URI list

### "Missing code" or "Invalid state" Errors

- Make sure you're clicking the "Connect TikTok" button from the authenticated settings page
- Clear your browser cookies and try again
- Check that your creator profile is set up

### "Token exchange failed" Error

- Verify your `TIKTOK_CLIENT_SECRET` is correct
- Check that your app has the required permissions enabled
- Make sure your TikTok app is in "Development" mode (some features may require app review)

## TikTok API Documentation

- [TikTok API Overview](https://developers.tiktok.com/doc/)
- [OAuth 2.0 Flow](https://developers.tiktok.com/doc/tiktok-api-v2-oauth2-authorize/)
- [Video Upload API](https://developers.tiktok.com/doc/tiktok-api-v2-post-video-initialize/)

## Notes

- TikTok apps start in **Development** mode
- Some permissions require TikTok's approval before going live
- Test users need to be added to your app in Development mode
- Once approved, your app can request permissions from any TikTok user

## Next Steps

After setting up TikTok:
1. Test connecting a TikTok account
2. Verify tokens are stored correctly in `airpublisher_tiktok_tokens` table
3. Set up automatic token refresh (if needed)
4. Test video upload/publishing flow

---

**Need Help?** Check the terminal logs when connecting - they'll show detailed error messages if something goes wrong.






