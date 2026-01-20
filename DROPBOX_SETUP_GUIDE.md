# Dropbox Setup Guide for AIR Publisher

This guide will help you set up Dropbox integration to store videos in creator-specific folders.

## Step 1: Create Dropbox App

1. Go to [Dropbox App Console](https://www.dropbox.com/developers/apps)
2. Click **"Create app"**
3. Choose:
   - **Choose an API:** Scoped access
   - **Choose the type of access you need:** Full Dropbox
   - **Name your app:** `AIR Publisher` (or your preferred name)
4. Click **"Create app"**

## Step 2: Get App Credentials

After creating the app, you'll see:

1. **App key** (Client ID)
2. **App secret** (Client Secret)

**⚠️ Save these immediately - you'll need them for `.env.local`**

## Step 3: Configure App Settings

1. In your Dropbox app settings, go to **"Permissions"** tab
2. Enable the following scopes:
   - ✅ `files.content.write` - Upload files
   - ✅ `files.content.read` - Read/download files
   - ✅ `files.metadata.write` - Create folders
   - ✅ `files.metadata.read` - List files/folders

3. Go to **"Settings"** tab
4. Add **OAuth redirect URIs:**
   - For local dev: `http://localhost:3000/api/auth/dropbox/callback`
   - For production: `https://your-domain.com/api/auth/dropbox/callback`
   - For ngrok: `https://your-ngrok-url.ngrok-free.dev/api/auth/dropbox/callback`

## Step 4: Add Credentials to Environment

Add to your `.env.local`:

```env
# Dropbox OAuth Configuration
DROPBOX_CLIENT_ID=your_app_key_here
DROPBOX_CLIENT_SECRET=your_app_secret_here
DROPBOX_REDIRECT_URI=http://localhost:3000/api/auth/dropbox/callback
```

## Step 5: Folder Structure

Each creator will have their own Dropbox folder:

```
/AIR Publisher/
  ├── creator_735175e5_1768726539_f7262d3a/
  │   ├── video-1.mp4
  │   ├── video-2.mp4
  │   └── thumbnails/
  │       ├── video-1-thumb.jpg
  │       └── video-2-thumb.jpg
  ├── creator_abc123_xyz789/
  │   └── ...
```

Folder naming: `creator_{creator_unique_identifier}`

## Step 6: Install Dropbox SDK

Run in your terminal:

```bash
npm install dropbox
```

## Step 7: Test Connection

After setup, test by:
1. Uploading a video in AIR Publisher
2. Check Dropbox folder is created
3. Verify video appears in creator's folder

---

## Troubleshooting

### "Invalid redirect_uri"
- Make sure redirect URI in Dropbox app settings matches exactly
- Check for trailing slashes
- Verify http vs https

### "Invalid client_id"
- Verify `DROPBOX_CLIENT_ID` in `.env.local`
- Restart dev server after adding env vars

### "Access denied"
- Check OAuth scopes are enabled in Dropbox app
- Verify redirect URI is whitelisted

---

## Next Steps

After setup:
1. Videos will upload to Dropbox automatically
2. Each creator gets their own folder
3. Video URLs will be Dropbox shared links
4. Publishing uses Dropbox URLs

Ready to implement! Share your Dropbox App Key and Secret when ready.


