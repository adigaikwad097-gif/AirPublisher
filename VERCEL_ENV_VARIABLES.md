# Environment Variables for Vercel

Copy these from your `.env.local` file and add them to Vercel Dashboard → Settings → Environment Variables.

## Required Variables (Must Have)

### Supabase (Required)
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### n8n Integration (Required)
```env
N8N_WEBHOOK_URL_DROPBOX_UPLOAD=https://support-team.app.n8n.cloud/webhook/uploaddropbox
N8N_API_KEY=your_n8n_api_key
```

## OAuth Platform Credentials (Required for Platform Connections)

### YouTube
```env
YOUTUBE_CLIENT_ID=your_youtube_client_id
YOUTUBE_CLIENT_SECRET=your_youtube_client_secret
```

### Instagram/Meta
```env
META_APP_ID=your_meta_app_id
META_APP_SECRET=your_meta_app_secret
# OR (alternative names)
INSTAGRAM_APP_ID=your_instagram_app_id
INSTAGRAM_APP_SECRET=your_instagram_app_secret
```

### Dropbox
```env
DROPBOX_CLIENT_ID=your_dropbox_client_id
DROPBOX_CLIENT_SECRET=your_dropbox_client_secret
```

## Optional Variables

### App URL (Auto-set by Vercel)
```env
# Vercel automatically sets VERCEL_URL - you don't need to set this
# Only set if you want to override:
# NEXT_PUBLIC_APP_URL=https://your-custom-domain.com
```

### n8n Additional (Optional)
```env
N8N_WEBHOOK_SECRET=your_webhook_secret_for_hmac_verification
N8N_WEBHOOK_URL_POST_VIDEO=https://your-n8n-instance.com/webhook/post-video
```

### Dropbox Additional (Optional - if not using n8n)
```env
DROPBOX_REDIRECT_URI=https://your-app.vercel.app/api/auth/dropbox/callback
DROPBOX_ACCESS_TOKEN=your_dropbox_token
DROPBOX_APP_KEY=your_dropbox_app_key
DROPBOX_APP_SECRET=your_dropbox_app_secret
DROPBOX_BASE_FOLDER=airpublisher
```

## Auto-Set by Vercel (Don't Add These)

These are automatically set by Vercel - **DO NOT** add them manually:
- `VERCEL_URL` - Your deployment URL
- `VERCEL_ENV` - Environment (production/preview/development)
- `VERCEL` - Always `1` on Vercel
- `NODE_ENV` - Automatically set to `production` on Vercel

## Quick Copy Checklist

Copy these from your `.env.local`:

- [ ] `NEXT_PUBLIC_SUPABASE_URL`
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] `SUPABASE_SERVICE_ROLE_KEY`
- [ ] `N8N_WEBHOOK_URL_DROPBOX_UPLOAD`
- [ ] `N8N_API_KEY`
- [ ] `YOUTUBE_CLIENT_ID`
- [ ] `YOUTUBE_CLIENT_SECRET`
- [ ] `META_APP_ID` (or `INSTAGRAM_APP_ID`)
- [ ] `META_APP_SECRET` (or `INSTAGRAM_APP_SECRET`)
- [ ] `DROPBOX_CLIENT_ID`
- [ ] `DROPBOX_CLIENT_SECRET`

## How to Add in Vercel

1. Go to your Vercel project dashboard
2. Click **Settings** → **Environment Variables**
3. Click **Add New**
4. For each variable:
   - **Name**: The variable name (e.g., `NEXT_PUBLIC_SUPABASE_URL`)
   - **Value**: The value from your `.env.local`
   - **Environment**: Select **Production**, **Preview**, and **Development** (or just Production)
5. Click **Save**
6. Repeat for all variables

## After Adding Variables

1. **Redeploy** your application (Vercel will auto-deploy on next push, or click "Redeploy" in dashboard)
2. **Update OAuth redirect URIs** to your Vercel URL
3. **Update n8n callback URL** to your Vercel URL

## Security Notes

- ✅ All variables are encrypted at rest in Vercel
- ✅ Variables are only accessible to your deployment
- ✅ Never commit `.env.local` to git (it's already in `.gitignore`)
- ✅ Use different values for production vs development if needed


