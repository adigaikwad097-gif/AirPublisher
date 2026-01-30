# Fix Instagram ID Mismatch

## The Problem

Your token debug shows:
- **Correct Instagram ID:** `27085892291011294`
- **Your request uses:** `27085892291011296`

The mismatch is causing the 401 error!

## Solution: Use Correct Instagram ID

### Update Your n8n Workflow

**In "Instagram Create Media" node:**

**URL:**
```
https://graph.facebook.com/v18.0/27085892291011294/media
```

**OR if using expression:**
```
https://graph.facebook.com/v18.0/{{ $json.instagram_id }}/media
```

**Make sure `$json.instagram_id` is `27085892291011294`, not `27085892291011296`**

## Verify Instagram ID in Database

**Check your database:**
```sql
SELECT instagram_id, username 
FROM airpublisher_instagram_tokens 
WHERE creator_unique_identifier = 'creator_735175e5_1768726539_f7262d3a';
```

**Expected:**
- `instagram_id`: `27085892291011294`
- `username`: `alyanfreebiehaul`

## Update Database if Wrong

**If the database has the wrong ID, update it:**

```sql
UPDATE airpublisher_instagram_tokens 
SET instagram_id = '27085892291011294',
    username = 'alyanfreebiehaul'
WHERE creator_unique_identifier = 'creator_735175e5_1768726539_f7262d3a';
```

## Test with Correct ID

**HTTP Request Node:**
- **Method:** GET
- **URL:** `https://graph.facebook.com/v18.0/27085892291011294?fields=id,username&access_token={{ $json.facebook_access_token }}`

**Expected Response:**
```json
{
  "id": "27085892291011294",
  "username": "alyanfreebiehaul"
}
```

## Complete Corrected Configuration

**Instagram Create Media Node:**

**URL:**
```
https://graph.facebook.com/v18.0/27085892291011294/media
```

**OR dynamically:**
```
https://graph.facebook.com/v18.0/{{ $json.instagram_id }}/media
```
(Ensure `$json.instagram_id` = `27085892291011294`)

**Authorization:**
```
Bearer {{ $json.facebook_access_token }}
```

**JSON Body:**
```json
{
  "media_type": "REELS",
  "video_url": "https://www.dropbox.com/scl/fi/acmwke0nleouhv6l6p584/cdfeb218-8228-48a7-93e4-2fb84cf49a5a.mp4?rlkey=rr3kq55xgci93ganx51w16f4f&dl=1",
  "caption": "health check",
  "thumb_offset": 0
}
```

## Why This Happened

The Instagram ID in your database (`27085892291011296`) doesn't match the Instagram ID associated with your access token (`27085892291011294`). 

This can happen if:
1. The token was generated for a different Instagram account
2. The database was updated with wrong ID
3. Multiple Instagram accounts were connected

## Quick Fix

**Option 1: Hardcode the correct ID (for testing)**
```
https://graph.facebook.com/v18.0/27085892291011294/media
```

**Option 2: Fix the database and use dynamic ID**
1. Update database with correct ID
2. Use `{{ $json.instagram_id }}` in URL

## Verify Everything Works

**Test the complete flow:**

1. **Test Token:**
   ```
   GET https://graph.facebook.com/v18.0/me?access_token=YOUR_TOKEN
   ```
   ✅ Should return your Facebook user info

2. **Test Instagram Account:**
   ```
   GET https://graph.facebook.com/v18.0/27085892291011294?fields=id,username&access_token=YOUR_TOKEN
   ```
   ✅ Should return: `{"id": "27085892291011294", "username": "alyanfreebiehaul"}`

3. **Create Media Container:**
   ```
   POST https://graph.facebook.com/v18.0/27085892291011294/media
   Authorization: Bearer YOUR_TOKEN
   ```
   ✅ Should return: `{"id": "container_id"}`

## Summary

**The issue:** Wrong Instagram ID (`27085892291011296` vs `27085892291011294`)

**The fix:** Use the correct Instagram ID from your token debug: `27085892291011294`

**Your token is valid and has all required permissions!** Just need to use the correct Instagram ID.

