# Deploy to Render - Setup Guide

## Step 1: Push to GitHub

Run these commands in your terminal:

```bash
# Initialize git (if not already done)
git init

# Add remote repository
git remote add origin https://github.com/arsalanrs/AIRPublisher.git

# Stage all files
git add .

# Commit
git commit -m "Initial commit: AIR Publisher with OAuth and n8n integration"

# Push to GitHub
git push -u origin main
```

**If you get an error about branch name:**
```bash
# Check current branch
git branch

# If you're on 'master', rename to 'main'
git branch -M main

# Then push
git push -u origin main
```

---

## Step 2: Create Render Account

1. Go to [render.com](https://render.com)
2. Sign up with GitHub
3. Connect your GitHub account

---

## Step 3: Create New Web Service

1. Click **"New +"** → **"Web Service"**
2. Connect your GitHub repository: `arsalanrs/AIRPublisher`
3. Configure the service:

### Basic Settings:
- **Name:** `air-publisher` (or your choice)
- **Region:** Choose closest to you
- **Branch:** `main`
- **Root Directory:** (leave empty)
- **Runtime:** `Node`
- **Build Command:** `npm install && npm run build`
- **Start Command:** `npm start`

### Environment Variables:

Add these in Render's dashboard (Settings → Environment):

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# YouTube OAuth
YOUTUBE_CLIENT_ID=your-youtube-client-id
YOUTUBE_CLIENT_SECRET=your-youtube-client-secret

# Instagram OAuth
INSTAGRAM_APP_ID=1405584781151443
INSTAGRAM_APP_SECRET=c82997f0ad2941b13cec68e4812d7b29

# TikTok OAuth (when you get them)
TIKTOK_CLIENT_KEY=your-tiktok-client-key
TIKTOK_CLIENT_SECRET=your-tiktok-client-secret

# App URL (IMPORTANT: Update after deployment)
NEXT_PUBLIC_APP_URL=https://your-app-name.onrender.com

# n8n Webhook (optional)
N8N_API_KEY=your-n8n-webhook-secret
N8N_WEBHOOK_SECRET=your-n8n-webhook-secret

# Node Environment
NODE_ENV=production
```

**Important:** After deployment, update:
- `NEXT_PUBLIC_APP_URL` to your actual Render URL
- Update OAuth redirect URIs in Google Cloud, Meta, and TikTok to use your Render URL

---

## Step 4: Update OAuth Redirect URIs

After you get your Render URL (e.g., `https://air-publisher.onrender.com`):

### Google Cloud Console (YouTube):
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. APIs & Services → Credentials
3. Edit your OAuth 2.0 Client ID
4. Add authorized redirect URI:
   ```
   https://your-app-name.onrender.com/api/auth/youtube/callback
   ```

### Meta Developers (Instagram):
1. Go to [Meta for Developers](https://developers.facebook.com/)
2. Your App → Settings → Basic
3. Add OAuth Redirect URI:
   ```
   https://your-app-name.onrender.com/api/auth/instagram/callback
   ```

### TikTok Developers (when set up):
1. Add redirect URI:
   ```
   https://your-app-name.onrender.com/api/auth/tiktok/callback
   ```

---

## Step 5: Deploy

1. Click **"Create Web Service"** in Render
2. Render will:
   - Clone your repo
   - Install dependencies
   - Build the app
   - Start the service
3. Wait for deployment (usually 5-10 minutes)
4. Your app will be live at: `https://your-app-name.onrender.com`

---

## Step 6: Update Environment Variables

After first deployment:

1. Go to your Render service → **Settings** → **Environment**
2. Update `NEXT_PUBLIC_APP_URL` to your actual Render URL
3. Click **"Save Changes"**
4. Render will automatically redeploy

---

## Render Configuration Tips

### Free Tier Limitations:
- Services spin down after 15 minutes of inactivity
- First request after spin-down takes ~30 seconds (cold start)
- Upgrade to paid plan for always-on service

### Build Settings:
- **Build Command:** `npm install && npm run build`
- **Start Command:** `npm start`
- **Node Version:** Render auto-detects, but you can specify in `package.json`:
  ```json
  "engines": {
    "node": "18.x"
  }
  ```

### Health Check:
Render automatically checks `/` endpoint. Make sure your app responds there.

---

## Troubleshooting

### Build Fails:
- Check build logs in Render dashboard
- Ensure all dependencies are in `package.json`
- Check for TypeScript errors: `npm run build` locally first

### Environment Variables Not Working:
- Make sure variable names match exactly (case-sensitive)
- Restart service after adding variables
- Check logs for errors

### OAuth Redirect Errors:
- Verify redirect URIs match exactly (including https)
- Update OAuth apps with production URL
- Check `NEXT_PUBLIC_APP_URL` is set correctly

### App Not Starting:
- Check start command: should be `npm start`
- Verify `package.json` has `"start": "next start"`
- Check logs for specific errors

---

## Post-Deployment Checklist

- [ ] App is accessible at Render URL
- [ ] Environment variables are set
- [ ] `NEXT_PUBLIC_APP_URL` is updated
- [ ] OAuth redirect URIs updated in all platforms
- [ ] Test login/signup flow
- [ ] Test Instagram OAuth connection
- [ ] Test YouTube OAuth connection
- [ ] Verify database connections work

---

## Next Steps

After deployment:
1. Test all OAuth flows with production URLs
2. Set up n8n workflows (if using)
3. Configure custom domain (optional)
4. Set up monitoring/alerts
5. Enable auto-deploy from main branch

---

## Custom Domain (Optional)

1. Go to Render service → **Settings** → **Custom Domains**
2. Add your domain
3. Update DNS records as instructed
4. Update `NEXT_PUBLIC_APP_URL` to custom domain
5. Update OAuth redirect URIs to use custom domain

---

## Auto-Deploy

Render automatically deploys when you push to `main` branch:
1. Push to GitHub: `git push origin main`
2. Render detects changes
3. Automatically builds and deploys
4. You'll see deployment status in Render dashboard

---

Good luck with your deployment! 🚀

