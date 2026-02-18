# Test OAuth Connections

## ✅ Step 1: Restart Dev Server

**IMPORTANT**: If you haven't restarted yet, do it now:

1. **Stop** your dev server (Ctrl+C in terminal)
2. **Start** it again:
   ```bash
   npm run dev
   ```

---

## ✅ Step 2: Verify Environment Variables

Visit this URL to check if variables are loaded:
```
http://localhost:3000/api/debug/env
```

You should see:
- ✅ `hasMETA_APP_ID: true`
- ✅ `hasYOUTUBE_CLIENT_ID: true`
- ✅ `hasYOUTUBE_CLIENT_SECRET: true`

If any show `false`, the variables aren't loaded. Make sure you:
- Saved `.env.local`
- Restarted the dev server

---

## ✅ Step 3: Test Instagram Connection

1. **Go to**: `http://localhost:3000/settings/connections`
2. **Click**: "Connect Instagram"
3. **Should redirect** to Facebook OAuth page (not show an error)
4. **Authorize** your Instagram account
5. **Should redirect back** and show "Connected" badge

---

## ✅ Step 4: Test YouTube Connection

1. **Go to**: `http://localhost:3000/settings/connections`
2. **Click**: "Connect YouTube"
3. **Should redirect** to Google OAuth page (not show an error)
4. **Authorize** your YouTube channel
5. **Should redirect back** and show "Connected" badge

---

## 🐛 Troubleshooting

### Still getting "OAuth not configured" error?

1. **Check terminal logs** - Look for:
   ```
   [Instagram OAuth] Environment check: { hasMETA_APP_ID: true, ... }
   ```

2. **Verify file location** - `.env.local` must be in project root:
   ```
   /Users/suniya/Desktop/airpublisher/.env.local
   ```

3. **Check for typos** - Variable names must be exact:
   - ✅ `META_APP_ID` (correct)
   - ❌ `METAAPP_ID` (wrong)
   - ❌ `META_APP_ID ` (space at end - wrong)

4. **Restart again** - Sometimes you need to restart twice

### Redirect URI errors?

Make sure you've added the redirect URIs to:
- **Meta App**: `http://localhost:3000/api/auth/instagram/callback`
- **Google Cloud Console**: `http://localhost:3000/api/auth/youtube/callback`

---

## 🎉 Success!

Once both are connected, you'll see:
- ✅ Green "Connected" badges on both platforms
- ✅ Channel/account info displayed
- ✅ Tokens stored in Supabase (`youtube_tokens` and `instagram_tokens` tables)

---

## 📝 Next Steps

After connecting:
1. Tokens are stored in Supabase
2. You can use these tokens to post content via n8n workflows
3. Tokens will be used automatically when scheduling posts

Ready to test! 🚀






