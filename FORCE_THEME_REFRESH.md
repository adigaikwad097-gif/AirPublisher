# Force Theme Refresh - Step by Step

## The Problem
You're not seeing theme changes because of caching. Here's how to force a refresh:

## Solution 1: Clear Next.js Cache (RECOMMENDED)

I've already cleared the `.next` cache. Now:

1. **Stop the dev server** (if running):
   - Press `Ctrl + C` in the terminal

2. **Restart the dev server**:
   ```bash
   npm run dev
   ```

3. **Hard refresh your browser**:
   - Mac: `Cmd + Shift + R`
   - Windows/Linux: `Ctrl + Shift + R`

## Solution 2: Clear Browser Cache Completely

1. Open Chrome DevTools (F12 or Cmd+Option+I)
2. Right-click the refresh button
3. Select "Empty Cache and Hard Reload"
4. Or go to Settings → Privacy → Clear browsing data → Cached images and files

## Solution 3: Test in Incognito/Private Window

1. Open a new incognito/private window
2. Navigate to `http://localhost:3000`
3. This bypasses all cache

## What Changed

The theme has been updated to match the banking dashboard:

- **Background**: Changed from `#0f172a` to `#0a0e1a` (darker)
- **Primary Color**: Changed to light blue `#60a5fa` (banking style)
- **Cards**: Dark grey `#1a1f2e` with subtle borders
- **Typography**: More professional, cleaner spacing
- **Sidebar**: Now uses `text-primary` for the logo

## Verify Changes

After refreshing, you should see:
- Darker background
- Light blue accent color (instead of bright cyan)
- More professional card styling
- Cleaner typography

If you STILL don't see changes after all these steps, let me know and I'll check for other issues.


