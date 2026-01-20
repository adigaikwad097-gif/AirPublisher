# Debug: Video Upload "Video not found" Error

## 🔍 The Problem

When uploading a video:
1. Database record is created ✅
2. Upload route can't find the video ❌

This happens because:
- The video is created via server action (server-side)
- The upload route runs immediately after (server-side)
- RLS might block the lookup OR there's a timing issue

## 🔧 What I Fixed

1. **Added service role fallback** to video lookup
2. **Improved error logging** to see what's happening
3. **Better error messages** with details

## 📋 Check Terminal Logs

When you upload a video, check your **terminal** (where `npm run dev` is running) for:

```
[createVideoAction] Starting video creation...
[createVideoAction] Creator found: ...
[createVideoAction] ✅ Video created successfully: {video-id}
[UploadForm] ✅ Video record created: {id: ..., title: ...}
[UploadForm] Uploading file to Supabase Storage...
[upload] Looking up video: {video-id}
[upload] ✅ Found video via regular client: {video-id}
```

OR if it fails:

```
[upload] Regular client error fetching video: {error details}
[upload] Regular client failed, trying service role...
[upload] ✅ Found video via service role: {video-id}
```

## 🐛 Common Issues

### Issue 1: RLS Blocking Video Lookup

**Symptoms**: Regular client can't find video, service role works

**Solution**: Already fixed with service role fallback

---

### Issue 2: Video Not Actually Created

**Symptoms**: `createVideoAction` returns but video doesn't exist in database

**Check**:
1. Look at terminal logs - does it say "Video created successfully"?
2. Check Supabase Dashboard - does video exist in `air_publisher_videos` table?

**Fix**: If video doesn't exist, the creation is failing silently

---

### Issue 3: Wrong Video ID

**Symptoms**: Video ID mismatch between creation and lookup

**Check**:
- Console logs show the video ID from `createVideoAction`
- Upload route receives the same ID

**Fix**: Already logging both to verify

---

## ✅ Verify Video Was Created

Check Supabase directly:

1. **Go to**: Supabase Dashboard → Table Editor
2. **Open**: `air_publisher_videos` table
3. **Check**: Is your video there?
   - Should have `id`, `title`, `creator_unique_identifier`
   - Status should be `'draft'`

If video **doesn't exist** in Supabase:
- The creation is failing
- Check terminal logs for `[createVideoAction]` errors

If video **exists** but upload still fails:
- RLS is blocking the lookup
- Service role fallback should fix it (now implemented)

---

## 🧪 Test Steps

1. **Open browser console** (F12 → Console tab)
2. **Open terminal** (where `npm run dev` is running)
3. **Upload a video**
4. **Watch both**:
   - Browser console: Client-side logs
   - Terminal: Server-side logs

**Look for**:
- `[createVideoAction]` logs (creation)
- `[UploadForm]` logs (form submission)
- `[upload]` logs (file upload route)

---

## 📝 What the Logs Should Show

### Success Flow:

**Terminal:**
```
[createVideoAction] Starting video creation...
[createVideoAction] Creator found: dev_...
[createVideoAction] ✅ Video created successfully: 123e4567-...
[UploadForm] ✅ Video record created: {id: '123e4567-...'}
[upload] Looking up video: 123e4567-...
[upload] ✅ Found video via regular client: 123e4567-...
[upload] File uploaded successfully: https://...
```

**Browser Console:**
```
Video record created: 123e4567-...
Uploading file to Supabase Storage...
File uploaded successfully: https://...
```

---

## 🚀 Next Steps

1. **Try uploading again**
2. **Watch terminal logs** - what errors do you see?
3. **Check browser console** - what's there?
4. **Share the logs** so I can see what's happening

The logs will tell us exactly where it's failing! 🔍


