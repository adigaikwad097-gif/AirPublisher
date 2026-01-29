# Check Publish Status

## Issue
- Video URL was set successfully ✅
- Publish action returns `null` ❌
- Discover page is empty ❌

## Debug Steps

### Step 1: Check Video Status
Visit this URL (replace `{video-id}` with your video ID):
```
http://localhost:3000/api/debug/video-status/a0b7d771-e40d-4a14-81e3-a8d59e1a6d81
```

This will show:
- Current video status (`draft` or `posted`)
- Whether `posted_at` is set
- If RLS is blocking the query

### Step 2: Check Terminal Logs
When you clicked "Publish Video", check your terminal for:
- `[publishVideoAction] Publishing video: ...`
- `[updateVideoAction] ✅ Ownership verified, updating video: ...`
- `[updateVideo] Updating video: ...`
- `[updateVideo] ✅ Video updated successfully...` OR error messages

**If you see errors:**
- Share the error message
- Check if it's an RLS issue

**If you see no errors but status is still `draft`:**
- The update might be failing silently
- Check if service role fallback is being used

### Step 3: Check Discover Page Query
Visit `/discover` and check terminal for:
- `[getAllPostedVideos] Fetching posted videos...`
- `[getAllPostedVideos] ✅ Service role found videos: X`

## Quick Fix Test

Try publishing again and check:
1. **Terminal logs** - what does `[updateVideo]` show?
2. **Debug endpoint** - is status `posted` after publish?
3. **Discover page** - does it show videos after refresh?

## Most Likely Issue

The `updateVideo` function is returning `null` because:
1. RLS is blocking the update (but service role fallback should catch this)
2. The update succeeds but `.select()` returns empty (shouldn't happen)
3. The video ID doesn't match (unlikely since ownership check passed)

Check terminal logs to see which one it is!



