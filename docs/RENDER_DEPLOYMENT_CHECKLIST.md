# Render Deployment Checklist

## ✅ Your Deployment

- **Render URL:** https://airpublisher.onrender.com
- **Status:** Building/Deploying
- **Repository:** https://github.com/alyanmr738-cyber/airpublisher.git

---

## 🔧 Required Actions After Deployment

### 1. Update Environment Variables in Render

Go to Render Dashboard → Your Service → **Environment** tab and add/update:

```bash
# Update this to your production URL
NEXT_PUBLIC_APP_URL=https://airpublisher.onrender.com
```

**Important:** After adding this, Render will automatically redeploy.

---

### 2. Update OAuth Redirect URIs

#### YouTube (Google Cloud Console)

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to: **APIs & Services** → **Credentials**
3. Click on your OAuth 2.0 Client ID
4. Under **"Authorized redirect URIs"**, add:
   ```
   https://airpublisher.onrender.com/api/auth/youtube/callback
   ```
5. Click **"Save"**

#### Instagram (Meta Developers)

1. Go to [Meta for Developers](https://developers.facebook.com/apps/1405584781151443)
2. Navigate to: **Settings** → **Basic**
3. Scroll to **"Add Platform"** → **Website**
4. Add **OAuth Redirect URIs**:
   ```
   https://airpublisher.onrender.com/api/auth/instagram/callback
   ```
5. Or go to: **Products** → **Instagram Graph API** → **Basic Display**
6. Add the redirect URI there
7. Click **"Save Changes"**

#### TikTok (When Configured)

1. Go to [TikTok Developers](https://developers.tiktok.com/)
2. Your App → **Settings**
3. Add redirect URI:
   ```
   https://airpublisher.onrender.com/api/auth/tiktok/callback
   ```

---

### 3. Verify Environment Variables in Render

Make sure all these are set in Render Dashboard → Environment:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://pezvnqhexxttlhcnbtta.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBlenZucWhleHh0dGxoY25idHRhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg3ODQwNjYsImV4cCI6MjA3NDM2MDY2fQ.b5cWpEYD6s5gRYg5jcBNyjE-kL_IGAVqtMfXk8wB6zU
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBlenZucWhleHh0dGxoY25idHRhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODc4NDA2NiwiZXhwIjoyMDc0MzYwMDY2fQ.bjyw77LQTMZ0eWAIqBIa6cbUpFEnlYOzlK4rhiQmRpU

# YouTube OAuth
YOUTUBE_CLIENT_ID=367756454563-qr99o53cbgt8ospr56ahodvrc5hh3j9t.apps.googleusercontent.com
YOUTUBE_CLIENT_SECRET=YOUR_YOUTUBE_CLIENT_SECRET

# Instagram OAuth
INSTAGRAM_APP_ID=1405584781151443
INSTAGRAM_APP_SECRET=c82997f0ad2941b13cec68e4812d7b29

# App URL (IMPORTANT!)
NEXT_PUBLIC_APP_URL=https://airpublisher.onrender.com

# Node Environment
NODE_ENV=production
```

---

## ✅ Post-Deployment Testing

Once deployment completes, test these:

### 1. Basic Access
- [ ] Visit: https://airpublisher.onrender.com
- [ ] Landing page loads correctly
- [ ] No console errors

### 2. Authentication
- [ ] Go to: https://airpublisher.onrender.com/login
- [ ] Sign up with a new account
- [ ] Sign in works
- [ ] Redirects to dashboard

### 3. Creator Profile
- [ ] After signup, can create creator profile
- [ ] Profile saves correctly
- [ ] Dashboard shows profile info

### 4. OAuth Connections
- [ ] Go to: https://airpublisher.onrender.com/settings/connections
- [ ] Click "Connect YouTube" → Should redirect to Google OAuth
- [ ] Click "Connect Instagram" → Should redirect to Meta OAuth
- [ ] OAuth callbacks work correctly

### 5. Database Connection
- [ ] Creator profiles save to Supabase
- [ ] Videos can be uploaded (if implemented)
- [ ] Leaderboard data loads

---

## 🐛 Troubleshooting

### App Not Loading
- Check Render logs: Dashboard → Your Service → **Logs** tab
- Verify build completed successfully
- Check for environment variable errors

### OAuth Redirect Errors
- Verify redirect URIs match exactly (including https)
- Check `NEXT_PUBLIC_APP_URL` is set correctly
- Wait a few minutes after updating OAuth settings (caching)

### Database Connection Errors
- Verify Supabase credentials are correct
- Check Supabase project is active
- Verify RLS policies allow access

### Build Failures
- Check build logs in Render
- Verify all dependencies in `package.json`
- Check for TypeScript errors

---

## 📝 Render Free Tier Notes

**Important Limitations:**
- ⚠️ Services spin down after 15 minutes of inactivity
- ⚠️ First request after spin-down takes ~30 seconds (cold start)
- ⚠️ Consider upgrading to paid plan for always-on service

**To Keep Service Active:**
- Use a monitoring service (UptimeRobot, etc.) to ping your URL every 10 minutes
- Or upgrade to paid plan ($7/month for always-on)

---

## 🔄 Auto-Deploy

Render automatically deploys when you push to `main` branch:

```bash
# Make changes locally
git add .
git commit -m "Your changes"
git push origin main

# Render will automatically:
# 1. Detect changes
# 2. Build your app
# 3. Deploy new version
```

---

## 📊 Monitoring

### View Logs
- Render Dashboard → Your Service → **Logs** tab
- Real-time logs during deployment
- Application logs after deployment

### Check Status
- Render Dashboard → Your Service → **Events** tab
- See deployment history
- Check for errors

---

## 🎯 Next Steps

1. ✅ Wait for deployment to complete
2. ✅ Update `NEXT_PUBLIC_APP_URL` in Render
3. ✅ Update OAuth redirect URIs
4. ✅ Test all functionality
5. ✅ Set up n8n workflows (if using)
6. ✅ Configure custom domain (optional)

---

## 🔗 Quick Links

- **Your App:** https://airpublisher.onrender.com
- **Render Dashboard:** https://dashboard.render.com/
- **Supabase Dashboard:** https://supabase.com/dashboard/project/pezvnqhexxttlhcnbtta
- **Google Cloud Console:** https://console.cloud.google.com/
- **Meta Developers:** https://developers.facebook.com/apps/1405584781151443

---

**Good luck with your deployment! 🚀**

