# Test Instagram Connection - Step by Step

## ✅ Pre-Flight Check

Before testing, make sure:

- [ ] Facebook Login is configured in Meta (you just did this ✅)
- [ ] Redirect URIs are added: `http://localhost:3000/api/auth/instagram/callback`
- [ ] Environment variables are in `.env.local`:
  - `META_APP_ID=771396602627794`
  - `META_APP_SECRET=67b086a74833746df6a0a7ed0b50f867`
- [ ] Dev server has been **restarted** after adding env variables

---

## 🚀 Step 1: Verify Environment Variables

1. **Make sure your dev server is running**:
   ```bash
   npm run dev
   ```

2. **Check if variables are loaded**:
   Visit: `http://localhost:3000/api/debug/env`

   You should see:
   ```json
   {
     "hasMETA_APP_ID": true,
     "hasMETA_APP_SECRET": true,
     ...
   }
   ```

   If `hasMETA_APP_ID: false`, you need to:
   - Check `.env.local` has the variables
   - Restart the dev server

---

## 🎯 Step 2: Test Instagram OAuth Flow

1. **Go to your connections page**:
   ```
   http://localhost:3000/settings/connections
   ```

2. **Click "Connect Instagram" button**

3. **What should happen**:
   - ✅ Redirects to **Facebook OAuth** page (not Instagram - this is correct!)
   - ✅ Shows Facebook login/authorization screen
   - ✅ You authorize the app
   - ✅ Redirects back to your app
   - ✅ Shows "Instagram connected successfully!" message
   - ✅ Green "Connected" badge appears

---

## 🔍 Step 3: What You'll See

### During OAuth Flow:

1. **Facebook OAuth Screen**:
   - Shows "Continue as [Your Name]" button
   - Lists permissions: "Access your Instagram account", etc.
   - Click "Continue" or "Authorize"

2. **Redirect Back to Your App**:
   - Should go to: `/settings/connections?success=instagram_connected`
   - Green success message appears
   - Instagram card shows "Connected" badge

---

## 🐛 Troubleshooting

### If it redirects back with an error:

Check the URL - it will have `?error=...` at the end.

Common errors:

- **`oauth_not_configured`**: Environment variables not loaded
  - Solution: Restart dev server, check `.env.local`

- **`missing_code`**: OAuth callback didn't receive code
  - Solution: Make sure redirect URI matches exactly in Meta

- **`token_exchange_failed`**: Couldn't exchange code for token
  - Solution: Check App ID/Secret are correct in Meta

- **`no_instagram_business_account`**: Your Instagram isn't a Business account
  - Solution: Convert Instagram to Business/Creator account, link to Facebook Page

### If nothing happens:

- **Check browser console** (F12 → Console tab)
- **Check terminal logs** - look for `[Instagram OAuth]` messages
- **Check Meta App Dashboard** - make sure Facebook Login is active

### If redirect URI mismatch:

- Meta says: "Invalid Redirect URI"
- **Check**: Redirect URI in Meta must match exactly:
  ```
  http://localhost:3000/api/auth/instagram/callback
  ```
- No trailing slash, exact match required

---

## ✅ Step 4: Verify Connection in Supabase

After successful connection, check Supabase:

1. **Go to**: Supabase Dashboard → Table Editor
2. **Open**: `instagram_tokens` table
3. **Should see**:
   - Your user's token record
   - `instagram_id` (Instagram Business Account ID)
   - `access_token` (long-lived token)
   - `username` (Instagram username)
   - `expires_at` (token expiration date)

---

## 🎉 Success Indicators

You'll know it worked when:

- ✅ You see "Instagram connected successfully!" message
- ✅ Green "Connected" badge on Instagram card
- ✅ Instagram username/channel info is displayed
- ✅ Token record appears in Supabase `instagram_tokens` table
- ✅ No errors in browser console or terminal

---

## 📝 Notes

- **Facebook OAuth Screen is Normal**: Instagram uses Facebook OAuth, so users see Facebook login screen first
- **Permissions Required**: You need `instagram_basic`, `instagram_content_publish`, `pages_show_list`, `pages_read_engagement`
- **Business Account Required**: Your Instagram must be a Business/Creator account linked to a Facebook Page

---

## 🆘 Still Having Issues?

1. **Wait a few minutes**: Meta changes can take 5-10 minutes to propagate
2. **Clear browser cache**: Ctrl+Shift+R or Cmd+Shift+R
3. **Check terminal logs**: Look for detailed error messages
4. **Verify redirect URI**: Must match exactly in Meta settings

---

## 🚀 Next Steps After Successful Connection

Once connected, you can:

1. **Store tokens** for posting content
2. **Use Instagram Graph API** to post videos/photos
3. **Schedule posts** via n8n workflows
4. **Connect YouTube** using the same process

Ready to test? Go to: `http://localhost:3000/settings/connections` and click "Connect Instagram"! 🎉






