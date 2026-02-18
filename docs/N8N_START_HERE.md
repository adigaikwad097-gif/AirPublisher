# n8n Setup - Start Here! 🚀

## Why You Need n8n

Right now, when you click "Publish Video" for YouTube:
- ✅ Video status changes to "scheduled"
- ❌ But nothing actually uploads to YouTube

**n8n is the automation tool that will:**
1. Check for scheduled videos
2. Upload them to YouTube (using your connected account)
3. Update the video status to "posted"

## Quick Start Guide

### Step 1: Set Up n8n

You have two options:

#### Option A: n8n Cloud (Easiest - Recommended)
1. Sign up at https://n8n.io/cloud
2. Create a new workspace
3. You're ready to go!

#### Option B: Self-Hosted n8n
1. Install n8n:
   ```bash
   npm install n8n -g
   # or
   docker run -it --rm --name n8n -p 5678:5678 n8nio/n8n
   ```
2. Access at http://localhost:5678

### Step 2: Get Your API Key

1. In n8n, go to **Settings → API**
2. Create a new API key (or use an existing one)
3. **Copy the API key**

### Step 3: Add API Key to Your App

Add to your `.env.local`:

```bash
N8N_API_KEY=your_n8n_api_key_here
```

### Step 4: Create Your First Workflow

This workflow will:
- Check for scheduled YouTube videos every 5 minutes
- Upload them to YouTube
- Update status to "posted"

#### Workflow Steps:

1. **Cron Trigger** (runs every 5 minutes)
   - Rule: `*/5 * * * *` (every 5 minutes)

2. **HTTP Request** - Get Scheduled Videos
   - Method: GET
   - URL: `https://your-app-url.com/api/n8n/scheduled-posts`
   - Headers:
     - `x-n8n-api-key`: `{{ $env.N8N_API_KEY }}`
   - Query Parameters:
     - `limit`: `10`
     - `before`: `{{ $now.toISO() }}`

3. **Split in Batches** (process videos one by one)
   - Batch Size: `1`

4. **HTTP Request** - Get Video Details
   - Method: GET
   - URL: `https://your-app-url.com/api/n8n/video-details`
   - Headers:
     - `x-n8n-api-key`: `{{ $env.N8N_API_KEY }}`
   - Query Parameters:
     - `video_id`: `{{ $json.posts[0].video_id }}`

5. **YouTube Node** - Upload Video
   - Operation: `Upload Video`
   - Credentials: Use OAuth2 (enter your YouTube OAuth credentials)
   - Video Title: `{{ $json.video.title }}`
   - Video Description: `{{ $json.video.description }}`
   - Video File: Download from `{{ $json.video.video_url }}`
   - Privacy: `Public` (or `Unlisted`)

6. **HTTP Request** - Update Status
   - Method: POST
   - URL: `https://your-app-url.com/api/webhooks/n8n/post-status`
   - Headers:
     - `x-n8n-api-key`: `{{ $env.N8N_API_KEY }}`
     - `Content-Type`: `application/json`
   - Body (JSON):
     ```json
     {
       "video_id": "{{ $('Get Video Details').item.json.video.id }}",
       "status": "posted",
       "platform_post_id": "{{ $json.id }}",
       "platform_url": "https://youtube.com/watch?v={{ $json.id }}"
     }
     ```

### Step 5: Test Your Workflow

1. **Save** your workflow
2. **Activate** it (toggle switch in top right)
3. **Upload a test video** in your app
4. **Click "Publish Video"**
5. **Wait 5 minutes** (or trigger workflow manually)
6. **Check YouTube** - video should appear!

## What This Workflow Does

```
Every 5 minutes:
  ↓
Get videos with status='scheduled' AND scheduled_at <= now
  ↓
For each video:
  ↓
  Get video details + YouTube tokens
  ↓
  Upload video to YouTube
  ↓
  Update video status to 'posted' in database
```

## Next Steps After This Works

1. **Add more platforms** - Instagram, TikTok workflows
2. **Schedule posts** - Videos can have future `scheduled_at` times
3. **Collect metrics** - Create workflow to fetch YouTube stats
4. **Handle errors** - Add error handling and retries

## Troubleshooting

### Workflow not running
- ✅ Check workflow is **Activated** (green toggle)
- ✅ Check cron schedule is correct
- ✅ Check n8n instance is running

### Videos not being picked up
- ✅ Check API key is correct in `.env.local`
- ✅ Check API endpoint URL is correct (your ngrok URL or production URL)
- ✅ Check video has `status: 'scheduled'` and `scheduled_at` in the past

### YouTube upload fails
- ✅ Check YouTube tokens are valid (not expired)
- ✅ Reconnect YouTube account if needed
- ✅ Check video file URL is accessible
- ✅ Check YouTube OAuth credentials in n8n YouTube node

### API authentication fails
- ✅ Check `N8N_API_KEY` matches what's in `.env.local`
- ✅ Check header name is exactly `x-n8n-api-key`
- ✅ Restart Next.js dev server after adding API key

## Helpful Resources

- **n8n Docs**: https://docs.n8n.io/
- **YouTube Node**: https://docs.n8n.io/integrations/builtin/app-nodes/n8n-nodes-base.youtube/
- **Workflow Examples**: See `N8N_INTEGRATION.md` and `N8N_WORKFLOW_SETUP.md`

## Need Help?

1. Check n8n execution logs (bottom panel in n8n UI)
2. Check Next.js server logs for API errors
3. Test API endpoints manually with curl or Postman
4. Check Supabase database to verify video status

---

**Ready?** Start with Step 1 and work your way through! 🎬






