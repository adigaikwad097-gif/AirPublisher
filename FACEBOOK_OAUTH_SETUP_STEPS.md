# Facebook OAuth Setup - Step by Step

## ✅ Step 1: Supabase Dashboard (Done!)

You've already:
- ✅ Enabled Facebook provider
- ✅ Added Client ID: `771396602627794`
- ✅ Added Client Secret: `67b086a74833746df6a0a7ed0b50f867`
- ✅ Got callback URL: `https://pezvnqhexxttlhcnbtta.supabase.co/auth/v1/callback`

---

## Step 2: Add Callback URL to Meta App

1. **Go to**: [Meta Developers](https://developers.facebook.com/apps)
2. **Select your app**: ID `771396602627794`
3. **Click**: "Settings" → "Basic" (in left sidebar)
4. **Scroll down** to "Valid OAuth Redirect URIs"
5. **Click**: "Add URI"
6. **Paste**: 
   ```
   https://pezvnqhexxttlhcnbtta.supabase.co/auth/v1/callback
   ```
7. **Click**: "Save Changes"

---

## Step 3: Test Instagram Connection

1. **Go to**: `http://localhost:3000/settings/connections`
2. **Click**: "Connect Instagram"
3. **Should redirect** to Facebook OAuth (via Supabase)
4. **Authorize** your Instagram account
5. **Should redirect back** and store tokens

---

## If It Doesn't Work

### Check Terminal Logs

Look for:
```
[Instagram OAuth] Auth check: { hasUser: true/false, userEmail: '...', error: ... }
```

### Common Issues

1. **"Invalid redirect URI"**
   - Make sure you added the callback URL to Meta App settings
   - Wait a few minutes for Meta to update

2. **"App not approved"**
   - For development, you can add test users in Meta App settings
   - Or use your own Facebook account

3. **"No Instagram Business Account"**
   - Your Instagram must be a Business/Creator account
   - It must be linked to a Facebook Page

---

## Your Credentials Summary

**Supabase:**
- Client ID: `771396602627794`
- Client Secret: `67b086a74833746df6a0a7ed0b50f867`
- Callback URL: `https://pezvnqhexxttlhcnbtta.supabase.co/auth/v1/callback`

**Meta App:**
- App ID: `771396602627794`
- App Secret: `67b086a74833746df6a0a7ed0b50f867`
- Redirect URI: `https://pezvnqhexxttlhcnbtta.supabase.co/auth/v1/callback`

---

## Next: Configure Google (for YouTube)

After Instagram works, do the same for Google:
1. Supabase Dashboard → Authentication → Providers → Google
2. Add your Google OAuth Client ID and Secret
3. Add callback URL to Google Cloud Console

Ready to test Instagram connection?



