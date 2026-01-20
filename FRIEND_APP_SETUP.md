# Using Friend's Instagram App

## ✅ App Credentials

- **App ID**: `771396602627794`
- **App Secret**: `67b086a74833746df6a0a7ed0b50f867` (if this is the correct secret)

## 📝 Update `.env.local`

Make sure your `.env.local` has:

```bash
META_APP_ID=771396602627794
META_APP_SECRET=67b086a74833746df6a0a7ed0b50f867
```

**Note**: If your friend gave you a different app secret, use that instead!

## ⚠️ Important: Redirect URI Setup

Your friend needs to add these redirect URIs to their Meta App (`771396602627794`):

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

## 🔄 After Setup

1. **Update `.env.local`** with the app ID and secret
2. **Restart dev server**:
   ```bash
   # Stop (Ctrl+C)
   npm run dev
   ```
3. **Ask your friend** to add the redirect URIs to their app
4. **Test Instagram connection**

## ✅ Verify

When you click "Connect Instagram", the URL should show:
- `client_id=771396602627794`

If your friend's app is configured to redirect directly to Instagram (not Facebook), it should work!

---

**Question**: Does your friend have a different app secret, or is `67b086a74833746df6a0a7ed0b50f867` the correct one?


