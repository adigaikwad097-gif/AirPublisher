# Fix: Instagram OAuth Using Meta App ID Instead of Instagram App ID

## Problem Identified ✅

Your terminal logs show:
```
App ID being used: 771396...
App ID source: META_APP_ID
```

**This means**: The code is using Meta App ID (`771396602627794`) instead of Instagram App ID (`836687999185692`).

**Why this happens**: `INSTAGRAM_APP_ID` is not set in `.env.local`, so the code falls back to `META_APP_ID`.

## Solution

### Step 1: Update `.env.local`

Make sure your `.env.local` file has:

```bash
# Instagram Business Login (from Instagram > Business login settings)
INSTAGRAM_APP_ID=836687999185692
INSTAGRAM_APP_SECRET=your_instagram_app_secret_here

# Meta App (can keep these, but Instagram OAuth uses INSTAGRAM_APP_ID above)
META_APP_ID=771396602627794
META_APP_SECRET=67b086a74833746df6a0a7ed0b50f867
```

**Important**:
- No quotes around the values
- No spaces around `=`
- Exact value: `836687999185692` (no typos)
- Make sure `INSTAGRAM_APP_ID` comes **before** `META_APP_ID` (or just set `INSTAGRAM_APP_ID`)

### Step 2: Restart Dev Server

**Critical**: Environment variables are only loaded when the server starts.

1. **Stop your dev server**: Press `Ctrl+C` in the terminal
2. **Wait 2 seconds**
3. **Start it again**: `npm run dev`

### Step 3: Verify

After restarting, when you click "Connect Instagram", check terminal logs again.

**You should now see**:
```
App ID being used: 836687...
App ID source: INSTAGRAM_APP_ID
```

✅ If you see this, it's using the correct Instagram App ID!

### Step 4: Try Connecting Instagram Again

Now that it's using the correct App ID, try connecting Instagram again.

It should now redirect properly (using Instagram App ID `836687999185692` instead of Meta App ID `771396602627794`).

## Why This Fixes It

The code in `app/api/auth/instagram/route.ts` uses:

```typescript
const appId = process.env.INSTAGRAM_APP_ID || process.env.META_APP_ID
```

If `INSTAGRAM_APP_ID` is not set (or dev server wasn't restarted), it falls back to `META_APP_ID`.

Since you're using Instagram Business Login, you **must** use `INSTAGRAM_APP_ID` (from Instagram Business Login settings), not `META_APP_ID` (from general app settings).

## After Fixing

Your terminal logs should show:
- ✅ `App ID being used: 836687...` (Instagram App ID)
- ✅ `App ID source: INSTAGRAM_APP_ID`

Then Instagram OAuth should work! 🎉


