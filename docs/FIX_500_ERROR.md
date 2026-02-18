# Fix 500 Internal Server Error

## Problem
The server is returning a 500 error when accessing the home page.

## Solution Applied

I've added error handling to prevent crashes:

1. **Supabase Client** - Now handles missing environment variables gracefully
2. **Providers Component** - Added try-catch to prevent crashes
3. **Middleware** - Added error handling to skip auth if env vars are missing

## To Fix:

### Step 1: Check Environment Variables
Make sure you have `.env.local` with:
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

### Step 2: Restart Dev Server
1. Stop the dev server (Ctrl + C)
2. Restart:
   ```bash
   npm run dev
   ```

### Step 3: Check Terminal for Errors
Look at the terminal where `npm run dev` is running. You should see:
- Any missing environment variable warnings
- Any other error messages

## What Changed:
- Added error handling to prevent crashes
- App will work even if Supabase env vars are missing (with warnings)
- Better error messages in console

The app should now load even if there are configuration issues. Check the browser console and terminal for any warnings.






