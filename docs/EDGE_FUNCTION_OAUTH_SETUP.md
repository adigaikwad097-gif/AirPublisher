# Edge Function OAuth Setup

This document explains the new OAuth flow using Supabase Edge Functions for YouTube and Instagram.

## Overview

OAuth flows for YouTube and Instagram are now handled by Supabase Edge Functions instead of Next.js API routes. This allows tokens to be stored directly in the shared Supabase project.

## Edge Functions

### YouTube OAuth: `alyan_youtubeauth`
- **Location**: `supabase/functions/alyan_youtubeauth/index.ts`
- **Endpoint**: `https://<supabase-url>/functions/v1/alyan_youtubeauth`
- **Actions**:
  - `init` - Initiates OAuth flow
  - `callback` - Handles OAuth callback
  - `status` - Checks connection status
  - `disconnect` - Disconnects account

### Instagram OAuth: `alyan_instagramauth`
- **Location**: `supabase/functions/alyan_instagramauth/index.ts`
- **Endpoint**: `https://<supabase-url>/functions/v1/alyan_instagramauth`
- **Actions**:
  - `init` - Initiates OAuth flow
  - `callback` - Handles OAuth callback
  - `status` - Checks connection status
  - `disconnect` - Disconnects account

## Environment Variables

### Required in Supabase Edge Function Secrets:

#### YouTube:
- `GOOGLE_CLIENT_ID_ALYAN` (or `GOOGLE_OAUTH_CLIENT_ID` or `GOOGLE_CLIENT_ID` as fallback)
- `GOOGLE_CLIENT_SECRET_ALYAN` (or `GOOGLE_OAUTH_CLIENT_SECRET` or `GOOGLE_CLIENT_SECRET` as fallback)
- `SUPABASE_URL` (auto-available)
- `SUPABASE_SERVICE_ROLE_KEY` (auto-available)
- `FRONTEND_URL` (or `NEXT_PUBLIC_APP_URL` as fallback)

#### Instagram:
- `INSTAGRAM_APP_ID_ALYAN` (or `INSTAGRAM_CLIENT_ID` or `INSTAGRAM_APP_ID` as fallback)
- `INSTAGRAM_APP_SECRET_ALYAN` (or `INSTAGRAM_CLIENT_SECRET` or `INSTAGRAM_APP_SECRET` as fallback)
- `SUPABASE_URL` (auto-available)
- `SUPABASE_SERVICE_ROLE_KEY` (auto-available)
- `FRONTEND_URL` (or `NEXT_PUBLIC_APP_URL` as fallback)

## OAuth Redirect URIs

### YouTube:
- Register in Google Cloud Console: `https://<supabase-url>/functions/v1/alyan_youtubeauth`

### Instagram:
- Register in Instagram App Settings: `https://<supabase-url>/functions/v1/alyan_instagramauth`

## Flow

1. User clicks "Connect YouTube" or "Connect Instagram" in the app
2. Next.js API route (`/api/auth/youtube` or `/api/auth/instagram`) redirects to Edge Function with `action=init`
3. Edge Function redirects to OAuth provider (Google/Instagram)
4. User authorizes the app
5. OAuth provider redirects back to Edge Function callback
6. Edge Function:
   - Exchanges code for tokens
   - Creates/updates user in Supabase Auth
   - Stores tokens in `airpublisher_*_tokens` tables (or fallback to old tables)
   - Generates magic link and redirects user back to frontend

## Token Storage

Tokens are stored in:
- **New tables** (preferred): `airpublisher_youtube_tokens`, `airpublisher_instagram_tokens`
- **Old tables** (fallback): `youtube_tokens`, `instagram_tokens`

Tokens can be encrypted using Supabase Vault (if `create_vault_secret` RPC is available), otherwise stored as raw tokens.

## Deployment

1. Deploy Edge Functions:
   ```bash
   supabase functions deploy alyan_youtubeauth
   supabase functions deploy alyan_instagramauth
   ```

2. Set secrets in Supabase Dashboard:
   - Go to Project Settings > Edge Functions > Secrets
   - Add all required environment variables

3. Update OAuth redirect URIs in provider dashboards:
   - Google Cloud Console: Add Edge Function URL
   - Instagram App Settings: Add Edge Function URL

## Next.js API Routes

The Next.js API routes (`/api/auth/youtube` and `/api/auth/instagram`) now simply redirect to the Edge Functions. The callback routes (`/api/auth/youtube/callback` and `/api/auth/instagram/callback`) are no longer used but kept for backward compatibility.

