# Environment Variables to Add to `.env.local`

## 📝 Copy and Paste These Lines

Add these to the end of your `.env.local` file:

```bash
# Instagram OAuth (Meta/Facebook)
META_APP_ID=771396602627794
META_APP_SECRET=67b086a74833746df6a0a7ed0b50f867

# YouTube OAuth (Google)
YOUTUBE_CLIENT_ID=367756454563-qr99o53cbgt8ospr56ahodvrc5hh3j9t.apps.googleusercontent.com
YOUTUBE_CLIENT_SECRET=YOUR_YOUTUBE_CLIENT_SECRET

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## ✅ Complete `.env.local` Template

If you want to see all variables at once, here's the complete template:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://pezvnqhexxttlhcnbtta.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBlenZucWhleHh0dGxoY25idHRhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg3ODQwNjYsImV4cCI6MjA3NDM2MDY2fQ.b5cWpEYD6s5gRYg5jcBNyjE-kL_IGAVqtMfXk8wB6zU
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBlenZucWhleHh0dGxoY25idHRhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODc4NDA2NiwiZXhwIjoyMDc0MzYwMDY2fQ.bjyw77LQTMZ0eWAIqBIa6cbUpFEnlYOzlK4rhiQmRpU

# Instagram OAuth (Meta/Facebook)
META_APP_ID=771396602627794
META_APP_SECRET=67b086a74833746df6a0a7ed0b50f867

# YouTube OAuth (Google)
YOUTUBE_CLIENT_ID=367756454563-qr99o53cbgt8ospr56ahodvrc5hh3j9t.apps.googleusercontent.com
YOUTUBE_CLIENT_SECRET=YOUR_YOUTUBE_CLIENT_SECRET

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## 🚀 Steps

1. **Open** `.env.local` in your editor
2. **Add** the variables above (or copy the complete template)
3. **Save** the file
4. **Restart** your dev server:
   ```bash
   # Stop server (Ctrl+C)
   npm run dev
   ```

---

## ✅ Verify

After restarting, check:
```
http://localhost:3000/api/debug/env
```

You should see:
- `hasMETA_APP_ID: true`
- `hasYOUTUBE_CLIENT_ID: true`
- `hasYOUTUBE_CLIENT_SECRET: true`

---

## 📋 Quick Reference

**Instagram:**
- App ID: `771396602627794`
- App Secret: `67b086a74833746df6a0a7ed0b50f867`

**YouTube:**
- Client ID: `367756454563-qr99o53cbgt8ospr56ahodvrc5hh3j9t.apps.googleusercontent.com`
- Client Secret: `YOUR_YOUTUBE_CLIENT_SECRET`

