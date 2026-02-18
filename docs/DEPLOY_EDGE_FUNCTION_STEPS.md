# How to Deploy the Edge Function

## The Edge Function is TypeScript, NOT SQL

The file `supabase/functions/refresh-token/index.ts` is a **TypeScript/Deno Edge Function**, not SQL. You cannot run it as a SQL query.

## Deploy the Edge Function

### Option 1: Using Supabase CLI (Recommended)

```bash
# Make sure you're in the project root
cd /Users/suniya/Desktop/airpublisher

# Deploy the Edge Function
supabase functions deploy refresh-token
```

### Option 2: Using Supabase Dashboard

1. Go to Supabase Dashboard → Edge Functions
2. Click "Create a new function" or select `refresh-token` if it exists
3. Copy the code from `supabase/functions/refresh-token/index.ts`
4. Paste it into the editor
5. Click "Deploy"

## Set Environment Variables (Secrets)

After deploying, set the secrets:

```bash
supabase secrets set GOOGLE_CLIENT_ID_ALYAN=your_client_id
supabase secrets set GOOGLE_CLIENT_SECRET_ALYAN=your_client_secret
supabase secrets set INSTAGRAM_APP_ID_ALYAN=your_app_id
supabase secrets set INSTAGRAM_APP_SECRET_ALYAN=your_app_secret
supabase secrets set TIKTOK_CLIENT_KEY_ALYAN=your_client_key
supabase secrets set TIKTOK_CLIENT_SECRET_ALYAN=your_client_secret
```

**Note:** `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are automatically available and don't need to be set.

## Test the Edge Function

After deploying, test it with curl:

```bash
curl -X POST https://pezvnqhexxttlhcnbtta.supabase.co/functions/v1/refresh-token \
  -H "Content-Type: application/json" \
  -d '{
    "platform": "youtube",
    "creator_unique_identifier": "creator_735175e5_1768726539_f7262d3a"
  }'
```

## Check Logs

1. Go to Supabase Dashboard → Edge Functions → `refresh-token`
2. Click "Logs" tab
3. You should see logs from the function

## What to Run as SQL

Only run **SQL migrations** as SQL queries:
- `supabase/migrations/*.sql` files
- Database functions (like `refresh_expired_youtube_tokens()`)
- SQL queries for testing

**DO NOT** run TypeScript files (`.ts`) as SQL queries.

