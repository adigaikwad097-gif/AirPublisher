# Update ngrok URL Configuration

Your ngrok URL: **https://untasting-overhugely-kortney.ngrok-free.dev**

## Step 1: Update `.env.local`

Add or update this line in your `.env.local` file:

```bash
NEXT_PUBLIC_APP_URL=https://untasting-overhugely-kortney.ngrok-free.dev
```

## Step 2: Restart Dev Server

Stop your Next.js dev server (Ctrl+C) and restart:

```bash
npm run dev
```

## Step 3: Register Redirect URI in Meta App

1. Go to: https://developers.facebook.com/apps/
2. Select your app (App ID: **1405584781151443**)
3. Go to **Settings → Basic**
4. Scroll down to **Valid OAuth Redirect URIs**
5. Add this URL (click **Add URI**):
   ```
   https://untasting-overhugely-kortney.ngrok-free.dev/api/auth/instagram/callback
   ```
6. Click **Save Changes**

## Step 4: Test Instagram Connection

1. Go to: `https://untasting-overhugely-kortney.ngrok-free.dev/settings/connections`
2. Click **Connect Instagram**
3. You should be redirected to Instagram/Facebook login

---

## ⚠️ Important Notes

- **Keep ngrok running**: Don't close the terminal where `ngrok http 3000` is running
- **URL changes**: Free ngrok URLs change when you restart ngrok. You'll need to update `.env.local` and Meta App redirect URI each time
- **Wait 1-2 minutes**: After updating Meta App settings, wait a minute for changes to propagate



