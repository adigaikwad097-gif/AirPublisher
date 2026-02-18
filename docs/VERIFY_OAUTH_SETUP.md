# Verify OAuth Setup - Checklist

## ✅ Code Verification (Automated Check)

I've verified your OAuth routes are correctly configured:

### Instagram OAuth Route (`/api/auth/instagram`):
- ✅ Checks for `META_APP_ID` or `INSTAGRAM_APP_ID` 
- ✅ Uses redirect URI: `${NEXT_PUBLIC_APP_URL}/api/auth/instagram/callback`
- ✅ Builds Facebook OAuth URL with correct scopes
- ✅ Includes state parameter for security
- ✅ Has development mode bypass

### Instagram Callback Route (`/api/auth/instagram/callback`):
- ✅ Exchanges code for access token
- ✅ Exchanges for long-lived token
- ✅ Gets Instagram Business Account ID
- ✅ Stores tokens in `instagram_tokens` table
- ✅ Handles errors properly

### Settings Page:
- ✅ Links to `/api/auth/instagram` (correct route)
- ✅ Shows connection status
- ✅ Displays success/error messages

---

## 🧪 Manual Testing Steps

Since I can't click buttons in your browser, here's how **you** can test:

### Step 1: Start Dev Server (if not running)

```bash
npm run dev
```

Wait for: `Ready in X seconds` message

---

### Step 2: Verify Environment Variables

Visit in browser:
```
http://localhost:3000/api/debug/env
```

**Should show:**
```json
{
  "hasMETA_APP_ID": true,
  "hasMETA_APP_SECRET": true,
  "hasNEXT_PUBLIC_APP_URL": true,
  ...
}
```

**If `hasMETA_APP_ID: false`**:
- Check `.env.local` file
- Restart dev server

---

### Step 3: Test Instagram OAuth Flow

1. **Open browser**: `http://localhost:3000/settings/connections`
2. **Click**: "Connect Instagram" button
3. **Expected flow**:
   - Redirects to: `https://www.facebook.com/v18.0/dialog/oauth?...`
   - Shows Facebook login screen
   - You authorize the app
   - Redirects back to: `http://localhost:3000/api/auth/instagram/callback?...`
   - Then redirects to: `http://localhost:3000/settings/connections?success=instagram_connected`
   - Shows "Instagram connected successfully!" message

---

### Step 4: Check Terminal Logs

When you click "Connect Instagram", watch your terminal for:

```
[Instagram OAuth] Auth check: { hasUser: true/false, ... }
[Instagram OAuth] Environment check: { hasMETA_APP_ID: true, ... }
```

If you see errors, they'll show here.

---

### Step 5: Verify in Supabase

After successful connection:

1. **Go to**: Supabase Dashboard
2. **Table Editor** → `instagram_tokens` table
3. **Should see**:
   - Token record with your `user_id`
   - `instagram_id` (Instagram Business Account ID)
   - `access_token` (long-lived token)
   - `username` (Instagram username)

---

## 🐛 Common Issues & Solutions

### Issue: "Instagram OAuth not configured"

**Cause**: Environment variables not loaded  
**Solution**: 
- Check `.env.local` has `META_APP_ID=771396602627794`
- Restart dev server

---

### Issue: "Invalid Redirect URI"

**Cause**: Redirect URI in Meta doesn't match  
**Solution**: 
- Meta should have: `http://localhost:3000/api/auth/instagram/callback`
- Must match exactly (no trailing slash)

---

### Issue: Redirects back with no error, but no success

**Cause**: Token exchange failed or Instagram Business Account not found  
**Solution**: 
- Check terminal logs for specific error
- Make sure Instagram is Business/Creator account
- Make sure Instagram is linked to Facebook Page

---

### Issue: "No Instagram Business Account"

**Cause**: Instagram account isn't Business/Creator or not linked to Page  
**Solution**:
1. Convert Instagram to Business/Creator account
2. Link it to a Facebook Page
3. Make sure you manage that Facebook Page

---

## ✅ Expected OAuth URL

When you click "Connect Instagram", the redirect URL should look like:

```
https://www.facebook.com/v18.0/dialog/oauth?
  client_id=771396602627794
  &redirect_uri=http://localhost:3000/api/auth/instagram/callback
  &scope=instagram_basic,instagram_content_publish,pages_show_list,pages_read_engagement
  &response_type=code
  &state=...encrypted_state...
```

---

## 🎯 Success Criteria

You'll know it worked when:

- ✅ Redirects to Facebook OAuth (not Instagram directly)
- ✅ After authorization, redirects back to your app
- ✅ Shows "Instagram connected successfully!" message
- ✅ Green "Connected" badge appears
- ✅ Token record in Supabase `instagram_tokens` table
- ✅ No errors in terminal or browser console

---

## 🚀 Ready to Test!

Everything looks good in the code. Now:

1. **Make sure dev server is running**
2. **Go to**: `http://localhost:3000/settings/connections`
3. **Click**: "Connect Instagram"
4. **Watch terminal** for any errors
5. **Complete OAuth flow** in browser

If you encounter any errors, check:
- Terminal logs (detailed error messages)
- Browser console (F12 → Console)
- URL parameters (`?error=...` will show what went wrong)

Good luck! 🎉






