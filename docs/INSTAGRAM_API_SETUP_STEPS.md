# Instagram API Setup - Next Steps

## ✅ You're on the Right Page!

This is the **Instagram Graph API** setup page. You're in the right place!

## Your Credentials

- **Instagram App ID:** `1405584781151443`
- **Instagram App Secret:** `c82997f0ad2941b13cec68e4812d7b29`

---

## Step 1: Add Credentials to .env.local

Add these to your `.env.local` file:

```bash
INSTAGRAM_APP_ID=1405584781151443
INSTAGRAM_APP_SECRET=c82997f0ad2941b13cec68e4812d7b29
```

**Important:** Restart your Next.js server after adding these!

---

## Step 2: Configure Callback URL (OPTIONAL - Can Skip!)

**⚠️ IMPORTANT: You can skip this step for development!**

The webhook configuration is **optional** and only needed if you want to receive real-time notifications. For OAuth and posting content, you don't need it.

### If You Want to Skip (Recommended):
- **Just scroll past Step 2** and go to Step 1: "Add account"
- OAuth will work fine without webhook setup
- See `INSTAGRAM_CALLBACK_URL_FIX.md` for details

### If You Want to Set It Up:
**Note:** Meta can't validate `localhost` URLs. You'll need a public URL or skip this step.

**Option A: Use ngrok (for testing)**
1. Install ngrok: `npm install -g ngrok` or download from ngrok.com
2. Run: `ngrok http 3000`
3. Copy the HTTPS URL (e.g., `https://abc123.ngrok.io`)
4. Set Callback URL: `https://abc123.ngrok.io/api/auth/instagram/callback`
5. Set Verify Token: any string (e.g., `my_token_123`)
6. Click "Verify and save"

**Option B: Use Production URL**
- If you have a deployed app, use: `https://yourdomain.com/api/auth/instagram/callback`

**Option C: Skip It**
- Just proceed to Step 1 - webhooks aren't required for OAuth!

---

## Step 3: Add Instagram Account (Generate Access Tokens)

1. Scroll to **"1. Generate access tokens"** section
2. Click the **"Add account"** button
3. You'll be asked to:
   - Log in with your Instagram account
   - Grant permissions to your app
   - This will generate an access token

**Important Notes:**
- Your Instagram account must be a **Business** or **Creator** account (not personal)
- The account must be linked to a Facebook Page
- You may need to add yourself as a "Tester" in the Roles tab first

---

## Step 4: Set Up Instagram Business Login (Optional for Dev)

1. Scroll to **"3. Set up Instagram business login"** section
2. Click **"Set up"** button
3. This creates a login flow for other users to connect their accounts
4. **For development/testing:** You can skip this for now
5. **For production:** You'll need this so users can connect their accounts

---

## Step 5: App Review (Skip for Now)

1. **"4. Complete app review"** section
2. **Skip this for development**
3. App review is only needed when:
   - You want to go "Live" (public access)
   - Other users will use your app
   - You need advanced permissions

**For testing:** Your app works in "Development Mode" without review.

---

## Quick Setup Checklist

- [ ] Added App ID and Secret to `.env.local`
- [ ] Set Callback URL to `http://localhost:3000/api/auth/instagram/callback`
- [ ] Clicked "Add account" to generate access token
- [ ] Tested OAuth flow at `/settings/connections`

---

## Testing the OAuth Flow

Once you've completed the above:

1. Make sure your Next.js app is running: `npm run dev`
2. Go to: `http://localhost:3000/settings/connections`
3. Click **"Connect Instagram"**
4. You should be redirected to Instagram/Facebook to authorize
5. After authorization, you'll be redirected back
6. Your tokens will be stored in the `instagram_tokens` table

---

## Troubleshooting

**"Callback URL mismatch"**
- Make sure the URL in Meta matches exactly what's in your code
- Check for `http` vs `https`
- Check for trailing slashes
- Should be: `http://localhost:3000/api/auth/instagram/callback`

**"Cannot add account"**
- Make sure your Instagram account is Business or Creator type
- Link your Instagram to a Facebook Page first
- Add yourself as a Tester in Roles tab

**"App not showing in OAuth"**
- Make sure app is in Development Mode (fine for testing)
- Check that Instagram Graph API product is added
- Verify App ID and Secret are correct in `.env.local`

---

## What's Next?

After completing these steps:

1. ✅ Instagram OAuth will work
2. ✅ Users can connect their Instagram accounts
3. ✅ n8n can use tokens to post videos
4. ✅ You can test the full flow

Then move on to:
- Setting up TikTok OAuth (similar process)
- Creating n8n workflows
- Testing video posting

---

## Important Notes

**Development vs Production:**
- **Development Mode:** Works for testing with your own accounts
- **Live Mode:** Requires app review, needed for public use

**Instagram Account Requirements:**
- Must be Business or Creator account
- Must be linked to a Facebook Page
- Personal accounts won't work

**Token Expiration:**
- Short-lived tokens expire quickly
- Long-lived tokens last 60 days
- You'll need to refresh tokens periodically (we can set this up later)

