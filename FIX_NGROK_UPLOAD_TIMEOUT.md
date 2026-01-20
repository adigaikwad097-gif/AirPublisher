# Fix: ngrok Upload Timeout - Request Hanging

## Problem

The upload request reaches ngrok but hangs - no status code, no response. The Next.js server never receives it.

**ngrok logs show:**
```
POST /api/videos/8efe45da-a370-42c0-9d95-8281e1fffa60/upload
```
(No status code = request hanging)

**Next.js logs:** No `[upload]` logs = request never reaches server

## Root Cause

ngrok has **timeout limits** for requests:
- **Free tier**: 60 seconds timeout
- Large file uploads can exceed this
- ngrok may be blocking/terminating the request

## Solutions

### Solution 1: Increase ngrok Timeout (Recommended)

If using ngrok CLI, restart with longer timeout:

```bash
ngrok http 3000 --request-header-add "ngrok-skip-browser-warning: true" --region us
```

For ngrok cloud, check your plan limits.

### Solution 2: Stream Upload Instead of Buffering

Modify the upload endpoint to stream the file instead of loading it all into memory:

```typescript
// Instead of: await request.formData() (loads entire file)
// Use streaming approach
```

### Solution 3: Upload Directly to n8n (Bypass Next.js)

Have the browser upload directly to n8n webhook instead of going through Next.js:

1. Get n8n webhook URL in frontend
2. Upload file directly from browser to n8n
3. n8n processes and calls back to Next.js

### Solution 4: Use Chunked Upload

Break large files into chunks and upload in pieces.

## Quick Fix: Test with Small File

1. Try uploading a **very small file** (< 1MB)
2. If small files work, it's definitely a timeout issue
3. If small files also fail, it's a different problem

## Check ngrok Dashboard

1. Go to ngrok dashboard: https://dashboard.ngrok.com
2. Check **Inspector** tab
3. Look for the `/api/videos/.../upload` request
4. See if it shows timeout errors or other issues

## Alternative: Use Different Tunnel

If ngrok keeps timing out:
- Use **Cloudflare Tunnel** (cloudflared) - no timeout limits
- Use **localtunnel** - alternative to ngrok
- Use **serveo** - SSH-based tunnel

## Immediate Workaround

For now, you can test by:
1. Uploading a very small test file (< 1MB)
2. If that works, the issue is file size + ngrok timeout
3. Then implement one of the solutions above

