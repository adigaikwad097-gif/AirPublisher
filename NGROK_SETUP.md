# ngrok Setup for Instagram OAuth

Instagram OAuth requires HTTPS redirect URLs (except `localhost`). Use ngrok during development to expose your local server with a public HTTPS URL.

## Quick Setup

### 1. Install ngrok

**macOS (Homebrew):**
```bash
brew install ngrok
```

**Or download from:**
https://ngrok.com/download

### 2. Get your ngrok auth token

1. Sign up at https://dashboard.ngrok.com/signup (free account works)
2. Go to https://dashboard.ngrok.com/get-started/your-authtoken
3. Copy your authtoken

### 3. Configure ngrok

```bash
ngrok config add-authtoken YOUR_AUTHTOKEN_HERE
```

### 4. Start ngrok tunnel

In a **separate terminal**, run:

```bash
ngrok http 3000
```

This will output something like:
```
Forwarding  https://abc123.ngrok-free.app -> http://localhost:3000
```

**Copy the HTTPS URL** (e.g., `https://abc123.ngrok-free.app`)

### 5. Update environment variables

Add to your `.env.local`:

```bash
# Use ngrok URL for development
NEXT_PUBLIC_APP_URL=https://abc123.ngrok-free.app
```

**⚠️ Important:** Update this every time you restart ngrok (URL changes for free tier).

### 6. Register redirect URI in Meta App

1. Go to [Meta for Developers](https://developers.facebook.com/apps/)
2. Select your Instagram/Facebook app
3. Go to **Settings → Basic**
4. Under **Valid OAuth Redirect URIs**, add:
   ```
   https://abc123.ngrok-free.app/api/auth/instagram/callback
   ```
   (Replace `abc123.ngrok-free.app` with your actual ngrok URL)

5. Save changes

### 7. Restart your Next.js dev server

```bash
npm run dev
```

## Testing Instagram OAuth

1. Make sure ngrok is running: `ngrok http 3000`
2. Make sure `.env.local` has your ngrok URL: `NEXT_PUBLIC_APP_URL=https://your-ngrok-url.ngrok-free.app`
3. Go to Settings → Connections → Connect Instagram
4. You should be redirected to Instagram login, then back to your app

## Pro Tips

### Keep ngrok URL consistent (paid plan)

If you upgrade to ngrok's paid plan, you can get a static domain:
```bash
ngrok http 3000 --domain=your-static-domain.ngrok.app
```

Then update `.env.local` once and keep using it.

### Auto-update redirect URI (script)

Create `scripts/update-ngrok-redirect.sh`:

```bash
#!/bin/bash
NGROK_URL=$(curl -s http://localhost:4040/api/tunnels | jq -r '.tunnels[0].public_url')
if [ "$NGROK_URL" != "null" ] && [ -n "$NGROK_URL" ]; then
  echo "Current ngrok URL: $NGROK_URL"
  echo "Add this to Meta App Redirect URIs:"
  echo "$NGROK_URL/api/auth/instagram/callback"
else
  echo "ngrok is not running. Start it with: ngrok http 3000"
fi
```

### Check current ngrok URL

If ngrok web interface is running (usually at http://localhost:4040):

```bash
curl http://localhost:4040/api/tunnels | jq -r '.tunnels[0].public_url'
```

## Troubleshooting

### "Invalid redirect URI" error

1. **Check exact match:** The redirect URI in Meta App must match exactly (including `https://` and `/api/auth/instagram/callback`)
2. **Wait a few seconds:** Meta sometimes takes 1-2 minutes to update redirect URIs
3. **Clear browser cache:** Try incognito mode

### ngrok URL changes on restart

Free ngrok gives you a new URL each time. Solutions:
- Use ngrok paid plan for static domain
- Or manually update `.env.local` and Meta App redirect URI each time

### "ngrok: command not found"

Make sure ngrok is installed:
```bash
which ngrok
# If not found, install with: brew install ngrok
```



