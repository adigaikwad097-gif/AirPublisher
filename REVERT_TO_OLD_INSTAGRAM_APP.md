# Revert to Old Instagram App

## ✅ Updated Configuration

I've reverted to using the **original Meta App**:

- **App ID**: `771396602627794`
- **App Secret**: `67b086a74833746df6a0a7ed0b50f867`

## 📝 Update Your `.env.local` File

Make sure your `.env.local` has:

```bash
# Instagram OAuth (Meta/Facebook)
META_APP_ID=771396602627794
META_APP_SECRET=67b086a74833746df6a0a7ed0b50f867
```

## 🔄 Next Steps

1. **Update `.env.local`** with the old app credentials above
2. **Restart dev server**:
   ```bash
   # Stop (Ctrl+C)
   npm run dev
   ```

## ⚠️ Important: Add Redirect URI to OLD App

Since we're using the old app (`771396602627794`), make sure the redirect URI is added to **this app**:

1. **Go to**: https://developers.facebook.com/apps/771396602627794/settings/basic/

2. **Products → Facebook Login → Settings**:
   - Enable **Client OAuth Login**: ✅ ON
   - Enable **Web OAuth Login**: ✅ ON
   - **Valid OAuth Redirect URIs**: Add:
     ```
     http://localhost:3000/api/auth/instagram/callback
     https://untasting-overhugely-kortney.ngrok-free.dev/api/auth/instagram/callback
     ```

3. **Settings → Basic**:
   - **App Domains**: Add `localhost`
   - **Website**: Add `http://localhost:3000`

4. **Save Changes** and wait 1-2 minutes

## ✅ After Updating

1. Update `.env.local` with old app ID/secret
2. Restart dev server
3. Add redirect URIs to app `771396602627794`
4. Try connecting Instagram again

The URL should now show `client_id=771396602627794` when you click "Connect Instagram".


