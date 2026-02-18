# Testing Edge Function OAuth

## Prerequisites

1. Make sure both Edge Functions are deployed:
   - `alyan_youtubeauth`
   - `alyan_instagramauth`

2. Set environment variables in Supabase Dashboard:
   - Go to Project Settings > Edge Functions > Secrets
   - Add:
     - `GOOGLE_CLIENT_ID_ALYAN` (or `GOOGLE_OAUTH_CLIENT_ID`)
     - `GOOGLE_CLIENT_SECRET_ALYAN` (or `GOOGLE_OAUTH_CLIENT_SECRET`)
     - `INSTAGRAM_APP_ID_ALYAN` (or `INSTAGRAM_APP_ID`)
     - `INSTAGRAM_APP_SECRET_ALYAN` (or `INSTAGRAM_APP_SECRET`)
     - `FRONTEND_URL` (optional, defaults to `http://aircreator.cloud:3003`)

3. Update OAuth Redirect URIs:
   - **Google Cloud Console**: Add `https://<your-supabase-url>/functions/v1/alyan_youtubeauth`
   - **Instagram App Settings**: Add `https://<your-supabase-url>/functions/v1/alyan_instagramauth`

## Testing Methods

### Method 1: Through Next.js App (Recommended)

1. Start your Next.js app:
   ```bash
   npm run dev
   ```

2. Navigate to the connections page:
   - Go to `http://aircreator.cloud:3003/settings/connections` (or your local URL)
   - Click "Connect YouTube" or "Connect Instagram"
   - This will redirect through `/api/auth/youtube` or `/api/auth/instagram` to the Edge Function

### Method 2: Direct Edge Function Testing

#### Test YouTube OAuth Init

```bash
# Replace <your-supabase-url> with your actual Supabase project URL
curl "https://<your-supabase-url>/functions/v1/alyan_youtubeauth?action=init&origin=http://aircreator.cloud:3003"
```

This should redirect you to Google OAuth. After authorization, it will redirect back to the Edge Function callback, which then redirects to your frontend.

#### Test Instagram OAuth Init

```bash
curl "https://<your-supabase-url>/functions/v1/alyan_instagramauth?action=init&origin=http://aircreator.cloud:3003"
```

#### Test Status Endpoint (YouTube)

```bash
# You need a valid Supabase JWT token for this
curl -X GET "https://<your-supabase-url>/functions/v1/alyan_youtubeauth?action=status" \
  -H "Authorization: Bearer <your-jwt-token>"
```

#### Test Status Endpoint (Instagram)

```bash
curl -X GET "https://<your-supabase-url>/functions/v1/alyan_instagramauth?action=status&user_id=<user-id>" \
  -H "Authorization: Bearer <your-jwt-token>"
```

### Method 3: Test in Browser

1. **YouTube OAuth Flow**:
   - Open: `https://<your-supabase-url>/functions/v1/alyan_youtubeauth?action=init&origin=http://aircreator.cloud:3003`
   - You'll be redirected to Google OAuth
   - After authorization, you'll be redirected back to your frontend

2. **Instagram OAuth Flow**:
   - Open: `https://<your-supabase-url>/functions/v1/alyan_instagramauth?action=init&origin=http://aircreator.cloud:3003`
   - You'll be redirected to Instagram OAuth
   - After authorization, you'll be redirected back to your frontend

## Expected Flow

1. **Init**: User clicks "Connect" → Redirects to Edge Function with `action=init`
2. **OAuth**: Edge Function redirects to Google/Instagram OAuth
3. **Callback**: OAuth provider redirects back to Edge Function with `code`
4. **Token Exchange**: Edge Function exchanges code for tokens
5. **User Creation**: Edge Function creates/updates user in Supabase Auth
6. **Token Storage**: Tokens stored in `airpublisher_*_tokens` tables
7. **Redirect**: Edge Function generates magic link and redirects to frontend

## Verification

After successful OAuth:

1. **Check Supabase Auth**:
   - Go to Authentication > Users
   - Verify user was created/updated

2. **Check Token Tables**:
   ```sql
   -- Check YouTube tokens
   SELECT * FROM airpublisher_youtube_tokens;
   
   -- Check Instagram tokens
   SELECT * FROM airpublisher_instagram_tokens;
   ```

3. **Check Creator Profile**:
   ```sql
   SELECT * FROM airpublisher_creator_profiles WHERE user_id = '<user-id>';
   ```

## Troubleshooting

### Error: "Missing Env Vars"
- Check that all required environment variables are set in Supabase Dashboard
- Verify variable names match (with `_ALYAN` suffix or fallbacks)

### Error: "Invalid redirect_uri"
- Make sure the redirect URI in OAuth provider settings matches exactly:
  - `https://<your-supabase-url>/functions/v1/alyan_youtubeauth`
  - `https://<your-supabase-url>/functions/v1/alyan_instagramauth`

### Error: "User creation failed"
- Check Supabase logs for detailed error messages
- Verify RLS policies allow service role to create users

### Tokens not stored
- Check Edge Function logs in Supabase Dashboard
- Verify table names exist (`airpublisher_youtube_tokens`, `airpublisher_instagram_tokens`)
- Check if creator profile exists (required for new tables)

## Edge Function Logs

View logs in Supabase Dashboard:
1. Go to Edge Functions
2. Click on `alyan_youtubeauth` or `alyan_instagramauth`
3. Click "Logs" tab
4. Check for any errors or debug messages

