# Environment Variables Setup

## ⚠️ Add These to Your `.env.local` File

Open `.env.local` in your project root and add/update these variables:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://pezvnqhexxttlhcnbtta.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBlenZucWhleHh0dGxoY25idHRhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg3ODQwNjYsImV4cCI6MjA3NDM2MDY2fQ.b5cWpEYD6s5gRYg5jcBNyjE-kL_IGAVqtMfXk8wB6zU
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBlenZucWhleHh0dGxoY25idHRhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODc4NDA2NiwiZXhwIjoyMDc0MzYwMDY2fQ.bjyw77LQTMZ0eWAIqBIa6cbUpFEnlYOzlK4rhiQmRpU

# YouTube OAuth (Google)
YOUTUBE_CLIENT_ID=367756454563-qr99o53cbgt8ospr56ahodvrc5hh3j9t.apps.googleusercontent.com
YOUTUBE_CLIENT_SECRET=YOUR_YOUTUBE_CLIENT_SECRET

# Instagram OAuth (Meta/Facebook) - Using Original App
META_APP_ID=771396602627794
META_APP_SECRET=67b086a74833746df6a0a7ed0b50f867

# Alternative Instagram App (newer app - commented out)
# META_APP_ID=836687999185692
# META_APP_SECRET=4691b6a3b97ab0dcaec41b218e4321c1

# TikTok OAuth (if you have credentials)
# TIKTOK_CLIENT_KEY=your_tiktok_client_key
# TIKTOK_CLIENT_SECRET=your_tiktok_client_secret

# App URL (use ngrok URL for Instagram OAuth)
NEXT_PUBLIC_APP_URL=https://untasting-overhugely-kortney.ngrok-free.dev

# n8n Integration
N8N_API_KEY=your_n8n_api_key
N8N_WEBHOOK_URL_DROPBOX_UPLOAD=https://your-n8n-instance.com/webhook/dropbox-upload
```

---

## 🚀 Quick Steps

1. **Open** `.env.local` in your project root
2. **Add** the variables above (especially `META_APP_ID` and `META_APP_SECRET`)
3. **Save** the file
4. **Restart** your dev server:
   ```bash
   # Stop the server (Ctrl+C)
   npm run dev
   ```

---

## ✅ Verify It Works

After adding the variables and restarting:

1. Go to: `http://localhost:3000/settings/connections`
2. Click: "Connect Instagram"
3. Should redirect to Facebook OAuth (not show error)

---

## 🔍 Check Current Variables

To see what's currently in your `.env.local`:

```bash
cat .env.local | grep -E "(META|INSTAGRAM|YOUTUBE)"
```

---

## 📝 Notes

- **META_APP_ID**: Current app ID `771396602627794`
- **META_APP_SECRET**: `67b086a74833746df6a0a7ed0b50f867`
- The code checks for `META_APP_ID` first, then falls back to `INSTAGRAM_APP_ID`
- Make sure there are **no spaces** around the `=` sign
- Don't use quotes around the values (unless they contain spaces)

---

## 🐛 Still Not Working?

1. **Check for typos** in variable names
2. **Restart dev server** after adding variables
3. **Check terminal** for any error messages
4. **Verify** the file is named exactly `.env.local` (not `.env` or `.env.local.txt`)

