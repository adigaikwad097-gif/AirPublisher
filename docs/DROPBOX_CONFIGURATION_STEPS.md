# Dropbox Configuration - Quick Setup (App Key/Secret - No OAuth!)

## ✅ Simple Setup - No OAuth Required!

Dropbox now uses **App Key/Secret authentication** directly - no OAuth flow needed!

Your Dropbox credentials:
- **App Key:** `ws1niyc5nkru706`
- **App Secret:** `qbgvm7qs15zexlt`

### Optional: Custom Base Folder

By default, videos are stored in `/AIR Publisher/creator_{id}/`

To use a different base folder, add to `.env.local`:
```env
DROPBOX_BASE_FOLDER=Your Company Name
```

This will create: `/Your Company Name/creator_{id}/`

## 🔧 Configuration Steps

### Step 1: Add Environment Variables

Add to your `.env.local`:

```env
# Dropbox App Key/Secret (no OAuth needed!)
DROPBOX_APP_KEY=ws1niyc5nkru706
DROPBOX_APP_SECRET=qbgvm7qs15zexlt

# Or use CLIENT_ID/CLIENT_SECRET (backward compatible)
# DROPBOX_CLIENT_ID=ws1niyc5nkru706
# DROPBOX_CLIENT_SECRET=qbgvm7qs15zexlt
```

**That's it!** No OAuth, no redirect URIs, no user connection needed.

---

## 🧪 Test the Setup

1. **Add environment variables** to `.env.local` (see above)

2. **Restart your dev server** (if running):
   ```bash
   # Stop current server (Ctrl+C)
   npm run dev
   ```

3. **Go to Settings:**
   - Navigate to: http://localhost:3000/settings/connections
   - You should see "Dropbox Storage" card showing "Configured"

4. **Upload a video:**
   - Go to Upload page
   - Upload a test video
   - Check Dropbox: `/airpublisher/creator_{your_id}/`
   - Video should appear automatically!

---

## 📁 What Happens Next

When you upload a video:
1. Video is uploaded to Dropbox
2. Stored in: `/airpublisher/creator_{your_creator_id}/` (uses your existing `airpublisher` folder)
3. Creator folder is created automatically if it doesn't exist
4. Video URL is saved in database
5. You can then publish to YouTube/Instagram/TikTok using the Dropbox URL

---

## 🐛 Troubleshooting

### "Invalid redirect_uri" Error
- Make sure the exact redirect URI is added in Dropbox app settings
- Check for trailing slashes (should be NO trailing slash)
- Verify http vs https matches your setup

### "Invalid client_id" Error
- Verify credentials in `.env.local`
- Restart dev server after adding env vars

### "Access denied" Error
- Check that all required scopes are enabled
- Verify redirect URI is whitelisted

---

## ✅ Checklist

- [x] Credentials added to `.env.local`
- [ ] Redirect URIs added in Dropbox app settings
- [ ] Permissions/scopes enabled
- [ ] Dev server restarted
- [ ] Dropbox connected in Settings → Connections
- [ ] Test video upload

Ready to go! 🚀

