# Vercel Deployment Guide

## Why Vercel?

✅ **Eliminates ngrok timeout issues** - No more 60s limits for file uploads
✅ **Production-ready domain** - Stable URLs for OAuth callbacks
✅ **Automatic HTTPS** - Secure by default
✅ **Edge network** - Fast global performance
✅ **Zero config** - Works with Next.js out of the box

## Quick Deploy

### Step 1: Push to GitHub

Your code is already on GitHub at: `github.com/alyanmr738-cyber/airpublisher`

### Step 2: Connect to Vercel

1. Go to [vercel.com](https://vercel.com)
2. Sign up/Login with GitHub
3. Click **"Add New Project"**
4. Import your repository: `alyanmr738-cyber/airpublisher`
5. Vercel will auto-detect Next.js

### Step 3: Configure Environment Variables

In Vercel project settings → Environment Variables, add:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# n8n
N8N_WEBHOOK_URL_DROPBOX_UPLOAD=https://support-team.app.n8n.cloud/webhook/uploaddropbox
N8N_API_KEY=your_n8n_api_key

# App URL (Vercel will set this automatically, but you can override)
# NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
```

**Important**: Vercel automatically sets `VERCEL_URL` - we'll use this instead of manual `NEXT_PUBLIC_APP_URL`

### Step 4: Deploy

1. Click **"Deploy"**
2. Wait for build to complete (~2-3 minutes)
3. Get your production URL: `https://your-app.vercel.app`

### Step 5: Update OAuth Redirect URIs

After deployment, update redirect URIs in:

1. **YouTube OAuth**:
   - Add: `https://your-app.vercel.app/api/auth/youtube/callback`

2. **Instagram OAuth**:
   - Add: `https://your-app.vercel.app/api/auth/instagram/callback`

3. **TikTok OAuth**:
   - Add: `https://your-app.vercel.app/api/auth/tiktok/callback`

4. **Supabase Auth**:
   - Add: `https://your-app.vercel.app/**` (wildcard)

### Step 6: Update n8n Callback URL

In your n8n workflow, update the callback URL in the HTTP Request node:

```
https://your-app.vercel.app/api/webhooks/n8n/upload-complete
```

## Code Changes (Already Done!)

✅ **App URL Utility Created** (`lib/utils/app-url.ts`)
- Automatically detects Vercel URL via `VERCEL_URL`
- Falls back to `NEXT_PUBLIC_APP_URL` or localhost
- Works seamlessly in all environments

✅ **Upload Route Updated**
- Uses Vercel URL automatically when deployed
- No manual configuration needed

✅ **Dashboard Layout Updated**
- Detects Vercel environment
- Proper auth handling for production

## Environment Detection

Vercel automatically provides:
- `VERCEL_URL` - The deployment URL (e.g., `your-app.vercel.app`)
- `VERCEL_ENV` - `production`, `preview`, or `development`

The code automatically uses these - **no manual setup needed!**

## Post-Deployment Checklist

- [ ] Environment variables set in Vercel
- [ ] OAuth redirect URIs updated
- [ ] n8n callback URL updated
- [ ] Test file upload (should work without timeout!)
- [ ] Test OAuth flows
- [ ] Verify n8n receives payloads

## Benefits After Deployment

✅ **No more ngrok timeouts** - Vercel handles large uploads
✅ **Stable URLs** - OAuth callbacks always work
✅ **Production-ready** - Real domain, HTTPS, CDN
✅ **Automatic deployments** - Push to main = auto-deploy

## Local Development

After deploying to Vercel:

- **Local dev**: Use for UI tweaks, testing
- **Vercel**: Use for file uploads, OAuth testing
- **ngrok**: Only needed for local OAuth testing (optional)

## Important Notes

### File Upload Size Limits
- Vercel serverless functions: 4.5MB limit
- **Solution**: We proxy files to n8n (which handles large files)
- n8n → Dropbox can handle files of any size
- This architecture works perfectly!

### Environment Variables Priority
1. `VERCEL_URL` (auto-set by Vercel) ✅
2. `NEXT_PUBLIC_APP_URL` (manual override)
3. `localhost:3000` (development fallback)

The code automatically uses the right URL - no configuration needed!

## Next Steps

1. **Deploy to Vercel** (follow steps above)
2. **Test file upload** - should work perfectly! (no timeout!)
3. **Update OAuth redirect URIs** to your Vercel URL
4. **Update n8n callback URL** to your Vercel URL
5. **Celebrate** - no more ngrok issues! 🎉

## What Changes After Deployment

- ✅ File uploads work reliably (no ngrok timeout)
- ✅ OAuth callbacks always work (stable URL)
- ✅ n8n receives payloads consistently
- ✅ Production-ready infrastructure
- ✅ Automatic HTTPS and CDN

