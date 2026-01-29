# Vercel OAuth Redirect URLs Setup Guide

Your Vercel URL: **https://airpublisher-tjha.vercel.app/**

## OAuth Redirect URLs to Add

### 1. YouTube OAuth
**Where to add:** [Google Cloud Console](https://console.cloud.google.com/apis/credentials)

1. Go to **APIs & Services** → **Credentials**
2. Find your OAuth 2.0 Client ID
3. Click **Edit**
4. Under **Authorized redirect URIs**, add:
   ```
   https://airpublisher-tjha.vercel.app/api/auth/youtube/callback
   ```
5. Click **Save**

**Callback route:** `/api/auth/youtube/callback`

---

### 2. Instagram OAuth
**Where to add:** [Meta for Developers](https://developers.facebook.com/apps/)

1. Go to your Instagram App
2. Navigate to **Instagram > API setup with Instagram login > Business login settings**
3. Under **Valid OAuth Redirect URIs**, add:
   ```
   https://airpublisher-tjha.vercel.app/api/auth/instagram/callback
   ```
4. Click **Save Changes**

**Callback route:** `/api/auth/instagram/callback`

**Note:** Instagram uses the Instagram App ID (not Meta App ID). Make sure you're using the correct one.

---

### 3. TikTok OAuth
**Where to add:** [TikTok Developers Portal](https://developers.tiktok.com/)

1. Go to your TikTok App
2. Navigate to **Basic Information** → **Platform information**
3. Under **Redirect domain**, add:
   ```
   airpublisher-tjha.vercel.app
   ```
   (Note: Just the domain, not the full URL)
4. Under **Redirect URI**, add:
   ```
   https://airpublisher-tjha.vercel.app/api/auth/tiktok/callback
   ```
5. Click **Save**

**Callback route:** `/api/auth/tiktok/callback`

---

### 4. Dropbox OAuth
**Where to add:** [Dropbox App Console](https://www.dropbox.com/developers/apps)

1. Go to your Dropbox App
2. Navigate to **Settings** → **OAuth 2**
3. Under **Redirect URIs**, add:
   ```
   https://airpublisher-tjha.vercel.app/api/auth/dropbox/callback
   ```
4. Click **Save**

**Callback route:** `/api/auth/dropbox/callback`

**Note:** Dropbox tokens are managed by n8n, but you still need this redirect URI for initial setup.

---

### 5. Buffer OAuth
**Where to add:** [Buffer Developers](https://buffer.com/developers/apps)

1. Go to your Buffer App
2. Navigate to **Settings** → **Redirect URIs**
3. Add:
   ```
   https://airpublisher-tjha.vercel.app/api/auth/buffer/callback
   ```
4. Click **Save**

**Callback route:** `/api/auth/buffer/callback`

---

### 6. Supabase Auth
**Where to add:** [Supabase Dashboard](https://app.supabase.com/)

1. Go to your Supabase project
2. Navigate to **Authentication** → **URL Configuration**
3. Under **Site URL**, set:
   ```
   https://airpublisher-tjha.vercel.app
   ```
4. Under **Redirect URLs**, add:
   ```
   https://airpublisher-tjha.vercel.app/**
   ```
   (Wildcard allows all paths)
5. Click **Save**

**Note:** Supabase handles auth callbacks automatically with the wildcard pattern.

---

## n8n Configuration Updates

### Update Dropbox Upload Callback URL

In your n8n workflow for Dropbox uploads:

1. Open the workflow: **Dropbox Upload**
2. Find the **HTTP Request** node that calls back to your app
3. Update the URL to:
   ```
   https://airpublisher-tjha.vercel.app/api/webhooks/n8n/upload-complete
   ```
4. Save and activate the workflow

**Webhook route:** `/api/webhooks/n8n/upload-complete`

---

## Vercel Environment Variables

Make sure these are set in your Vercel project settings:

### Required Variables:
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# OAuth Credentials
YOUTUBE_CLIENT_ID=your_youtube_client_id
YOUTUBE_CLIENT_SECRET=your_youtube_client_secret
INSTAGRAM_APP_ID=your_instagram_app_id
INSTAGRAM_APP_SECRET=your_instagram_app_secret
TIKTOK_CLIENT_KEY=your_tiktok_client_key
TIKTOK_CLIENT_SECRET=your_tiktok_client_secret
DROPBOX_CLIENT_ID=your_dropbox_client_id
DROPBOX_CLIENT_SECRET=your_dropbox_client_secret
BUFFER_CLIENT_ID=your_buffer_client_id
BUFFER_CLIENT_SECRET=your_buffer_client_secret

# n8n
N8N_WEBHOOK_URL_DROPBOX_UPLOAD=https://support-team.app.n8n.cloud/webhook/uploaddropbox
N8N_API_KEY=your_n8n_api_key
```

### Optional Variables:
```env
# App URL (Vercel sets VERCEL_URL automatically, but you can override)
NEXT_PUBLIC_APP_URL=https://airpublisher-tjha.vercel.app
```

**Note:** `VERCEL_URL` is automatically set by Vercel, so you don't need to manually set `NEXT_PUBLIC_APP_URL` unless you want to override it.

---

## Testing Checklist

After updating all redirect URLs:

- [ ] **YouTube OAuth** - Try connecting YouTube account
- [ ] **Instagram OAuth** - Try connecting Instagram account
- [ ] **TikTok OAuth** - Try connecting TikTok account
- [ ] **Dropbox OAuth** - Try connecting Dropbox account (if needed)
- [ ] **Buffer OAuth** - Try connecting Buffer account
- [ ] **File Upload** - Test video upload (should work without timeout!)
- [ ] **n8n Callback** - Verify n8n receives upload completion callbacks

---

## Quick Reference: All Callback URLs

```
YouTube:    https://airpublisher-tjha.vercel.app/api/auth/youtube/callback
Instagram:  https://airpublisher-tjha.vercel.app/api/auth/instagram/callback
TikTok:     https://airpublisher-tjha.vercel.app/api/auth/tiktok/callback
Dropbox:    https://airpublisher-tjha.vercel.app/api/auth/dropbox/callback
Buffer:     https://airpublisher-tjha.vercel.app/api/auth/buffer/callback
Supabase:   https://airpublisher-tjha.vercel.app/** (wildcard)
n8n:        https://airpublisher-tjha.vercel.app/api/webhooks/n8n/upload-complete
```

---

## Important Notes

1. **HTTPS Required**: All OAuth providers require HTTPS in production. Vercel provides this automatically.

2. **Exact Match**: OAuth redirect URIs must match **exactly** (including trailing slashes, protocol, etc.)

3. **No Localhost in Production**: Remove any `localhost:3000` redirect URIs from production OAuth apps (keep them only for local development)

4. **Vercel Auto-Deploy**: After pushing to GitHub, Vercel automatically deploys. No manual deployment needed.

5. **Environment Variables**: Make sure all environment variables are set in Vercel project settings (not just `.env.local`)

---

## Troubleshooting

### OAuth redirect not working?
- Check that the redirect URI matches **exactly** (case-sensitive)
- Verify HTTPS is used (not HTTP)
- Check browser console for errors
- Verify environment variables are set in Vercel

### n8n callback not receiving data?
- Verify the callback URL in n8n workflow matches exactly
- Check n8n execution logs
- Verify `N8N_API_KEY` is set in Vercel environment variables

### File upload timeout?
- This should be fixed with Vercel! If you still see timeouts, check:
  - File size (Vercel has 4.5MB limit for serverless functions)
  - n8n webhook is receiving the file
  - Check Vercel function logs

---

## Next Steps

1. ✅ Update all OAuth redirect URLs (use the list above)
2. ✅ Update n8n callback URL
3. ✅ Verify environment variables in Vercel
4. ✅ Test OAuth flows
5. ✅ Test file upload
6. ✅ Celebrate! 🎉

Your app is now live at: **https://airpublisher-tjha.vercel.app/**


