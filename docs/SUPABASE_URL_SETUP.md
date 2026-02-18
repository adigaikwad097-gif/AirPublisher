# Supabase URL Configuration

## Your Supabase Project Details

- **Project ID**: `pezvnqhexxttlhcnbtta`
- **Project URL**: `https://pezvnqhexxttlhcnbtta.supabase.co`
- **Dashboard URL**: `https://supabase.com/dashboard/project/pezvnqhexxttlhcnbtta`

## Where This URL is Used

### 1. Edge Function URL

Your Edge Functions are accessible at:
```
https://pezvnqhexxttlhcnbtta.supabase.co/functions/v1/refresh-token
```

### 2. Environment Variables

Make sure these are set in your `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=https://pezvnqhexxttlhcnbtta.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

### 3. Edge Function Environment Variables

In your Supabase Dashboard:
1. Go to **Project Settings** → **Edge Functions**
2. Set these secrets:
   - `SUPABASE_URL` = `https://pezvnqhexxttlhcnbtta.supabase.co`
   - `SUPABASE_SERVICE_ROLE_KEY` = (your service role key)
   - `GOOGLE_CLIENT_ID` = (your Google OAuth client ID)
   - `GOOGLE_CLIENT_SECRET` = (your Google OAuth client secret)
   - `INSTAGRAM_APP_ID` = (your Instagram/Meta app ID)
   - `INSTAGRAM_APP_SECRET` = (your Instagram/Meta app secret)

### 4. Database Functions

The migration `021_implement_actual_token_refresh.sql` uses your project URL. If you need to change it, update this line:

```sql
v_supabase_url TEXT := 'https://pezvnqhexxttlhcnbtta.supabase.co';
```

## Finding Your Service Role Key

1. Go to your Supabase Dashboard: https://supabase.com/dashboard/project/pezvnqhexxttlhcnbtta
2. Navigate to **Project Settings** → **API**
3. Copy the **service_role** key (keep this secret!)

## Testing the Edge Function

You can test the refresh token Edge Function with:

```bash
curl -X POST https://pezvnqhexxttlhcnbtta.supabase.co/functions/v1/refresh-token \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "platform": "youtube",
    "creator_unique_identifier": "your-creator-id"
  }'
```

## Next Steps

1. ✅ Your Supabase URL is configured
2. Deploy the Edge Function (if not already done)
3. Set Edge Function environment variables
4. Run the migrations (017, 018, 019, 020, 021)
5. Test token refresh

