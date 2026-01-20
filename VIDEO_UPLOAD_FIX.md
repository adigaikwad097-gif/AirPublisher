# Video File Upload Fix

## 🔧 What Was Fixed

The upload form was only creating a database record but **not uploading the actual video file** to Supabase Storage.

## ✅ Changes Made

1. **Created API Route** (`/api/videos/[id]/upload`)
   - Handles file upload to Supabase Storage
   - Updates video record with storage URL after upload
   - Uses service role fallback if RLS blocks upload

2. **Updated Upload Form**
   - Now uploads file after creating video record
   - Shows proper error messages if upload fails

## 📋 How It Works Now

1. **User fills form** (title, description, selects file)
2. **Clicks "Upload Video"**
3. **Database record created** with `status: 'draft'`
4. **File uploaded** to Supabase Storage bucket `air-publisher-videos`
5. **Video record updated** with `video_url` pointing to storage
6. **Success message** shows

## 🚀 Setup Required

### 1. Create Storage Bucket in Supabase

If the bucket doesn't exist:

1. Go to Supabase Dashboard → Storage
2. Click "New Bucket"
3. Name: `air-publisher-videos`
4. **Make it Public** (or configure RLS policies for authenticated access)
5. Click "Create Bucket"

### 2. Test Upload

1. Go to `/upload` page
2. Fill in video details
3. Select a video file
4. Click "Upload Video"
5. Should see success message
6. Check Supabase Storage - file should be there
7. Check `air_publisher_videos` table - should have `video_url`

## 🐛 Troubleshooting

### "Bucket not found" Error

**Solution**: Create the `air-publisher-videos` bucket in Supabase Storage

### "Permission denied" Error

**Check**:
- Bucket RLS policies allow uploads
- Or make bucket Public (for testing)

**Fix**:
- Go to Storage → Bucket Settings
- Check RLS policies or set to Public

### File Too Large

**Limit**: Supabase Storage has size limits depending on plan

**Fix**: Check file size, compress if needed, or use direct uploads for large files

## 📝 Storage Path Structure

Files are stored as:
```
air-publisher-videos/
  {creator_unique_identifier}/
    {video_id}.{extension}
```

Example:
```
air-publisher-videos/
  dev_1768492273213_6pnzafm/
    123e4567-e89b-12d3-a456-426614174000.mp4
```

## ✅ Success Indicators

You'll know it's working when:

- ✅ Success message shows after upload
- ✅ File appears in Supabase Storage bucket
- ✅ `video_url` column is filled in `air_publisher_videos` table
- ✅ Video can be played from the storage URL

---

**Next**: Try uploading a video now - it should save both the database record AND the file! 🎉


