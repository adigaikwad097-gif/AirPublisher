# Dropbox Integration - Implementation Summary

## ✅ What's Been Implemented

### 1. **Dropbox OAuth Flow**
- **Initiate Route:** `/api/auth/dropbox` - Starts OAuth flow
- **Callback Route:** `/api/auth/dropbox/callback` - Handles OAuth callback and stores tokens
- Supports ngrok URLs for local development
- Stores tokens in `airpublisher_dropbox_tokens` table

### 2. **Database Schema**
- **Migration:** `012_create_dropbox_tokens_table.sql`
- Table: `airpublisher_dropbox_tokens`
- Stores: `access_token`, `refresh_token`, `expires_at`, `creator_unique_identifier`
- Includes RLS policies for security

### 3. **Dropbox Client Library**
- **File:** `lib/dropbox/client.ts`
- Functions:
  - `getDropboxAccessToken()` - Retrieves access token for creator
  - `createDropboxClient()` - Creates Dropbox SDK client
  - `getCreatorDropboxFolder()` - Returns folder path: `/AIR Publisher/creator_{id}`
  - `uploadToDropbox()` - Uploads file to creator's folder
  - `storeDropboxTokens()` - Saves tokens to database

### 4. **Video Upload Flow**
- **Updated:** `app/api/videos/[id]/upload/route.ts`
- Now uploads to Dropbox instead of Supabase Storage
- Creates creator-specific folders automatically
- Returns Dropbox shared link (direct download URL)

### 5. **Upload Form Changes**
- **Updated:** `components/upload/upload-form.tsx`
- Removed platform selection (videos are always drafts)
- Videos are uploaded to Dropbox first
- User selects platform when publishing from "My Videos"

### 6. **Settings Page**
- **Updated:** `app/(dashboard)/settings/connections/page.tsx`
- Added Dropbox connection card
- Shows connection status
- "Connect Dropbox" button

---

## 📋 Next Steps for You

### 1. **Install Dropbox SDK**
```bash
npm install dropbox
```

### 2. **Create Dropbox App**
Follow `DROPBOX_SETUP_GUIDE.md` to:
- Create app at https://www.dropbox.com/developers/apps
- Get App Key (Client ID) and App Secret
- Configure redirect URIs

### 3. **Add Environment Variables**
Add to `.env.local`:
```env
DROPBOX_CLIENT_ID=your_app_key_here
DROPBOX_CLIENT_SECRET=your_app_secret_here
DROPBOX_REDIRECT_URI=http://localhost:3000/api/auth/dropbox/callback
```

### 4. **Run Migration**
Apply the migration in Supabase:
```sql
-- Run: supabase/migrations/012_create_dropbox_tokens_table.sql
```

### 5. **Test the Flow**
1. Go to Settings → Connections
2. Click "Connect Dropbox"
3. Authorize the app
4. Upload a video
5. Check Dropbox folder: `/AIR Publisher/creator_{your_id}/`

---

## 🔄 New Video Flow

### Before (Old):
1. User uploads video → Supabase Storage
2. User selects platform → Video published immediately

### After (New):
1. User uploads video → **Dropbox** (creator's folder)
2. Video saved as **draft** (no platform selected)
3. User goes to "My Videos"
4. User selects platform → Video published

---

## 📁 Folder Structure

Videos are stored in your existing `/airpublisher/` folder:

```
/airpublisher/                                    ← Your existing folder
  ├── creator_735175e5_1768726539_f7262d3a/      ← Creator 1's folder (auto-created)
  │   ├── {video-id-1}.mp4
  │   ├── {video-id-2}.mp4
  │   └── ...
  ├── creator_abc123_xyz789/                     ← Creator 2's folder (auto-created)
  │   └── ...
```

- **Base folder:** `/airpublisher/` (uses your existing folder)
- **Creator folders:** Created automatically if they don't exist
- **Format:** `/airpublisher/creator_{creator_unique_identifier}/`

---

## 🔐 Security

- **RLS Policies:** Only creators can access their own tokens
- **OAuth Scopes:** Minimal required permissions
- **Token Storage:** Encrypted in Supabase
- **Folder Isolation:** Each creator has separate folder

---

## 🐛 Troubleshooting

### "Dropbox not connected"
- Make sure you've connected Dropbox in Settings → Connections
- Check that tokens are stored in `airpublisher_dropbox_tokens` table

### "Failed to upload to Dropbox"
- Verify Dropbox app has correct scopes enabled
- Check that redirect URI is whitelisted in Dropbox app settings
- Ensure access token hasn't expired

### "Folder creation failed"
- Dropbox will auto-create folders on first upload
- If folder exists, upload will still work (overwrites file)

---

## 📝 Notes

- Videos are **always drafts** when uploaded
- Platform selection happens when publishing from "My Videos"
- Dropbox URLs are direct download links (public)
- Each creator's folder is isolated for privacy

Ready to test! 🚀

