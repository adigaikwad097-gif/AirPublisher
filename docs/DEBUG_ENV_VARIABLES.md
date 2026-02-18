# Debug: Environment Variables Not Loading

## 🔍 Step-by-Step Debugging

### Step 1: Verify File Location

The `.env.local` file **MUST** be in the project root (same folder as `package.json`):

```
/Users/suniya/Desktop/airpublisher/.env.local  ✅ CORRECT
/Users/suniya/Desktop/airpublisher/app/.env.local  ❌ WRONG
/Users/suniya/Desktop/.env.local  ❌ WRONG
```

**Check this:**
1. Open terminal in your project folder
2. Run: `ls -la .env.local`
3. Should show the file exists

---

### Step 2: Check File Format

Open `.env.local` and verify the format is **exactly** like this:

```bash
META_APP_ID=771396602627794
META_APP_SECRET=67b086a74833746df6a0a7ed0b50f867
YOUTUBE_CLIENT_ID=367756454563-qr99o53cbgt8ospr56ahodvrc5hh3j9t.apps.googleusercontent.com
YOUTUBE_CLIENT_SECRET=YOUR_YOUTUBE_CLIENT_SECRET
```

**Common mistakes:**
- ❌ `META_APP_ID = 771396602627794` (spaces around `=`)
- ❌ `META_APP_ID="771396602627794"` (quotes)
- ❌ `META_APP_ID= 771396602627794` (space after `=`)
- ❌ `META_APP_ID =771396602627794` (space before `=`)
- ✅ `META_APP_ID=771396602627794` (correct - no spaces, no quotes)

---

### Step 3: Verify No Hidden Characters

1. Open `.env.local` in a **plain text editor** (not Word, not rich text)
2. Make sure there are no:
   - BOM (Byte Order Mark) at the start
   - Windows line endings (should be Unix `\n`, not `\r\n`)
   - Invisible characters

**Try this:**
1. Delete the lines with `META_APP_ID` and `META_APP_SECRET`
2. Type them again from scratch
3. Save the file

---

### Step 4: Restart Dev Server Properly

**IMPORTANT**: Environment variables are **ONLY** loaded when the server starts!

1. **Stop** the server:
   - Press `Ctrl+C` in the terminal
   - Wait for it to fully stop (you should see the prompt again)

2. **Kill any remaining processes** (if needed):
   ```bash
   lsof -ti:3000 | xargs kill -9
   ```

3. **Start fresh**:
   ```bash
   npm run dev
   ```

4. **Wait** for it to fully start (you should see "Ready" message)

---

### Step 5: Test Immediately After Restart

1. **Don't wait** - test right after restart
2. Visit: `http://localhost:3000/api/debug/env`
3. Check if `hasMETA_APP_ID` is `true`

---

### Step 6: Check Terminal Output

When you start `npm run dev`, look for:
- Any errors about `.env.local`
- Any warnings about environment variables
- The server should start without errors

---

### Step 7: Try Alternative Variable Name

If `META_APP_ID` still doesn't work, try using `INSTAGRAM_APP_ID` instead:

```bash
INSTAGRAM_APP_ID=771396602627794
INSTAGRAM_APP_SECRET=67b086a74833746df6a0a7ed0b50f867
```

The code checks for both, so this should work.

---

### Step 8: Verify with Terminal Command

Run this in your terminal (in the project folder):

```bash
node -e "require('dotenv').config({ path: '.env.local' }); console.log('META_APP_ID:', process.env.META_APP_ID || 'NOT FOUND')"
```

If it shows `NOT FOUND`, the file isn't being read correctly.

---

### Step 9: Check for Multiple .env Files

Make sure you don't have conflicting files:
- `.env` (might override `.env.local`)
- `.env.development` (might override `.env.local`)

Next.js priority:
1. `.env.local` (highest priority)
2. `.env.development`
3. `.env`

---

### Step 10: Nuclear Option - Recreate File

If nothing works:

1. **Rename** `.env.local` to `.env.local.backup`
2. **Create new** `.env.local` file
3. **Copy** all your variables (including Supabase ones)
4. **Add** the META variables:
   ```bash
   META_APP_ID=771396602627794
   META_APP_SECRET=67b086a74833746df6a0a7ed0b50f867
   ```
5. **Save** and restart server

---

## 🧪 Quick Test Script

Create a file `test-env.js` in your project root:

```javascript
require('dotenv').config({ path: '.env.local' })
console.log('META_APP_ID:', process.env.META_APP_ID || 'NOT FOUND')
console.log('META_APP_SECRET:', process.env.META_APP_SECRET ? 'SET (hidden)' : 'NOT FOUND')
```

Run: `node test-env.js`

If it shows `NOT FOUND`, the file isn't being read.

---

## ✅ Success Checklist

- [ ] `.env.local` is in project root (same folder as `package.json`)
- [ ] Variables have no spaces around `=`
- [ ] Variables have no quotes
- [ ] File saved properly
- [ ] Dev server was **fully stopped** and **restarted**
- [ ] Tested immediately after restart
- [ ] `/api/debug/env` shows `hasMETA_APP_ID: true`

---

## 🆘 Still Not Working?

If you've tried everything:

1. **Share** the output of `/api/debug/env`
2. **Share** terminal output when starting `npm run dev`
3. **Verify** you're testing on `localhost:3000` (not a different port)
4. **Check** if other env vars work (like `NEXT_PUBLIC_SUPABASE_URL`)

The most common issue is **not restarting the server** after adding variables!

