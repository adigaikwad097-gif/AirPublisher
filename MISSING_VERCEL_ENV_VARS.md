# Missing Environment Variables in Vercel

Based on your current Vercel environment variables, here's what's **missing** and needs to be added:

## 🔴 CRITICAL - Must Add Immediately

### `NEXT_PUBLIC_APP_URL`
**This is why Instagram and TikTok OAuth are failing!**

```
Name: NEXT_PUBLIC_APP_URL
Value: https://airpublisher-tjha.vercel.app
Environment: All Environments (Production, Preview, Development)
```

**Why it's needed:**
- Used by OAuth routes to generate correct redirect URIs
- Instagram and TikTok OAuth are failing because redirect URIs don't match
- Buffer and Dropbox OAuth also need this

**How to add:**
1. Go to Vercel Dashboard → Your Project → **Settings** → **Environment Variables**
2. Click **Add New**
3. Set:
   - **Name**: `NEXT_PUBLIC_APP_URL`
   - **Value**: `https://airpublisher-tjha.vercel.app`
   - **Environment**: Select all (Production, Preview, Development)
4. Click **Save**
5. **Redeploy** your application

---

## 🟡 OPTIONAL - Add If Using These Features

### TikTok OAuth (Optional - has fallback credentials)
If you want to use your own TikTok app credentials instead of the hardcoded fallbacks:

```
Name: TIKTOK_CLIENT_KEY
Value: your_tiktok_client_key

Name: TIKTOK_CLIENT_SECRET
Value: your_tiktok_client_secret
```

**Note:** The code has fallback credentials, so TikTok OAuth should work without these. Only add if you want to use your own TikTok app.

---

### Buffer OAuth (Required if using Buffer)
If you're using Buffer integration:

```
Name: BUFFER_CLIENT_ID
Value: your_buffer_client_id

Name: BUFFER_CLIENT_SECRET
Value: your_buffer_client_secret
```

**Note:** If you're not using Buffer, you can skip these.

---

### Dropbox OAuth (Optional - n8n handles tokens)
If you want to use Dropbox OAuth directly (instead of n8n-managed):

```
Name: DROPBOX_CLIENT_ID
Value: your_dropbox_client_id

Name: DROPBOX_CLIENT_SECRET
Value: your_dropbox_client_secret
```

**Note:** Since you're using n8n for Dropbox uploads, you probably don't need these. n8n handles the Dropbox connection.

---

## ✅ Already Set (Good!)

You already have these set correctly:
- ✅ `NEXT_PUBLIC_SUPABASE_URL`
- ✅ `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- ✅ `SUPABASE_SERVICE_ROLE_KEY`
- ✅ `INSTAGRAM_APP_ID` (836687999185692)
- ✅ `INSTAGRAM_APP_SECRET`
- ✅ `META_APP_ID` (771396602627794)
- ✅ `YOUTUBE_CLIENT_ID`
- ✅ `YOUTUBE_CLIENT_SECRET`
- ✅ `N8N_WEBHOOK_URL_DROPBOX_UPLOAD`
- ✅ `N8N_API_KEY`

---

## 🚀 Quick Fix Steps

1. **Add `NEXT_PUBLIC_APP_URL`** (most important!)
   - Value: `https://airpublisher-tjha.vercel.app`
   - Environment: All Environments

2. **Redeploy** your application
   - Vercel will auto-deploy on next push, or
   - Go to Vercel Dashboard → Deployments → Click "Redeploy" on latest deployment

3. **Test OAuth flows**
   - Instagram OAuth should work now
   - TikTok OAuth should work now
   - YouTube OAuth should continue working

4. **Verify redirect URIs in OAuth apps**
   - Instagram: `https://airpublisher-tjha.vercel.app/api/auth/instagram/callback`
   - TikTok: `https://airpublisher-tjha.vercel.app/api/auth/tiktok/callback`
   - YouTube: `https://airpublisher-tjha.vercel.app/api/auth/youtube/callback`

---

## Why This Fixes the Issue

The `getAppUrl()` function checks:
1. `VERCEL_URL` (auto-set by Vercel) ✅
2. `NEXT_PUBLIC_APP_URL` (manual override) ❌ **MISSING**
3. `localhost` (fallback) ❌

Without `NEXT_PUBLIC_APP_URL`, the code might be using `VERCEL_URL` incorrectly or falling back to localhost, causing redirect URI mismatches.

By explicitly setting `NEXT_PUBLIC_APP_URL`, we ensure:
- ✅ Consistent redirect URIs across all OAuth flows
- ✅ Exact match with what's configured in OAuth apps
- ✅ No ambiguity about which URL to use


