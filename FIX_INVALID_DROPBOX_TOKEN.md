# Fix Invalid Dropbox Access Token

## Error
```
Dropbox upload failed: invalid_access_token/...
```

## What This Means

The `DROPBOX_ACCESS_TOKEN` in your `.env.local` is either:
1. **Expired** - Dropbox tokens can expire
2. **Invalid** - Token was revoked or incorrect
3. **Wrong format** - Token might be truncated or have extra characters

## Solution: Get a New Dropbox Access Token

### Option 1: Generate Token via Dropbox App Console (Recommended)

1. **Go to Dropbox App Console:**
   - Visit: https://www.dropbox.com/developers/apps
   - Sign in with your Dropbox account

2. **Select Your App:**
   - Find your app (or create a new one if needed)
   - App Key: `ws1niyc5nkru706`

3. **Generate Access Token:**
   - Go to the app settings
   - Look for "OAuth 2" or "Access tokens" section
   - Click "Generate" to create a new access token
   - **Copy the token immediately** (you won't see it again)

4. **Update `.env.local`:**
   ```env
   DROPBOX_ACCESS_TOKEN=your_new_token_here
   ```

5. **Restart Dev Server:**
   ```bash
   # Stop server (Ctrl+C)
   npm run dev
   ```

### Option 2: Use Dropbox OAuth Flow (For Production)

For production, you should use OAuth to get tokens per user. But for development/testing, a direct access token works.

### Option 3: Use Dropbox API Explorer

1. Go to: https://www.dropbox.com/developers/documentation/http/documentation
2. Use the API Explorer to test your token
3. If it fails, generate a new one

## Verify Token is Valid

After updating the token, check terminal logs when uploading:

**✅ Good:**
```
[getDropboxAccessToken] ✅ Using DROPBOX_ACCESS_TOKEN from env (length: 1234)
[createDropboxClient] ✅ Dropbox client created successfully
[uploadToDropbox] ✅ File uploaded successfully
```

**❌ Bad:**
```
[upload] Dropbox upload error: invalid_access_token
```

## Token Format

A valid Dropbox access token:
- Starts with `sl.` (for short-lived) or `sl.u.` (for user tokens)
- Is very long (1000+ characters)
- Contains letters, numbers, and special characters
- No spaces or line breaks

## Common Issues

### Token Expired
- Dropbox tokens can expire
- Generate a new one from the App Console

### Token Revoked
- If you revoked the token in Dropbox settings
- Generate a new one

### Wrong Token Type
- Make sure you're using an **Access Token**, not:
  - App Key
  - App Secret
  - Refresh Token
  - Authorization Code

### Token Truncated
- Make sure the entire token is on one line in `.env.local`
- No line breaks or wrapping
- Copy the entire token from Dropbox

## Next Steps

1. **Get a new token** from Dropbox App Console
2. **Update `.env.local`** with the new token
3. **Restart dev server**
4. **Try uploading again**

The token should work now!


