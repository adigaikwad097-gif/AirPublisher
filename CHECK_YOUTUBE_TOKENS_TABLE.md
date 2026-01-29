# Check YouTube Tokens Table Schema

## Issue
YouTube OAuth returns `insert_failed` when trying to store tokens.

## Debug Steps

### Step 1: Check Terminal Logs
When you try to connect YouTube, check your terminal for:
```
[youtube-callback] Error inserting YouTube tokens: {...}
```

This will show:
- Error code
- Error message
- Details/hint about what column is wrong

### Step 2: Check Supabase Table Schema
1. Go to Supabase Dashboard → Table Editor
2. Open `youtube_tokens` table
3. Check what columns it has

**Common column names might be:**
- `user_id` (UUID or TEXT)
- `creator_unique_identifier` (TEXT) - might not exist
- `access_token` vs `google_access_token`
- `refresh_token` vs `google_refresh_token`
- `token_type` vs `token_type`
- `expires_at` (TIMESTAMPTZ)
- `scope` (TEXT)
- `handle` (TEXT) - YouTube channel name
- `channel_id` (TEXT) - YouTube channel ID
- `created_at` / `updated_at` (TIMESTAMPTZ)

### Step 3: Share the Error Details
Check the URL when redirected to settings:
- It will have `?error=insert_failed&details=...`
- The `details` parameter will show the actual error message

Or check terminal logs for the full error object.

## Most Likely Issues

1. **Column name mismatch**: We're using `google_access_token` but table might expect `access_token`
2. **Missing column**: `creator_unique_identifier` might not exist in `youtube_tokens` table
3. **Required column missing**: Some column might be NOT NULL and we're passing null

## Quick Fix

Once you share the error details or table schema, I can fix the column names in the insert query.



