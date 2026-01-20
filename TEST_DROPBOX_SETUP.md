# Testing Dropbox Integration

## ✅ Code Verification

I've verified the code structure:

- ✅ **No linter errors** - Code compiles correctly
- ✅ **OAuth routes** - `/api/auth/dropbox` and `/api/auth/dropbox/callback` are implemented
- ✅ **Upload function** - `uploadToDropbox()` is properly integrated
- ✅ **Folder structure** - Uses `/airpublisher/creator_{id}/` format
- ✅ **Settings page** - Dropbox connection card is added

## ⚠️ Prerequisites to Test

Before testing, you need to:

### 1. Install Dropbox Package
```bash
npm install dropbox
```

### 2. Add Environment Variables
Add to `.env.local`:
```env
DROPBOX_CLIENT_ID=ws1niyc5nkru706
DROPBOX_CLIENT_SECRET=qbgvm7qs15zexlt
DROPBOX_REDIRECT_URI=http://localhost:3000/api/auth/dropbox/callback
```

### 3. Run Database Migration
Run `supabase/migrations/012_create_dropbox_tokens_table.sql` in Supabase SQL Editor

### 4. Configure Dropbox App
- Add redirect URIs in Dropbox app settings
- Enable required scopes/permissions

### 5. Restart Dev Server
```bash
npm run dev
```

## 🧪 Test Steps

Once prerequisites are done:

1. **Go to Settings:**
   ```
   http://localhost:3000/settings/connections
   ```

2. **Click "Connect Dropbox":**
   - Should redirect to Dropbox OAuth
   - Sign in and authorize
   - Should redirect back with success message

3. **Verify Connection:**
   - Dropbox card should show "Connected" badge
   - Check `airpublisher_dropbox_tokens` table in Supabase

4. **Test Upload:**
   - Go to Upload page
   - Upload a test video
   - Check Dropbox: `/airpublisher/creator_{your_id}/`
   - Video should appear in your Dropbox

## 🔍 What to Check

### In Browser Console:
- Look for: `[dropbox-auth]`, `[dropbox-callback]`, `[uploadToDropbox]` logs
- No errors during OAuth flow
- Upload completes successfully

### In Dropbox:
- Folder structure: `/airpublisher/creator_{id}/`
- Video file appears with correct name
- File is accessible (shared link works)

### In Database:
- `airpublisher_dropbox_tokens` table has your token
- `air_publisher_videos` table has `video_url` pointing to Dropbox

## 🐛 Common Issues

### "Dropbox not connected"
- Make sure you completed OAuth flow
- Check tokens exist in `airpublisher_dropbox_tokens` table

### "Invalid redirect_uri"
- Verify redirect URI in Dropbox app settings matches exactly
- Check `.env.local` has correct `DROPBOX_REDIRECT_URI`

### "Package not found"
- Run `npm install dropbox`
- Restart dev server

### "Folder creation failed"
- Check Dropbox app has `files.metadata.write` scope
- Verify base folder `/airpublisher/` exists or can be created

## ✅ Success Indicators

- ✅ OAuth redirects work
- ✅ Token stored in database
- ✅ Settings page shows "Connected"
- ✅ Video uploads to Dropbox
- ✅ Video URL saved in database
- ✅ File appears in `/airpublisher/creator_{id}/` folder

Ready to test! Complete the prerequisites first, then follow the test steps.


