# Live Deployment Setup Guide

## Server Information

- **Server IP:** 93.127.216.83
- **Port:** 3003
- **User:** air_publisher_user
- **Password:** App8899n@123
- **Home Directory:** /opt/apps/air-publisher
- **Base URL:** http://93.127.216.83:3003 (or https:// if SSL configured)

## Environment Variables

Set these in your `.env.local` or server environment:

```bash
# Application URL (REQUIRED for OAuth)
NEXT_PUBLIC_APP_URL=http://93.127.216.83:3003

# n8n API Key (for automation webhooks)
N8N_API_KEY=your_n8n_api_key_here

# Supabase (your existing values)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Other existing environment variables...
```

## OAuth Redirect URIs

Update these in your OAuth app settings:

### Instagram (Facebook Developer Console)
- **Redirect URI:** `http://93.127.216.83:3003/api/auth/instagram/callback`
- Remove all other redirect URIs (localhost, vercel, ngrok, etc.)

### TikTok (TikTok Developer Portal)
- **Redirect URI:** `http://93.127.216.83:3003/api/auth/tiktok/callback`
- Remove all other redirect URIs

### YouTube (Google Cloud Console)
- **Redirect URI:** `http://93.127.216.83:3003/api/auth/youtube/callback`
- Remove all other redirect URIs

### Dropbox
- **Redirect URI:** `http://93.127.216.83:3003/api/auth/dropbox/callback`

## Changes Made for Live Deployment

### 1. Removed Mock Data
- ✅ Removed all mock/placeholder data from leaderboard
- ✅ Leaderboard now shows empty state when no data exists
- ✅ Dashboard KPIs now use actual video metrics (views, likes, comments)

### 2. Enabled Leaderboard Calculation
- ✅ Leaderboard calculation API is now enabled
- ✅ Uses `N8N_API_KEY` for authentication (instead of CRON_SECRET)
- ✅ Aggregates metrics from `air_publisher_videos` table
- ✅ Calculates scores for daily, weekly, and all-time periods

### 3. Updated URL Handling
- ✅ `getAppUrl()` function supports live server URLs
- ✅ Set `NEXT_PUBLIC_APP_URL=http://93.127.216.83:3003` for OAuth to work

## n8n Automation URLs

Update your n8n workflows to use the live site:

### Scheduled Post Automation
- **Get Scheduled Posts:** `http://93.127.216.83:3003/api/n8n/scheduled-posts?before={{$now.toISO()}}`
- **Get Video Details:** `http://93.127.216.83:3003/api/n8n/video-details?video_id={{$json.video_id}}`
- **Post Status:** `http://93.127.216.83:3003/api/webhooks/n8n/post-status`

### Metrics Collection
- **Send Metrics:** `http://93.127.216.83:3003/api/webhooks/n8n/metrics`
- **Calculate Leaderboard:** `http://93.127.216.83:3003/api/n8n/leaderboard-calculate`

### Immediate Post
- **Post Now:** `http://93.127.216.83:3003/api/n8n/post-now`

**All n8n endpoints require header:**
```
x-n8n-api-key: {{$env.N8N_API_KEY}}
```

## Deployment Steps

1. **SSH into server:**
   ```bash
   ssh air_publisher_user@93.127.216.83
   # Password: App8899n@123
   ```

2. **Navigate to app directory:**
   ```bash
   cd /opt/apps/air-publisher
   ```

3. **Pull latest code:**
   ```bash
   git pull origin main
   # OR if using rsync from local:
   # rsync -avz ./ air_publisher_user@93.127.216.83:~/air-publisher/
   ```

4. **Set environment variables:**
   ```bash
   # Edit .env.local or set in docker-compose.yml
   nano .env.local
   ```

5. **Rebuild and restart:**
   ```bash
   docker-compose up -d --build
   ```

6. **Check logs:**
   ```bash
   docker-compose logs -f
   ```

## Testing OAuth

1. **Test Instagram OAuth:**
   - Go to: `http://93.127.216.83:3003/api/auth/instagram`
   - Should redirect to Facebook login
   - After auth, should redirect back to your app

2. **Test TikTok OAuth:**
   - Go to: `http://93.127.216.83:3003/api/auth/tiktok`
   - Should redirect to TikTok login
   - After auth, should redirect back to your app

3. **Test YouTube OAuth:**
   - Go to: `http://93.127.216.83:3003/api/auth/youtube`
   - Should redirect to Google login
   - After auth, should redirect back to your app

## Troubleshooting

### OAuth Redirect URI Mismatch
- **Symptom:** "Redirect URI mismatch" error
- **Fix:** Ensure `NEXT_PUBLIC_APP_URL` is set exactly to `http://93.127.216.83:3003`
- **Fix:** Verify redirect URI in OAuth app settings matches exactly (no trailing slash, correct protocol)

### n8n Webhooks Not Working
- **Check:** `N8N_API_KEY` is set in both server and n8n
- **Check:** n8n workflows use correct URLs (http://93.127.216.83:3003)
- **Check:** n8n sends `x-n8n-api-key` header

### Leaderboard Empty
- **Check:** Videos have `status='posted'` in database
- **Check:** Videos have `views`, `likes`, `comments`, `estimated_revenue` populated
- **Check:** Leaderboard calculation API is being called (via n8n metrics automation)

## Next Steps

1. ✅ Set `NEXT_PUBLIC_APP_URL` in server environment
2. ✅ Update OAuth redirect URIs in all platform apps
3. ✅ Update n8n workflow URLs to use live site
4. ✅ Test OAuth flows
5. ✅ Set up n8n automations (see `N8N_POSTING_AUTOMATIONS.md`)
6. ✅ Test scheduled posting
7. ✅ Test metrics collection

## SSL/HTTPS Setup (Optional)

If you want to use HTTPS:

1. Set up SSL certificate (Let's Encrypt, etc.)
2. Update `NEXT_PUBLIC_APP_URL` to `https://93.127.216.83:3003`
3. Update all OAuth redirect URIs to use `https://`
4. Update n8n workflow URLs to use `https://`

