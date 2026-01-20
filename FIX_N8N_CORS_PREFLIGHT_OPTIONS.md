# Fix: n8n CORS Preflight (OPTIONS) Not Working

## Problem

The browser sends an OPTIONS request (CORS preflight) before the actual POST, but n8n isn't responding with the correct CORS headers:
```
No 'Access-Control-Allow-Origin' header is present on the requested resource
```

## Solution Options

### Option 1: Add OPTIONS Handler in n8n (Recommended)

n8n webhook needs to explicitly handle OPTIONS requests. Some versions don't do this automatically.

1. **Add an IF node** after the Webhook node:
   - Condition: `{{ $json.headers['access-control-request-method'] }}` exists
   - OR check if method is OPTIONS

2. **If OPTIONS request**, use a "Respond to Webhook" node with:
   - Status Code: `200`
   - Headers:
     ```
     Access-Control-Allow-Origin: https://untasting-overhugely-kortney.ngrok-free.dev
     Access-Control-Allow-Methods: POST, OPTIONS
     Access-Control-Allow-Headers: Content-Type
     Access-Control-Max-Age: 86400
     ```

3. **If POST request**, continue with normal workflow

### Option 2: Check n8n Webhook CORS Settings

1. Open Webhook node
2. Go to **Options** → **CORS**
3. Make sure:
   - ✅ CORS is enabled
   - ✅ Allowed Origins includes: `https://untasting-overhugely-kortney.ngrok-free.dev`
   - ✅ Or use `*` for all origins (testing only)

4. **Some n8n versions** need you to also set:
   - **Response Headers** in the webhook node
   - Add: `Access-Control-Allow-Origin: *` or your specific domain

### Option 3: Use n8n Cloudflare/Proxy Settings

If using n8n cloud, check if there are proxy/CORS settings at the account level that need to be configured.

### Option 4: Workaround - Proxy Through Next.js

If CORS can't be fixed in n8n, we can proxy through Next.js (but may timeout with ngrok for large files).

## Quick Test

After fixing, test the OPTIONS request again:

```javascript
fetch('https://support-team.app.n8n.cloud/webhook/uploaddropbox', {
  method: 'OPTIONS',
  headers: {
    'Origin': 'https://untasting-overhugely-kortney.ngrok-free.dev',
    'Access-Control-Request-Method': 'POST',
  }
})
  .then(r => {
    console.log('✅ OPTIONS status:', r.status)
    console.log('✅ CORS header:', r.headers.get('Access-Control-Allow-Origin'))
  })
```

If you see the CORS header, it's fixed!

## Most Likely Fix

Check the n8n Webhook node → Options → CORS and make sure:
1. CORS is **enabled**
2. Your domain is in **Allowed Origins**
3. The webhook is set to handle **OPTIONS** requests (some versions need this explicitly)

If that doesn't work, you may need to add an IF node to explicitly handle OPTIONS requests and return the CORS headers.

