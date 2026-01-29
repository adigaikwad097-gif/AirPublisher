# Facebook OAuth Callback URL for Supabase

## Supabase Auth Callback URL

When configuring Facebook provider in Supabase Dashboard, use this callback URL:

```
https://pezvnqhexxttlhcnbtta.supabase.co/auth/v1/callback
```

**Format**: `https://<your-project-id>.supabase.co/auth/v1/callback`

## Where to Add This

### In Supabase Dashboard:
1. Authentication → Providers → Facebook
2. Add the callback URL above
3. Save

### In Meta App Settings:
1. Go to [Meta Developers](https://developers.facebook.com/apps)
2. Select your app (ID: `771396602627794`)
3. Settings → Basic
4. Add to **"Valid OAuth Redirect URIs"**:
   ```
   https://pezvnqhexxttlhcnbtta.supabase.co/auth/v1/callback
   ```

## For Local Development

If you want to test locally, also add:
```
http://localhost:3000/api/auth/instagram-supabase/callback
```

But the main one Supabase uses is:
```
https://pezvnqhexxttlhcnbtta.supabase.co/auth/v1/callback
```

## Your Credentials

- **Facebook Client ID**: `771396602627794`
- **Facebook Secret**: `67b086a74833746df6a0a7ed0b50f867`

Add these to Supabase Dashboard → Authentication → Providers → Facebook

---

## Next Steps

1. ✅ Add callback URL to Supabase Facebook provider
2. ✅ Add callback URL to Meta App settings
3. ✅ Enable Facebook provider in Supabase
4. ✅ Test Instagram connection

Then try connecting Instagram again!



