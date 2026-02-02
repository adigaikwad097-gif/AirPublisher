# Quick Deploy Edge Functions

## Deploy YouTube OAuth Edge Function

```bash
supabase functions deploy alyan_youtubeauth
```

## Deploy Instagram OAuth Edge Function

```bash
supabase functions deploy alyan_instagramauth
```

## Verify Secrets Are Set

In Supabase Dashboard → Edge Functions → Secrets, make sure these are set:

**For YouTube:**
- `GOOGLE_CLIENT_ID_ALYAN` (or `GOOGLE_OAUTH_CLIENT_ID` or `GOOGLE_CLIENT_ID`)
- `GOOGLE_CLIENT_SECRET_ALYAN` (or `GOOGLE_OAUTH_CLIENT_SECRET` or `GOOGLE_CLIENT_SECRET`)

**For Instagram:**
- `INSTAGRAM_APP_ID_ALYAN` (or `INSTAGRAM_CLIENT_ID` or `INSTAGRAM_APP_ID`)
- `INSTAGRAM_APP_SECRET_ALYAN` (or `INSTAGRAM_CLIENT_SECRET` or `INSTAGRAM_APP_SECRET`)

**For TikTok:**
- `TIKTOK_CLIENT_KEY_ALYAN` (or `TIKTOK_CLIENT_KEY`)
- `TIKTOK_CLIENT_SECRET_ALYAN` (or `TIKTOK_CLIENT_SECRET`)

**Auto-available (no _ALYAN suffix needed):**
- `SUPABASE_URL` (automatically available)
- `SUPABASE_SERVICE_ROLE_KEY` (automatically available)

## Check Logs After Deployment

After deploying, test the functions and check logs in:
Supabase Dashboard → Edge Functions → Logs

Look for the debug messages:
- `[alyan_youtubeauth] Environment check:`
- `[alyan_instagramauth] Environment check:`

These will show if the secrets are being read correctly.

