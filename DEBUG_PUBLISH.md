# Debug Publish Video Issue

## Problem
- Clicking "Publish Video" shows "Video published successfully" alert
- But console (browser) doesn't show any logs
- Discover page is empty

## Possible Issues

### 1. Server Action Not Being Called
- Check browser console (F12 → Console tab)
- Look for `[PublishVideoButton]` logs
- If no logs appear, the button click handler might not be firing

### 2. Server Logs Not Showing
- Server logs appear in **terminal** (where `npm run dev` is running)
- NOT in browser console
- Check terminal for `[publishVideoAction]` and `[updateVideoAction]` logs

### 3. Action Succeeds But Status Doesn't Update
- Video might be updating but status isn't changing
- Check video status via debug endpoint: `/api/debug/video-status/{video-id}`

## Debug Steps

### Step 1: Check Browser Console
1. Open browser DevTools (F12)
2. Go to Console tab
3. Click "Publish Video" button
4. Look for:
   - `[PublishVideoButton] Starting publish for video: {id}`
   - `[PublishVideoButton] Calling publishVideoAction...`
   - `[PublishVideoButton] ✅ Publish action completed: {...}`

**If you see NO logs:**
- Button click handler isn't firing
- Check if button is disabled
- Check for JavaScript errors

**If you see logs but action fails:**
- Check the error message
- Check terminal for server-side errors

### Step 2: Check Terminal (Server Logs)
1. Look at terminal where `npm run dev` is running
2. Click "Publish Video" button
3. Look for:
   - `[publishVideoAction] Publishing video: {id}`
   - `[updateVideoAction] ✅ Ownership verified, updating video: {id}`
   - `[updateVideo] Updating video: {id, updates}`
   - `[updateVideo] ✅ Updated video via service role: {id}`

**If you see NO logs:**
- Server action isn't being called
- Check network tab in browser DevTools
- Look for POST request to server action

**If you see error logs:**
- Share the error message
- Check if it's an RLS issue or ownership issue

### Step 3: Check Video Status
1. Get video ID from "My Videos" page
2. Visit: `http://localhost:3000/api/debug/video-status/{video-id}`
3. Check:
   - `serviceClient.video.status` - should be `"posted"`
   - `serviceClient.video.posted_at` - should be set

**If status is still `"draft"`:**
- Update didn't work
- Check terminal logs for errors

**If status is `"posted"` but discover is empty:**
- `getAllPostedVideos` might be failing
- Check terminal for `[getAllPostedVideos]` logs

## Quick Test

Try this in browser console (F12 → Console):
```javascript
// Test if button click handler works
document.querySelector('button:contains("Publish Video")')?.click()
```

Or manually trigger the action:
```javascript
// Import and test the action directly
import { publishVideoAction } from '/app/api/videos/actions'
publishVideoAction('your-video-id-here')
```

## What to Share

1. **Browser console logs** (F12 → Console) when clicking publish
2. **Terminal logs** (where `npm run dev` is running) when clicking publish
3. **Debug endpoint output**: `/api/debug/video-status/{video-id}` after publishing
4. **Network tab** (F12 → Network) - look for server action POST request


