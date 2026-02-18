# Supabase Redirect URLs Configuration

## 🔴 Critical: Must Configure in Supabase Dashboard

The PKCE error happens if Supabase redirect URLs aren't configured correctly.

## ✅ Step-by-Step: Configure Supabase

### Step 1: Go to Supabase Dashboard

1. **Go to**: https://supabase.com/dashboard
2. **Select your project**: `pezvnqhexxttlhcnbtta`
3. **Go to**: **Authentication** → **URL Configuration**

### Step 2: Set Site URL

**Site URL** should be:
```
https://untasting-overhugely-kortney.ngrok-free.dev
```

Or your production URL if deployed.

### Step 3: Add Redirect URLs

In **Redirect URLs**, add these EXACT URLs (one per line):

```
https://untasting-overhugely-kortney.ngrok-free.dev/auth/callback
http://localhost:3000/auth/callback
```

**Important**: 
- Must include `/auth/callback` (not just the domain)
- Must match exactly (including `http://` vs `https://`)
- Add both ngrok and localhost URLs

### Step 4: Save Changes

Click **Save** and wait a few seconds for changes to propagate.

## 🔍 Verify Configuration

After saving, check:
- ✅ Site URL is set correctly
- ✅ Redirect URLs include `/auth/callback` path
- ✅ Both ngrok and localhost URLs are added

## ⚠️ Common Mistakes

1. **Missing `/auth/callback`** - Must include the full path
2. **Wrong protocol** - `http://` for localhost, `https://` for ngrok
3. **Extra trailing slash** - Don't add `/` at the end
4. **Not saving** - Must click Save button

## ✅ After Configuration

1. **Restart dev server** (if running)
2. **Test Google Sign-In** on ngrok URL
3. **Check server logs** for cookie debug output

---

## 📝 Quick Reference

**Supabase Project**: `pezvnqhexxttlhcnbtta`  
**Dashboard**: https://supabase.com/dashboard/project/pezvnqhexxttlhcnbtta/auth/url-configuration

**Redirect URLs to Add**:
- `https://untasting-overhugely-kortney.ngrok-free.dev/auth/callback`
- `http://localhost:3000/auth/callback`

---

**This is REQUIRED for PKCE to work!** Without correct redirect URLs, Supabase won't accept the OAuth callback.






