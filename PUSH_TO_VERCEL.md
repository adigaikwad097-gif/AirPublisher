# Push Changes to Vercel

You already have Vercel deployed. Just push your changes and Vercel will auto-deploy.

## Quick Push Commands

```bash
# Make sure you're in the project directory
cd /Users/suniya/Desktop/airpublisher

# Check what changed
git status

# Add all changes
git add .

# Commit
git commit -m "Update UI, fix server deployment, add automations setup"

# Push to GitHub (Vercel will auto-deploy)
git push origin main
```

## After Push

1. **Vercel will auto-deploy** - Check your Vercel dashboard
2. **Get your Vercel URL** - It will be something like `https://your-app-name.vercel.app`
3. **Update OAuth Redirect URIs** - Use your Vercel URL (not the IP address)

## Update OAuth Redirect URIs

After deployment, update redirect URIs in each platform to use your **Vercel domain**:

### Instagram
- `https://your-app-name.vercel.app/api/auth/instagram/callback`

### TikTok
- `https://your-app-name.vercel.app/api/auth/tiktok/callback`

### YouTube
- `https://your-app-name.vercel.app/api/auth/youtube/callback`

### Dropbox
- `https://your-app-name.vercel.app/api/auth/dropbox/callback`

**Important:** Remove the IP address redirect URIs and use only the Vercel domain.

## Verify Environment Variables

Make sure these are set in Vercel (Settings → Environment Variables):

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `N8N_API_KEY`
- `YOUTUBE_CLIENT_ID`
- `YOUTUBE_CLIENT_SECRET`
- `META_APP_ID` (or `INSTAGRAM_APP_ID`)
- `META_APP_SECRET` (or `INSTAGRAM_APP_SECRET`)
- `TIKTOK_CLIENT_KEY`
- `TIKTOK_CLIENT_SECRET`
- `DROPBOX_CLIENT_ID`
- `DROPBOX_CLIENT_SECRET`

**Note:** Vercel automatically sets `VERCEL_URL`, so the code will use that for redirect URIs automatically.

## Test After Deployment

1. Go to: `https://your-app-name.vercel.app/settings/connections`
2. Test each OAuth connection
3. Verify everything works with the domain (not IP)

That's it! Push and Vercel handles the rest.
