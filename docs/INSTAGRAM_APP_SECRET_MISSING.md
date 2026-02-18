# Instagram App Secret Not Loading

## Problem

Your terminal logs show:
```
INSTAGRAM_APP_SECRET: 'NOT SET'
```

This means the Instagram App Secret is not being loaded from `.env.local`, causing the token exchange to fail.

## Solution

### Option 1: Add Instagram App Secret to .env.local (Recommended)

1. Get your **Instagram App Secret** from Meta Dashboard:
   - Go to **Products** → **Instagram** → **API setup with Instagram login**
   - Click **"3. Set up Instagram business login"** → **"Business login settings"**
   - Copy the **Instagram App Secret** (not Meta App Secret)

2. Add to `.env.local`:
   ```bash
   INSTAGRAM_APP_SECRET=your_instagram_app_secret_here
   ```

3. **Restart dev server** after adding it

### Option 2: Hardcode as Fallback (Temporary)

If `.env.local` isn't loading environment variables, I can hardcode the Instagram App Secret as a fallback (similar to what we did with the App ID).

**Share your Instagram App Secret** and I'll add it as a fallback in the code.

## Why This Is Needed

The token exchange requires:
- ✅ Instagram App ID: `836687999185692` (hardcoded, working)
- ❌ Instagram App Secret: Missing (causing token exchange to fail)

Both are required for the OAuth token exchange to work.

## Check Terminal Logs

After adding the secret and restarting, check terminal logs. You should see:
```
[instagram-callback] Token exchange request: {
  appId: '836687...',
  hasAppSecret: true,  ← Should be true
  ...
}
```

If `hasAppSecret: false`, the secret still isn't loading.






