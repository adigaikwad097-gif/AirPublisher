# How to Restart Your Dev Server

## Quick Steps

1. **Go to the terminal** where `npm run dev` is running
2. **Press** `Ctrl+C` to stop the server
3. **Wait** for it to fully stop (you'll see your prompt again)
4. **Run** `npm run dev` again
5. **Wait** for "Ready" message

---

## After Restart

1. **Test immediately**: Visit `http://localhost:3000/api/debug/env`
2. **Check** if `hasMETA_APP_ID: true`
3. **Try connecting**: Go to `http://localhost:3000/settings/connections`

---

## If Port is Still in Use

If you get "port 3000 already in use" error:

```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Then start again
npm run dev
```

---

## Verify Environment Variables Loaded

After restart, the debug endpoint should show:
- ✅ `hasMETA_APP_ID: true`
- ✅ `hasYOUTUBE_CLIENT_ID: true`

If they're still `false`, check:
- `.env.local` file format (no spaces, no quotes)
- File is in project root
- Variables are spelled correctly






