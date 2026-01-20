# Fix Next.js 404 Errors After Clearing Cache

The 404 errors you're seeing are because I cleared the `.next` directory. Next.js needs to rebuild.

## Solution: Restart Dev Server

The dev server needs to rebuild all the static files. Restart it:

1. **Stop your dev server**: `Ctrl+C` in the terminal where `npm run dev` is running

2. **Start it again**:
   ```bash
   npm run dev
   ```

3. **Wait for it to finish building** - You should see:
   ```
   ✓ Compiled in Xms
   ○ Compiling / ...
   ```

4. **Once it says "Ready"**, try accessing your ngrok URL again

## What's Happening

The 404 errors are for:
- `/_next/static/chunks/main-app.js` - Not built yet
- `/_next/static/chunks/app/page.js` - Not built yet  
- `/_next/static/chunks/app-pages-internals.js` - Not built yet
- `/_next/static/css/app/layout.css` - Not built yet

These files are generated during the Next.js build process. After restarting, they'll be created and the 404s will stop.

## Ngrok is Working Fine

Your ngrok forwarding is correct:
```
https://untasting-overhugely-kortney.ngrok-free.dev -> http://localhost:3000
```

The issue is just that Next.js hasn't finished rebuilding after I cleared the cache.

## After Restart

Once the dev server finishes rebuilding:
- ✅ All 404 errors should stop
- ✅ Your ngrok URL should work properly
- ✅ Instagram OAuth should work (using hardcoded App ID `836687999185692`)

Restart your dev server and wait for it to finish building!


