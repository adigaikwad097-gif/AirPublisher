# OAuth Redirect URIs Setup for Live Server

**Live Server URL:** `http://93.127.216.83:3003`

## Required Redirect URIs

You need to add these **exact** redirect URIs to each platform's OAuth app settings:

### 1. Instagram OAuth
**Redirect URI:** `http://93.127.216.83:3003/api/auth/instagram/callback`

### 2. TikTok OAuth
**Redirect URI:** `http://93.127.216.83:3003/api/auth/tiktok/callback`

### 3. YouTube OAuth
**Redirect URI:** `http://93.127.216.83:3003/api/auth/youtube/callback`

### 4. Dropbox OAuth
**Redirect URI:** `http://93.127.216.83:3003/api/auth/dropbox/callback`

---

## Step-by-Step Instructions

### Instagram (Meta/Facebook)

1. Go to [Facebook Developers](https://developers.facebook.com/)
2. Select your **Instagram App** (or Facebook App with Instagram permissions)
3. Go to **Settings** → **Basic**
4. Scroll to **"Valid OAuth Redirect URIs"** section
5. **Remove ALL existing redirect URIs** (localhost, vercel, ngrok, etc.)
6. **Add ONLY:** `http://93.127.216.83:3003/api/auth/instagram/callback`
7. Click **Save Changes**

**Important:** 
- The redirect URI must match **exactly** (no trailing slash, correct protocol)
- If you have multiple apps, make sure you're editing the correct one (check App ID matches)

---

### TikTok

1. Go to [TikTok Developers Portal](https://developers.tiktok.com/)
2. Select your **TikTok App**
3. Go to **"Basic Information"** or **"OAuth Settings"**
4. Find **"Redirect URI"** or **"Valid OAuth Redirect URIs"** section
5. **Remove ALL existing redirect URIs**
6. **Add ONLY:** `http://93.127.216.83:3003/api/auth/tiktok/callback`
7. Click **Save**

**Important:**
- TikTok is strict about redirect URI matching
- Make sure there are no extra spaces or characters

---

### YouTube (Google Cloud Console)

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your **Project**
3. Go to **APIs & Services** → **Credentials**
4. Click on your **OAuth 2.0 Client ID** (the one used for YouTube)
5. Under **"Authorized redirect URIs"**
6. **Remove ALL existing redirect URIs**
7. **Add ONLY:** `http://93.127.216.83:3003/api/auth/youtube/callback`
8. Click **Save**

**Important:**
- Make sure you're editing the correct OAuth client
- Check the Client ID matches what's in your environment variables

---

### Dropbox

1. Go to [Dropbox App Console](https://www.dropbox.com/developers/apps)
2. Select your **Dropbox App**
3. Go to **Settings** tab
4. Find **"OAuth 2"** section
5. Under **"Redirect URIs"**
6. **Remove ALL existing redirect URIs**
7. **Add ONLY:** `http://93.127.216.83:3003/api/auth/dropbox/callback`
8. Click **Save**

---

## Verify Environment Variable

Make sure your server has the correct `NEXT_PUBLIC_APP_URL` set:

```bash
# On the server, check:
echo $NEXT_PUBLIC_APP_URL

# Should output:
# http://93.127.216.83:3003
```

If it's not set, add it to your `.env` file on the server:

```bash
cd /opt/apps/air-publisher
echo "NEXT_PUBLIC_APP_URL=http://93.127.216.83:3003" >> .env
```

Then restart PM2:
```bash
pm2 restart air-publisher --update-env
```

---

## Testing OAuth Connections

### Test Instagram

1. Go to: `http://93.127.216.83:3003/settings/connections`
2. Click **"Connect Instagram"**
3. You should be redirected to Facebook/Instagram login
4. After authorizing, you should be redirected back to: `http://93.127.216.83:3003/settings/connections`
5. Check if Instagram shows as "Connected"

**If it fails:**
- Check browser console for errors
- Check server logs: `pm2 logs air-publisher | grep -i instagram`
- Verify redirect URI matches exactly in Facebook app settings

### Test TikTok

1. Go to: `http://93.127.216.83:3003/settings/connections`
2. Click **"Connect TikTok"**
3. You should be redirected to TikTok login
4. After authorizing, you should be redirected back
5. Check if TikTok shows as "Connected"

**If it fails:**
- Check browser console for errors
- Check server logs: `pm2 logs air-publisher | grep -i tiktok`
- Verify redirect URI matches exactly in TikTok app settings

### Test YouTube

1. Go to: `http://93.127.216.83:3003/settings/connections`
2. Click **"Connect YouTube"**
3. You should be redirected to Google login
4. After authorizing, you should be redirected back
5. Check if YouTube shows as "Connected"

**If it fails:**
- Check browser console for errors
- Check server logs: `pm2 logs air-publisher | grep -i youtube`
- Verify redirect URI matches exactly in Google Cloud Console

### Test Dropbox

1. Go to: `http://93.127.216.83:3003/settings/connections`
2. Click **"Connect Dropbox"**
3. You should be redirected to Dropbox login
4. After authorizing, you should be redirected back
5. Check if Dropbox shows as "Connected"

---

## Common Issues

### "Redirect URI mismatch" Error

**Cause:** The redirect URI in OAuth app settings doesn't match what the code is sending.

**Fix:**
1. Check server logs to see what redirect URI is being sent:
   ```bash
   pm2 logs air-publisher | grep -i "redirect"
   ```
2. Copy the **exact** redirect URI from logs
3. Make sure it matches **exactly** in OAuth app settings (character-for-character)
4. Remove all other redirect URIs

### Multiple Redirect URIs

**Problem:** Having multiple redirect URIs can cause confusion.

**Fix:** Remove ALL redirect URIs and add ONLY the live server one.

### HTTP vs HTTPS

**Problem:** Some platforms require HTTPS, but your server is HTTP.

**Note:** For now, we're using HTTP (`http://93.127.216.83:3003`). If a platform requires HTTPS:
1. Set up SSL certificate (Let's Encrypt)
2. Update redirect URIs to use `https://`
3. Update `NEXT_PUBLIC_APP_URL` to `https://93.127.216.83:3003`

---

## Checklist

- [ ] Instagram redirect URI added: `http://93.127.216.83:3003/api/auth/instagram/callback`
- [ ] TikTok redirect URI added: `http://93.127.216.83:3003/api/auth/tiktok/callback`
- [ ] YouTube redirect URI added: `http://93.127.216.83:3003/api/auth/youtube/callback`
- [ ] Dropbox redirect URI added: `http://93.127.216.83:3003/api/auth/dropbox/callback`
- [ ] All old redirect URIs removed (localhost, vercel, ngrok, etc.)
- [ ] `NEXT_PUBLIC_APP_URL=http://93.127.216.83:3003` set on server
- [ ] PM2 restarted with `--update-env` flag
- [ ] Tested Instagram connection
- [ ] Tested TikTok connection
- [ ] Tested YouTube connection
- [ ] Tested Dropbox connection

---

## Quick Test Command

After updating redirect URIs, test each one:

```bash
# Test Instagram
curl -I "http://93.127.216.83:3003/api/auth/instagram/callback?code=test&state=test"

# Test TikTok
curl -I "http://93.127.216.83:3003/api/auth/tiktok/callback?code=test&state=test"

# Test YouTube
curl -I "http://93.127.216.83:3003/api/auth/youtube/callback?code=test&state=test"

# Test Dropbox
curl -I "http://93.127.216.83:3003/api/auth/dropbox/callback?code=test&state=test"
```

These should return HTTP responses (not 404). If you get 404, the routes aren't working.

---

## Next Steps

After OAuth is working:
1. ✅ Test each platform connection
2. ✅ Verify tokens are being stored in database
3. ✅ Test posting a video to each platform
4. ✅ Set up n8n automations for scheduled posting

