# YouTube Token Expiration Explained

## The Issue

You're seeing tokens expire in 1 hour, but YouTube refresh tokens should last **7 days** (in Testing mode) or **indefinitely** (in Production, until revoked).

## Why This Happens

The confusion is between **Access Tokens** and **Refresh Tokens**:

### Access Token (expires in ~1 hour)
- **Lifespan**: 1 hour (3600 seconds)
- **Used for**: Making API requests to YouTube
- **Expires**: Yes, after 1 hour
- **What `expires_at` tracks**: This is the access token expiration

### Refresh Token (doesn't expire, or lasts 7 days)
- **Lifespan**: 
  - **Testing mode**: 7 days
  - **Production mode**: Never expires (until revoked)
- **Used for**: Getting new access tokens when they expire
- **Expires**: Only in testing mode (7 days), or if revoked
- **What we store**: `google_refresh_token` in the database

## What's Happening in Your Code

Looking at `app/api/auth/youtube/callback/route.ts`:

```typescript
// Line 119-125: Get tokens from YouTube
const tokens = await tokenResponse.json()
const {
  access_token,      // ← Expires in 1 hour
  refresh_token,     // ← Lasts 7 days (testing) or forever (production)
  expires_in,        // ← This is 3600 seconds (1 hour) for access_token
  scope,
} = tokens

// Line 154-156: Calculate expiration time
const expiresAt = expires_in
  ? new Date(Date.now() + expires_in * 1000).toISOString()
  : null
  // ↑ This sets expires_at to ~1 hour from now (access token expiration)

// Line 203/213: Store refresh token (correct)
google_refresh_token: refresh_token || null,
```

**The `expires_at` field stores access token expiration (1 hour), not refresh token expiration.**

## The Solution: Token Refresh Logic

You need to **automatically refresh access tokens** when they expire, using the refresh token.

### When Access Token Expires (< 1 hour):

1. Check if `expires_at` is in the past (or within 5 minutes)
2. Use `google_refresh_token` to get a new access token
3. Update `expires_at` to the new expiration time
4. Use the new access token for API calls

### Refresh Token Flow:

```
Access Token (expires in 1 hour)
    ↓ (expires)
Use Refresh Token → Get New Access Token (another hour)
    ↓ (expires)
Use Refresh Token → Get New Access Token (another hour)
    ... (repeat until refresh token expires/revoked)
```

## Check Your Google Cloud App Mode

**Testing Mode** (refresh tokens expire in 7 days):
- Go to Google Cloud Console → APIs & Services → OAuth consent screen
- If "Testing" mode, refresh tokens expire in 7 days
- To fix: Publish your app or add test users

**Production Mode** (refresh tokens never expire):
- App is published
- Refresh tokens last until revoked
- More reliable for long-term use

## What You Should Do

### Option 1: Add Token Refresh Logic (Recommended)

Before making YouTube API calls, check if the access token is expired and refresh it if needed.

### Option 2: Verify App Mode

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Your project → **APIs & Services** → **OAuth consent screen**
3. Check **Publishing status**:
   - **Testing**: Refresh tokens expire in 7 days
   - **In production**: Refresh tokens never expire (until revoked)

### Option 3: Check What's Actually Expiring

1. Check your database `airpublisher_youtube_tokens` table
2. Look at `expires_at` field:
   - This is **access token expiration** (1 hour)
   - Not refresh token expiration
3. Look at `google_refresh_token`:
   - If this is `null`, that's the real problem
   - If it exists, the refresh token is fine (access token just needs refreshing)

## Summary

- **1 hour expiration = Access token** (normal, expected)
- **7 days expiration = Refresh token** (in testing mode)
- **`expires_at` = Access token expiration** (not refresh token)
- **You need token refresh logic** to automatically get new access tokens when they expire

The refresh token should still be valid for 7 days (testing) or forever (production), even if `expires_at` shows 1 hour - because `expires_at` only tracks the **access token**, not the refresh token.






