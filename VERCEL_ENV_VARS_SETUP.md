# Vercel Environment Variables Setup

## Required Environment Variables for Instant Posting

To enable instant posting when users click "Post Now", you need to set the following environment variable in Vercel:

### `N8N_WEBHOOK_URL_POST_VIDEO`

**Value:** `https://support-team.app.n8n.cloud/webhook/15ec8f2d-a77c-4407-8ab8-cd505284bb42`

**How to Set:**
1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Click **Add New**
4. Name: `N8N_WEBHOOK_URL_POST_VIDEO`
5. Value: `https://support-team.app.n8n.cloud/webhook/15ec8f2d-a77c-4407-8ab8-cd505284bb42`
6. Select environments: **Production**, **Preview**, **Development** (or as needed)
7. Click **Save**
8. **Redeploy** your application for the changes to take effect

### Optional: `N8N_API_KEY`

If your n8n webhook requires authentication, also set:

**Name:** `N8N_API_KEY`  
**Value:** Your n8n API key (if required)

## What Happens Without This Variable?

If `N8N_WEBHOOK_URL_POST_VIDEO` is not set:
- "Post Now" will still work, but it will create a scheduled post with immediate time
- n8n cron job will pick it up and post it (may take a few minutes)
- You won't see instant posting - there will be a delay

## Verify It's Working

After setting the variable and redeploying:
1. Click "Post Now" on a video
2. Check Vercel logs - you should see: `[publish] Calling n8n webhook: ...`
3. Check n8n executions - you should see a new execution triggered immediately
4. The video should be posted within seconds, not minutes

## Troubleshooting

If webhook is still not being called:
1. ✅ Verify `N8N_WEBHOOK_URL_POST_VIDEO` is set in Vercel
2. ✅ Verify you've redeployed after setting the variable
3. ✅ Check Vercel logs for `[publish]` messages
4. ✅ Verify the webhook URL is correct and active in n8n
5. ✅ Check n8n webhook node is set to "POST" method
6. ✅ Verify n8n workflow is active (green status)

