# Debug: INSTAGRAM_APP_ID Not Loading from .env.local

Your terminal logs still show `META_APP_ID` even after restart, which means `INSTAGRAM_APP_ID` isn't being loaded.

## Possible Issues

### Issue 1: Typo or Formatting in .env.local

Check your `.env.local` file:

**✅ Correct format**:
```bash
INSTAGRAM_APP_ID=836687999185692
INSTAGRAM_APP_SECRET=your_secret_here
```

**❌ Wrong formats**:
```bash
# Wrong: Quotes around value
INSTAGRAM_APP_ID="836687999185692"

# Wrong: Spaces around =
INSTAGRAM_APP_ID = 836687999185692

# Wrong: Missing equals sign
INSTAGRAM_APP_ID 836687999185692

# Wrong: Wrong variable name
INSTA_APP_ID=836687999185692

# Wrong: Comment on same line (might cause issues)
INSTAGRAM_APP_ID=836687999185692 # Instagram App ID
```

### Issue 2: File Location

Make sure `.env.local` is in the **project root** (same directory as `package.json`):

```
airpublisher/
  ├── .env.local          ← Should be here
  ├── package.json
  ├── app/
  └── ...
```

### Issue 3: Case Sensitivity

Variable name must be **exactly** `INSTAGRAM_APP_ID` (uppercase, underscores):

**✅ Correct**:
```bash
INSTAGRAM_APP_ID=836687999185692
```

**❌ Wrong**:
```bash
instagram_app_id=836687999185692  # lowercase
InstaGram_App_Id=836687999185692  # mixed case
INSTAGRAMAPPID=836687999185692    # no underscores
```

### Issue 4: Multiple .env Files

If you have multiple `.env` files, check:
- `.env.local` (this is what Next.js reads)
- `.env` (Next.js also reads this, but `.env.local` takes precedence)
- Make sure `INSTAGRAM_APP_ID` is in `.env.local`, not just `.env`

### Issue 5: Dev Server Not Fully Restarted

Make sure you:
1. Stopped the server completely (`Ctrl+C` and wait)
2. Started it fresh (`npm run dev`)
3. Checked logs **after** restart (not before)

## Debug Steps

### Step 1: Verify .env.local Format

Open `.env.local` and check line with `INSTAGRAM_APP_ID`:

```bash
# Should look exactly like this:
INSTAGRAM_APP_ID=836687999185692

# No quotes, no spaces, no typos
```

### Step 2: Test if Environment Variable is Loaded

Add temporary debug logging in `app/api/auth/instagram/route.ts`:

```typescript
// After line 58 in route.ts, add:
console.log('[DEBUG] All Instagram-related env vars:', {
  INSTAGRAM_APP_ID: process.env.INSTAGRAM_APP_ID || 'NOT FOUND',
  INSTAGRAM_APP_SECRET: process.env.INSTAGRAM_APP_SECRET ? 'SET' : 'NOT FOUND',
  META_APP_ID: process.env.META_APP_ID ? 'SET' : 'NOT FOUND',
})
```

After restarting, check terminal logs - you should see if `INSTAGRAM_APP_ID` is being read.

### Step 3: Check .env.local File Location

Run this in your terminal:

```bash
cd /Users/suniya/Desktop/airpublisher
ls -la .env.local
```

If you get "No such file or directory", the file is in the wrong location.

### Step 4: Verify Variable Name

Search for `INSTAGRAM_APP_ID` in `.env.local`:

```bash
grep -i "INSTAGRAM_APP_ID" .env.local
```

You should see exactly:
```
INSTAGRAM_APP_ID=836687999185692
```

If you see anything else, that's the problem.

## Quick Test

Try this - **temporarily** change your code to use the Instagram App ID directly (just to test):

In `app/api/auth/instagram/route.ts`, line 58, change from:
```typescript
const appId = process.env.INSTAGRAM_APP_ID || process.env.META_APP_ID
```

To (temporarily, for testing):
```typescript
const appId = '836687999185692' || process.env.INSTAGRAM_APP_ID || process.env.META_APP_ID
```

**Only do this to test** - if it works, then we know the issue is `.env.local` not being read.

If this works, then the problem is definitely `.env.local` not loading. If it still doesn't work, then the issue is something else (Meta Dashboard configuration).

## Most Likely Cause

Based on your terminal logs still showing `META_APP_ID`, the most likely cause is:

1. **Typo in variable name** (e.g., `INSTA_APP_ID` instead of `INSTAGRAM_APP_ID`)
2. **Quotes or spaces** around the value
3. **File location** (`.env.local` not in project root)
4. **Dev server not fully restarted** (still running old instance)

Check these first!






