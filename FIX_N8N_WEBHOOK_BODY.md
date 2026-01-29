# Fix: n8n Webhook Body is Empty

If your n8n webhook is receiving an empty body `{}`, here's how to fix it:

## Issue

The webhook payload from Next.js isn't being received in n8n's body. This is usually a configuration issue in n8n.

## Solution: Configure n8n Webhook Node

### Step 1: Check Webhook Node Settings

In your n8n webhook node:

1. **Response Mode:** Should be set to **"Using 'Respond to Webhook' Node"** or **"Last Node"**
   - This allows the webhook to receive the full request body

2. **HTTP Method:** Should be **POST**

3. **Path:** Your webhook path (already set)

### Step 2: Add "Respond to Webhook" Node (Recommended)

After your webhook trigger, add a **"Respond to Webhook"** node:

1. Add **"Respond to Webhook"** node
2. Connect it right after the Webhook node
3. Configure:
   - **Response Code:** 200
   - **Response Body:** `{{ $json }}` (to see what was received)

This ensures n8n properly receives the POST body.

### Step 3: Verify Body is Received

In your n8n workflow, add a **"Set"** node or **"Code"** node right after the webhook to inspect:

```javascript
// In n8n Code node
return {
  received_body: $input.item.json.body,
  received_all: $input.item.json,
  video_id: $input.item.json.body?.video_id,
};
```

Or use **"Set"** node to extract:
- **Name:** `video_id`
- **Value:** `{{ $json.body.video_id }}`

---

## Alternative: Use Query Parameters (If Body Doesn't Work)

If the body still doesn't work, we can modify the trigger to use query parameters instead:

The webhook URL would be:
```
https://support-team.app.n8n.cloud/webhook/c5c7dd87-7d9a-4e3f-83c4-5420dd2bbd4f?video_id={{video_id}}&platform={{platform}}
```

But let's try fixing the body first.

---

## Debug Steps

1. **Check n8n Webhook Node:**
   - Make sure it's set to receive POST requests
   - Check "Response Mode" setting

2. **Add Debug Node:**
   - Add a **"Set"** or **"Code"** node after webhook
   - Log `$input.item.json` to see what's received

3. **Check Next.js Logs:**
   - When you click "Publish Now", check terminal logs
   - Should see: `[trigger-post-video] Calling n8n webhook: ...`

4. **Test Webhook Directly:**
   - Use curl or Postman to test:
     ```bash
     curl -X POST https://support-team.app.n8n.cloud/webhook/c5c7dd87-7d9a-4e3f-83c4-5420dd2bbd4f \
       -H "Content-Type: application/json" \
       -d '{"video_id":"test","platform":"tiktok","trigger_type":"immediate"}'
     ```

---

## Expected Payload Structure

Your webhook should receive:

```json
{
  "body": {
    "video_id": "uuid",
    "creator_unique_identifier": "creator-id",
    "platform": "tiktok",
    "trigger_type": "immediate"
  }
}
```

Then access it in n8n as: `{{ $json.body.video_id }}`

---

## Quick Fix: Update n8n Workflow

1. **After Webhook Node**, add **"Set"** node:
   - Extract `video_id` from `{{ $json.body.video_id }}`
   - Extract `platform` from `{{ $json.body.platform }}`
   - Extract `creator_unique_identifier` from `{{ $json.body.creator_unique_identifier }}`

2. **Then continue** with "Get Video Details" node using the extracted `video_id`

---

Try adding the "Respond to Webhook" node first - that usually fixes the empty body issue!



