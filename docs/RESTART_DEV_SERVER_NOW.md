# Restart Dev Server - Environment Variables Not Loading

Your `.env.local` already has `INSTAGRAM_APP_ID=836687999185692`, but the terminal logs show it's still using `META_APP_ID`.

**This means**: The dev server hasn't loaded the new environment variable yet.

## Solution: Restart Dev Server

Environment variables are **only loaded when the server starts**, not during runtime.

### Steps:

1. **Stop your dev server**: 
   - In the terminal where `npm run dev` is running
   - Press `Ctrl+C`
   - Wait for it to fully stop

2. **Wait 2 seconds**

3. **Start it again**:
   ```bash
   npm run dev
   ```

4. **Verify after restart**:
   - Click "Connect Instagram" again
   - Check terminal logs
   - You should now see:
     ```
     [Instagram OAuth] App ID being used: 836687...
     [Instagram OAuth] App ID source: INSTAGRAM_APP_ID  ← Should show this
     ```

## Why This Is Needed

Next.js loads `.env.local` when the server starts. If you:
- Add a new variable to `.env.local`
- Change an existing variable in `.env.local`

You **must restart the dev server** for the changes to take effect.

## Verify It's Working

After restart, when you click "Connect Instagram", terminal logs should show:

✅ **Correct**:
```
[Instagram OAuth] App ID being used: 836687...
[Instagram OAuth] App ID source: INSTAGRAM_APP_ID
```

❌ **Still wrong** (needs restart):
```
[Instagram OAuth] App ID being used: 771396...
[Instagram OAuth] App ID source: META_APP_ID
```

After restarting, try connecting Instagram again - it should now use the correct Instagram App ID! 🎉






