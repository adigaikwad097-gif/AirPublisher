# Fix: Environment Variables Not Loading

## 🔍 Step 1: Check Current Environment Variables

Visit this URL in your browser (only works in development):
```
http://localhost:3000/api/debug/env
```

This will show you which environment variables are loaded.

---

## ✅ Step 2: Verify `.env.local` File

1. **Check file exists**: Make sure `.env.local` is in the **root** of your project (same folder as `package.json`)

2. **Check file format**: Should look like this (no quotes, no spaces around `=`):
   ```bash
   META_APP_ID=771396602627794
   META_APP_SECRET=67b086a74833746df6a0a7ed0b50f867
   ```

3. **Common mistakes**:
   - ❌ `META_APP_ID = 771396602627794` (spaces around `=`)
   - ❌ `META_APP_ID="771396602627794"` (quotes not needed)
   - ❌ `META_APP_ID= 771396602627794` (space after `=`)
   - ✅ `META_APP_ID=771396602627794` (correct)

---

## 🔄 Step 3: Restart Dev Server

**IMPORTANT**: Environment variables are only loaded when the server starts!

1. **Stop** your dev server (press `Ctrl+C` in terminal)
2. **Start** it again:
   ```bash
   npm run dev
   ```

---

## 📝 Step 4: Complete `.env.local` Template

Copy this entire block into your `.env.local` file:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://pezvnqhexxttlhcnbtta.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBlenZucWhleHh0dGxoY25idHRhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg3ODQwNjYsImV4cCI6MjA3NDM2MDY2fQ.b5cWpEYD6s5gRYg5jcBNyjE-kL_IGAVqtMfXk8wB6zU
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBlenZucWhleHh0dGxoY25idHRhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODc4NDA2NiwiZXhwIjoyMDc0MzYwMDY2fQ.bjyw77LQTMZ0eWAIqBIa6cbUpFEnlYOzlK4rhiQmRpU

# YouTube OAuth
YOUTUBE_CLIENT_ID=367756454563-qr99o53cbgt8ospr56ahodvrc5hh3j9t.apps.googleusercontent.com
YOUTUBE_CLIENT_SECRET=YOUR_YOUTUBE_CLIENT_SECRET

# Instagram OAuth (Meta)
META_APP_ID=771396602627794
META_APP_SECRET=67b086a74833746df6a0a7ed0b50f867

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## 🧪 Step 5: Test Again

1. **Restart** your dev server
2. **Check debug endpoint**: `http://localhost:3000/api/debug/env`
3. **Try Instagram OAuth**: `http://localhost:3000/settings/connections` → Click "Connect Instagram"

---

## 🐛 Still Not Working?

### Check Terminal Logs

When you click "Connect Instagram", check your terminal for:
```
[Instagram OAuth] Environment check: { ... }
```

This will show if the variables are loaded.

### Verify File Location

Make sure `.env.local` is in:
```
/Users/suniya/Desktop/airpublisher/.env.local
```

NOT in:
- `app/.env.local` ❌
- `.env` ❌
- `.env.local.txt` ❌

### Check for Typos

Common typos:
- `META_APP_ID` (correct) vs `METAAPP_ID` (wrong)
- `META_APP_SECRET` (correct) vs `META_APP_SECRETS` (wrong)

### Try Alternative Variable Name

If `META_APP_ID` doesn't work, try:
```bash
INSTAGRAM_APP_ID=771396602627794
INSTAGRAM_APP_SECRET=67b086a74833746df6a0a7ed0b50f867
```

The code checks for both!

---

## ✅ Success Indicators

When it works, you should see:
1. Debug endpoint shows `hasMETA_APP_ID: true`
2. Clicking "Connect Instagram" redirects to Facebook OAuth (not an error)
3. Terminal logs show `[Instagram OAuth] Environment check: { hasMETA_APP_ID: true, ... }`

---

## 📞 Quick Checklist

- [ ] `.env.local` file exists in project root
- [ ] `META_APP_ID=771396602627794` (no spaces, no quotes)
- [ ] `META_APP_SECRET=67b086a74833746df6a0a7ed0b50f867` (no spaces, no quotes)
- [ ] Dev server was **restarted** after adding variables
- [ ] Checked `/api/debug/env` endpoint
- [ ] Checked terminal logs for environment check

---

If you've done all of this and it still doesn't work, share:
1. Output from `/api/debug/env`
2. Terminal logs when clicking "Connect Instagram"
3. First few lines of your `.env.local` (hide the secret values)

