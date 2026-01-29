# Troubleshooting: n8n Webhook 404 Error

## Error Message
```
Failed to send file to n8n
Status: 404
Message: "This webhook is not registered... Did you mean to make a GET request?"
```

## What This Means

The n8n webhook is returning a 404 error, which means:
- The webhook URL is incorrect, OR
- The webhook is not active/enabled in n8n, OR
- The webhook is configured for GET instead of POST

## Step-by-Step Fix

### 1. Check Environment Variable

Verify `N8N_WEBHOOK_URL_DROPBOX_UPLOAD` is set in your `.env.local`:

```bash
# Check if it's set
cat .env.local | grep N8N_WEBHOOK_URL_DROPBOX_UPLOAD
```

If it's not set, add it:
```env
N8N_WEBHOOK_URL_DROPBOX_UPLOAD=https://your-n8n-instance.com/webhook/dropbox-upload
```

**Important:** 
- Use the exact webhook URL from n8n
- Make sure there are no trailing slashes
- The URL should look like: `https://your-n8n.com/webhook/abc123` or `https://your-n8n.com/webhook/dropbox-upload`

### 2. Verify Webhook in n8n

1. **Open your n8n workflow**
2. **Check the Webhook node:**
   - Is it **active** (green status)?
   - Is the workflow **activated** (toggle in top right)?
   - What is the **exact webhook URL** shown?

3. **Verify Webhook Settings:**
   - **HTTP Method**: Should be `POST` (not GET)
   - **Path**: Should match the path in your URL
   - **Response Mode**: Can be "Respond to Webhook" or "Last Node"

### 3. Test the Webhook Directly

Test if the webhook is accessible:

```bash
# Test with curl
curl -X POST https://your-n8n-instance.com/webhook/dropbox-upload \
  -H "Content-Type: application/json" \
  -d '{"test": "data"}'
```

If you get a 404, the webhook is not active or the URL is wrong.

### 4. Common Issues

#### Issue: Webhook URL Mismatch
**Symptom:** URL in `.env.local` doesn't match n8n webhook URL

**Fix:** 
- Copy the exact URL from n8n webhook node
- Paste it into `.env.local`
- Restart dev server

#### Issue: Webhook Not Active
**Symptom:** Webhook exists but returns 404

**Fix:**
- In n8n, make sure the workflow is **activated** (toggle switch in top right)
- The webhook node should show as **active/green**
- If using n8n cloud, check that your instance is running

#### Issue: Wrong HTTP Method
**Symptom:** Error says "Did you mean to make a GET request?"

**Fix:**
- In n8n webhook node, set **HTTP Method** to `POST`
- Save and reactivate the workflow

#### Issue: Webhook Path Changed
**Symptom:** Worked before but now returns 404

**Fix:**
- Check if the webhook path changed in n8n
- Update `.env.local` with the new path
- Restart dev server

### 5. Restart Dev Server

After making changes to `.env.local`:

```bash
# Stop the server (Ctrl+C)
# Then restart
npm run dev
```

### 6. Check Server Logs

Look at your Next.js server terminal for detailed error messages:

```
[upload] n8n webhook error: {
  status: 404,
  webhookUrl: 'https://...',
  ...
}
```

This will show you exactly what URL is being called.

## Quick Checklist

- [ ] `N8N_WEBHOOK_URL_DROPBOX_UPLOAD` is set in `.env.local`
- [ ] Webhook URL matches exactly what's shown in n8n
- [ ] n8n workflow is **activated** (green toggle)
- [ ] Webhook node is configured for **POST** method
- [ ] Dev server was restarted after adding env variable
- [ ] n8n instance is running and accessible

## Still Not Working?

1. **Check n8n execution logs:**
   - In n8n, go to "Executions"
   - See if the webhook is receiving requests
   - Check for any errors

2. **Test with a simple webhook:**
   - Create a new test webhook in n8n
   - Use that URL temporarily to verify the connection works
   - If test webhook works, the issue is with your Dropbox upload webhook

3. **Verify network access:**
   - Make sure your Next.js app can reach your n8n instance
   - Check firewall/network settings
   - If using n8n cloud, verify the URL is correct

4. **Check n8n version:**
   - Some older n8n versions have different webhook behavior
   - Update n8n if possible

## Example Working Configuration

**`.env.local`:**
```env
N8N_WEBHOOK_URL_DROPBOX_UPLOAD=https://support-team.app.n8n.cloud/webhook/dropbox-upload
```

**n8n Webhook Node:**
- HTTP Method: `POST`
- Path: `dropbox-upload`
- Response Mode: `Respond to Webhook`
- Status: **Active** (green)


