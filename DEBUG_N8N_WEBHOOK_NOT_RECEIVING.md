# Debug: n8n Webhook Not Receiving Payload

## What to Check

### 1. Check Server Logs

When you upload a file, look for these log lines in your Next.js server terminal:

```
[upload] ===== SENDING TO N8N =====
[upload] Webhook URL: https://...
[upload] Starting fetch request to n8n...
```

**If you DON'T see these lines:**
- The upload endpoint isn't being called
- Check if the file upload is actually reaching the server

**If you see "Starting fetch" but no response:**
- The fetch is hanging/timing out
- Network issue or n8n is down

**If you see fetch errors:**
- Check the error message for details

### 2. Verify Environment Variable

Check if the webhook URL is actually set:

```bash
# In your terminal (where Next.js is running)
echo $N8N_WEBHOOK_URL_DROPBOX_UPLOAD
```

Or check `.env.local`:
```bash
cat .env.local | grep N8N_WEBHOOK_URL_DROPBOX_UPLOAD
```

**Important:** After changing `.env.local`, you MUST restart the dev server.

### 3. Test the Webhook Directly

Test if n8n webhook is accessible:

```bash
curl -X POST https://your-n8n-webhook-url \
  -F "file=@test.txt" \
  -F "video_id=test-123" \
  -F "test=data"
```

If this doesn't work, the webhook isn't active or the URL is wrong.

### 4. Check n8n Execution Logs

In n8n:
1. Go to **Executions**
2. Check if there are any recent executions
3. If no executions, the webhook isn't receiving requests
4. If executions exist but show errors, check the error details

### 5. Common Issues with ngrok

**Issue: ngrok URL changed**
- ngrok free URLs change on restart
- Update `NEXT_PUBLIC_APP_URL` and `N8N_WEBHOOK_URL_DROPBOX_UPLOAD` if ngrok restarted

**Issue: ngrok blocking requests**
- Check ngrok web interface for blocked requests
- Some ngrok plans have request limits

**Issue: CORS/Network**
- ngrok might be blocking outbound requests
- Check ngrok logs/dashboard

### 6. Test with Simple Request

Create a test script to verify the webhook works:

```javascript
// test-webhook.js
const formData = new FormData()
formData.append('test', 'data')
formData.append('video_id', 'test-123')

fetch('YOUR_N8N_WEBHOOK_URL', {
  method: 'POST',
  body: formData,
})
  .then(r => r.text())
  .then(console.log)
  .catch(console.error)
```

Run this to see if the webhook receives anything.

### 7. Check Network Tab

In browser DevTools:
1. Go to **Network** tab
2. Upload a file
3. Look for the request to `/api/videos/[id]/upload`
4. Check:
   - Status code
   - Response body
   - Request payload
   - Any errors

### 8. Verify Webhook is Active

In n8n:
- ✅ Workflow is **Activated** (toggle in top right)
- ✅ Webhook node shows **Active** status
- ✅ Using **Production URL** (not Test URL)
- ✅ HTTP Method is **POST**

## Quick Diagnostic Steps

1. **Check logs** - Do you see `[upload] ===== SENDING TO N8N =====`?
2. **Check n8n executions** - Are there any executions?
3. **Test webhook directly** - Does curl work?
4. **Check environment variable** - Is it set correctly?
5. **Restart dev server** - After changing env vars

## What the Logs Will Tell You

The new logging will show:
- ✅ If the request is being sent
- ✅ What URL is being used
- ✅ How long the request takes
- ✅ What response (if any) is received
- ✅ Any errors that occur

Check your server terminal after uploading to see these logs.

