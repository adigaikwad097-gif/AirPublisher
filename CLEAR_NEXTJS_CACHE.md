# Clear Next.js Cache - Environment Variables Not Loading

Your `.env.local` has `INSTAGRAM_APP_ID=836687999185692`, but it's still not loading.

This is likely a **Next.js cache issue**. Let's clear it:

## Steps

1. **Stop your dev server**: `Ctrl+C`

2. **Clear Next.js cache**:
   ```bash
   rm -rf .next
   ```

3. **Restart dev server**:
   ```bash
   npm run dev
   ```

4. **Try connecting Instagram again**

The `.next` directory caches compiled code and might have cached the old environment variables. Clearing it forces Next.js to rebuild everything fresh.

## After Clearing Cache

When you click "Connect Instagram", check terminal logs. You should now see:

```
[Instagram OAuth] Environment variables check: {
  INSTAGRAM_APP_ID: 'SET (836687...)',  ← Should show this now
  ...
}
[Instagram OAuth] App ID source: INSTAGRAM_APP_ID  ← Should show this
```

If it still shows `META_APP_ID`, then there's a formatting issue in `.env.local` that we need to fix.



