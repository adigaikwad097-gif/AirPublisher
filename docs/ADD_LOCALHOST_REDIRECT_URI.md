# Add Localhost Redirect URI to Instagram Business Login

## Current Issue

The embed URL from Meta Dashboard shows:
- **Instagram App ID**: `836687999185692` ✅ (correct)
- **Redirect URI**: `https://pezvnqhexxttlhcnbtta.supabase.co/functions/v1/instagram-auth` ❌ (Supabase function, not our app)

Our app is using: `http://localhost:3000/api/auth/instagram/callback`

## Solution: Add Localhost Redirect URI

You need to add `http://localhost:3000/api/auth/instagram/callback` to the Valid OAuth Redirect URIs in Instagram Business Login settings.

### Step-by-Step

1. **Go to Meta Dashboard**: https://developers.facebook.com/apps/
2. **Select your app** (the one with Instagram App ID `836687999185692`)
3. **Navigate to**: **Products** → **Instagram** → **API setup with Instagram login**
4. **Click**: **"3. Set up Instagram business login"**
5. **Click**: **"Business login settings"**
6. **Scroll to**: **"Valid OAuth Redirect URIs"** section
7. **Click**: **"Add URI"** button
8. **Add this EXACT URL**:
   ```
   http://localhost:3000/api/auth/instagram/callback
   ```
   ⚠️ **Important**: 
   - Use `http://` (not `https://`)
   - No trailing slash
   - Exact path: `/api/auth/instagram/callback`

9. **Click**: **"Save Changes"**
10. **Wait 2-5 minutes** for Meta to update

### After Adding

1. **Restart your dev server** (if it's running)
2. **Try connecting Instagram again**
3. It should work now! ✅

## Multiple Redirect URIs

You can have multiple redirect URIs in the list:
- `https://pezvnqhexxttlhcnbtta.supabase.co/functions/v1/instagram-auth` (for Supabase)
- `http://localhost:3000/api/auth/instagram/callback` (for local development) ← **Add this one**
- `https://your-production-domain.com/api/auth/instagram/callback` (for production, when ready)

All of these can exist simultaneously - just make sure your localhost one is added.

## Verify It's Added

After adding, you should see in **Business login settings**:

**Valid OAuth Redirect URIs:**
- `https://pezvnqhexxttlhcnbtta.supabase.co/functions/v1/instagram-auth`
- `http://localhost:3000/api/auth/instagram/callback` ← **This should be here**

## Why This Is Needed

Instagram OAuth requires that the `redirect_uri` parameter in the OAuth request **exactly matches** one of the URIs in the "Valid OAuth Redirect URIs" list.

Your embed URL shows `https://pezvnqhexxttlhcnbtta.supabase.co/functions/v1/instagram-auth`, but our code is using `http://localhost:3000/api/auth/instagram/callback`, so we need both URIs in the list.






