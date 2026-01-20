# YouTube Publishing Guide

## How Publishing Works

When you click "Publish Video" for a YouTube video:

1. **Video status changes to 'scheduled'** with immediate time
2. **n8n workflow picks it up** and uploads to YouTube
3. **Video status updates to 'posted'** after successful upload

## Current Status

⚠️ **YouTube direct upload is not yet implemented in the app**. The system relies on **n8n** (automation workflow tool) to handle the actual YouTube upload.

## Quick Options

### Option 1: Use n8n (Recommended for Production)

n8n will automatically:
- Pick up scheduled videos
- Upload to YouTube using your tokens
- Update video status

**Setup:**
1. Set up n8n (self-hosted or cloud)
2. Create a workflow that:
   - Checks for videos with `status: 'scheduled'` and `scheduled_at <= now`
   - Gets video details and YouTube tokens
   - Uploads video to YouTube using YouTube Data API v3
   - Updates video status to 'posted'

See `N8N_INTEGRATION.md` for details.

### Option 2: Manual Upload (For Testing)

For now, you can manually upload videos to YouTube:

1. Download your video from Supabase Storage
2. Go to YouTube Studio
3. Upload the video manually
4. Copy the YouTube video URL
5. Update the video status in the database

### Option 3: Wait for Direct Upload Implementation

A direct YouTube upload feature is planned. This will:
- Download video from Supabase Storage
- Upload directly to YouTube using YouTube Data API v3
- Set video status automatically

---

## How to Check if Video is Scheduled

After clicking "Publish", check the video in "My Videos":
- **Status**: Should be "scheduled"
- **Scheduled At**: Should be the current time
- **Platform**: Should be "youtube"

If n8n is configured and running, it will pick up the video within a few minutes and upload it to YouTube.

---

## Troubleshooting

### Video stays in "scheduled" status

**Possible causes:**
1. **n8n not configured** - n8n workflow needs to be set up
2. **n8n not running** - Check if n8n instance is active
3. **YouTube tokens expired** - Reconnect your YouTube account in Settings
4. **Video file not accessible** - Check if `video_url` is set correctly

### n8n workflow not picking up videos

**Check:**
1. n8n workflow is running on a schedule (every 5-15 minutes)
2. Workflow queries videos with `status: 'scheduled'`
3. Workflow has correct API endpoints configured
4. n8n has access to your Next.js API routes

---

## Future: Direct YouTube Upload

We plan to implement direct YouTube upload that will:
- ✅ Work immediately without n8n
- ✅ Upload videos directly from Supabase Storage to YouTube
- ✅ Handle large files with resumable upload
- ✅ Set thumbnails automatically
- ✅ Return YouTube video ID and URL

This feature is coming soon!


