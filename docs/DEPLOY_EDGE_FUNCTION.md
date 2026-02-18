# Deploy Edge Function for Token Refresh

## Location

The Edge Function is located at:
```
supabase/functions/refresh-token/index.ts
```

## Deploy to Supabase

### Method 1: Using Supabase CLI (Recommended)

1. **Install Supabase CLI** (if not already installed):
   ```bash
   npm install -g supabase
   ```

2. **Login to Supabase**:
   ```bash
   supabase login
   ```

3. **Link your project**:
   ```bash
   supabase link --project-ref pezvnqhexxttlhcnbtta
   ```

4. **Deploy the function**:
   ```bash
   supabase functions deploy refresh-token
   ```

### Method 2: Using Supabase Dashboard

1. Go to your Supabase Dashboard: https://supabase.com/dashboard/project/pezvnqhexxttlhcnbtta
2. Navigate to **Edge Functions** (left sidebar)
3. Click **Create a new function**
4. Name it: `refresh-token`
5. Copy the contents of `supabase/functions/refresh-token/index.ts`
6. Paste into the editor
7. Click **Deploy**

## Set Environment Variables

After deploying, set these secrets in Supabase Dashboard:

1. Go to **Project Settings** → **Edge Functions** → **Secrets**
2. Add these environment variables:

```
SUPABASE_URL=https://pezvnqhexxttlhcnbtta.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
GOOGLE_CLIENT_ID_ALYAN=your_google_client_id
GOOGLE_CLIENT_SECRET_ALYAN=your_google_client_secret
INSTAGRAM_APP_ID_ALYAN=your_instagram_app_id (or META_APP_ID_ALYAN)
INSTAGRAM_APP_SECRET_ALYAN=your_instagram_app_secret (or META_APP_SECRET_ALYAN)
TIKTOK_CLIENT_KEY_ALYAN=your_tiktok_client_key
TIKTOK_CLIENT_SECRET_ALYAN=your_tiktok_client_secret
```

**Note:** 
- `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` do NOT have the `_ALYAN` suffix (these are standard Supabase variables)
- Only OAuth credentials (Google, Instagram, TikTok) use the `_ALYAN` suffix

**Note:** The `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are automatically available, but you can set them explicitly if needed.

## Test the Edge Function

### Using curl

```bash
curl -X POST https://pezvnqhexxttlhcnbtta.supabase.co/functions/v1/refresh-token \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "platform": "youtube",
    "creator_unique_identifier": "creator_735175e5_1768726539_f7262d3a"
  }'
```

### Expected Response

```json
{
  "success": true,
  "access_token": "ya29.a0AfH6...",
  "expires_at": "2026-02-01T14:00:00.000Z"
}
```

### Using n8n

Create an HTTP Request node:
- **Method:** POST
- **URL:** `https://pezvnqhexxttlhcnbtta.supabase.co/functions/v1/refresh-token`
- **Headers:**
  - `Authorization: Bearer YOUR_SERVICE_ROLE_KEY`
  - `Content-Type: application/json`
- **Body:**
  ```json
  {
    "platform": "youtube",
    "creator_unique_identifier": "{{ $json.creator_unique_identifier }}"
  }
  ```

## Function URL

Once deployed, your Edge Function will be available at:

```
https://pezvnqhexxttlhcnbtta.supabase.co/functions/v1/refresh-token
```

## What the Function Does

1. **Receives:** `platform` and `creator_unique_identifier`
2. **Fetches:** Tokens from database (`airpublisher_*_tokens` tables)
3. **Refreshes:** Calls OAuth provider APIs to get new tokens
4. **Updates:** Database with new tokens
5. **Returns:** New access token and expiration time

## Supported Platforms

- ✅ **YouTube** - Uses Google OAuth refresh endpoint
- ✅ **Instagram** - Uses Instagram Graph API refresh endpoint
- ✅ **TikTok** - Uses TikTok OAuth refresh endpoint

## Environment Variables

**Supabase Variables (NO _ALYAN suffix):**
- `SUPABASE_URL` - Supabase project URL (auto-set by Supabase)
- `SUPABASE_SERVICE_ROLE_KEY` - Service role key (auto-set by Supabase)

**OAuth Credentials (WITH _ALYAN suffix):**
- `GOOGLE_CLIENT_ID_ALYAN` - Google OAuth client ID
- `GOOGLE_CLIENT_SECRET_ALYAN` - Google OAuth client secret
- `INSTAGRAM_APP_ID_ALYAN` (or `META_APP_ID_ALYAN`) - Instagram/Meta app ID
- `INSTAGRAM_APP_SECRET_ALYAN` (or `META_APP_SECRET_ALYAN`) - Instagram/Meta app secret
- `TIKTOK_CLIENT_KEY_ALYAN` - TikTok OAuth client key
- `TIKTOK_CLIENT_SECRET_ALYAN` - TikTok OAuth client secret

**Note:** `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are typically auto-set by Supabase, but you can set them explicitly if needed.

## Troubleshooting

### Function Not Found (404)

- Make sure the function is deployed
- Check the function name matches exactly: `refresh-token`
- Verify you're using the correct project URL

### Authentication Error (401)

- Check that `SUPABASE_SERVICE_ROLE_KEY` is set correctly
- Verify the Authorization header includes `Bearer ` prefix

### Token Refresh Failed (400)

- Check that OAuth credentials are set (GOOGLE_CLIENT_ID, etc.)
- Verify the refresh token exists in the database
- Check OAuth provider logs for errors

### Environment Variables Not Found

- Go to Dashboard → Edge Functions → Secrets
- Make sure all required variables are set
- Redeploy the function after setting secrets

## Next Steps

After deploying:

1. ✅ Test the function with curl or n8n
2. ✅ Verify tokens are being refreshed
3. ✅ Check database to see updated tokens
4. ✅ Integrate into n8n workflows

The function is ready to use once deployed!

