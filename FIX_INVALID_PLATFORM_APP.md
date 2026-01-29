# Fix "Invalid platform app" Error for Instagram OAuth

**Good news**: The redirect to Instagram is working! ✅

**Error**: "Invalid Request: Request parameters are invalid: Invalid platform app"

This error means your App ID is not configured correctly for Instagram Business Login.

## Why This Happens

The "Invalid platform app" error occurs when:
1. You're using **Meta App ID** instead of **Instagram App ID**
2. Instagram Business Login is not properly set up in your Meta App
3. The app is not configured to use Instagram API with Instagram Login

## Solution

### Step 1: Get Instagram App ID and Secret (NOT Meta App ID)

**Important**: You need the Instagram App ID from Instagram-specific settings, not the Meta App ID from general app settings.

1. Go to [Meta for Developers Dashboard](https://developers.facebook.com/apps/)
2. Select your app
3. Navigate to: **Products** → **Instagram** → **API setup with Instagram login**
4. Click on **"3. Set up Instagram business login"**
5. Click on **"Business login settings"**
6. Copy the **Instagram App ID** and **Instagram App Secret** from this page
   - These are **different** from the Meta App ID/Secret in Settings → Basic

### Step 2: Update Environment Variables

Update your `.env.local` file:

```bash
# Instagram Business Login (from Instagram > Business login settings)
INSTAGRAM_APP_ID=your_instagram_app_id_from_business_login_settings
INSTAGRAM_APP_SECRET=your_instagram_app_secret_from_business_login_settings

# Remove or comment out META_APP_ID/META_APP_SECRET if they're different
# META_APP_ID=771396602627794  # This might be the Meta App ID, not Instagram App ID
# META_APP_SECRET=xxx  # This might be the Meta App Secret, not Instagram App Secret
```

**Note**: The Instagram App ID might be different from your Meta App ID (`771396602627794`).

### Step 3: Verify Instagram Business Login is Enabled

1. In Meta Dashboard, go to **Products** → **Instagram** → **API setup with Instagram login**
2. Ensure **"Instagram API with Instagram Login"** is enabled
3. Check that **"3. Set up Instagram business login"** is completed
4. Verify the redirect URI `http://localhost:3000/api/auth/instagram/callback` is listed in **Business login settings**

### Step 4: Check Redirect URI Match

The redirect URI must match **exactly**:

1. Go to **Instagram** → **Business login settings**
2. Check the **Valid OAuth Redirect URIs** list
3. Ensure `http://localhost:3000/api/auth/instagram/callback` is listed **exactly** (no trailing slash, correct protocol)

### Step 5: Restart Dev Server

After updating `.env.local`:

```bash
# Stop your dev server (Ctrl+C)
# Restart it
npm run dev
```

## How to Verify You Have the Right App ID

**Wrong App ID** (Meta App ID):
- Found in: **Settings** → **Basic** → **App ID**
- Example: `771396602627794` (this is your Meta App ID)
- ❌ Won't work for Instagram Business Login

**Correct App ID** (Instagram App ID):
- Found in: **Instagram** → **API setup with Instagram login** → **Business login settings**
- Might be the same as Meta App ID, but could be different
- ✅ Works for Instagram Business Login

## Debug: Check What App ID You're Using

Add this temporarily to see what App ID is being used:

```typescript
// In app/api/auth/instagram/route.ts (temporarily for debugging)
console.log('[Instagram OAuth] Using App ID:', appId.substring(0, 4) + '...')
console.log('[Instagram OAuth] App ID source:', process.env.INSTAGRAM_APP_ID ? 'INSTAGRAM_APP_ID' : 'META_APP_ID')
```

## Still Not Working?

### Check App Status

1. Go to **Settings** → **Basic**
2. Check **App Mode**: Should be **Development** or **Live**
3. If in Development mode, ensure your Facebook account is added as a Developer/Tester

### Check Instagram Product Status

1. Go to **Products** → **Instagram**
2. Check if **"Instagram API with Instagram Login"** shows as **Active** or **In Review**
3. If it's disabled, click **"Set Up"** and complete the setup flow

### Verify Redirect URI Format

The redirect URI in your code:
```typescript
const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/auth/instagram/callback`
```

Ensure `NEXT_PUBLIC_APP_URL` is set correctly in `.env.local`:
```bash
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Reference

- [Instagram Business Login Setup](https://developers.facebook.com/docs/instagram-platform/instagram-api-with-instagram-login/business-login)
- [Instagram OAuth Authorization](https://developers.facebook.com/docs/instagram-platform/instagram-api-with-instagram-login/business-login)



