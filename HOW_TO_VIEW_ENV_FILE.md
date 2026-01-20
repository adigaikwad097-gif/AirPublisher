# How to View .env.local File

## The File Location

The `.env.local` file is located in the **root directory** of your project:
```
/Users/suniya/Desktop/airpublisher/.env.local
```

## Why You Can't See It

Files starting with a dot (`.`) are **hidden files** in macOS/Linux. Most file explorers hide them by default.

## How to View It

### Option 1: In VS Code / Cursor

1. Press `Cmd + Shift + P` (Command Palette)
2. Type: "Files: Toggle Excluded Files"
3. Or in the file explorer, click the "..." menu → "Show Excluded Files"

### Option 2: In Finder (macOS)

1. Open Finder
2. Press `Cmd + Shift + .` (period) to show hidden files
3. Navigate to `/Users/suniya/Desktop/airpublisher/`
4. You'll see `.env.local`

### Option 3: In Terminal

```bash
cd /Users/suniya/Desktop/airpublisher
cat .env.local
```

Or open in your editor:
```bash
open -a "Cursor" .env.local
# or
code .env.local
```

### Option 4: Direct Path in Cursor

1. Press `Cmd + P` (Quick Open)
2. Type: `.env.local`
3. It should appear and you can open it

## File Contents

The file should contain your environment variables like:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `N8N_WEBHOOK_URL_DROPBOX_UPLOAD`
- `N8N_API_KEY`
- etc.

## If File Doesn't Exist

If you can't find it, you can create it:

1. In terminal: `touch .env.local`
2. Or in Cursor: Create new file named `.env.local`
3. Add your environment variables

## For Vercel

Remember: `.env.local` is **NOT** committed to git (it's in `.gitignore`)

You'll need to manually add these variables in Vercel Dashboard → Settings → Environment Variables

