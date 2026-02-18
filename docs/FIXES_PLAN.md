# AIR Publisher Fixes - Implementation Plan

## Priority 1: Auth & Profile Persistence (CRITICAL - BLOCKING)
- ✅ Fix auth sign-in to work reliably
- ✅ Fix profile persistence - profile should be remembered after sign-in
- ✅ Ensure cookie-based profile lookup works correctly

## Priority 2: Unique Identifier Pattern (Aditya's Schema)
- Update OAuth flows to use prefix pattern:
  - YouTube: `yt_` + `channel_id`
  - Facebook: `fb_` + `page_id`  
  - Instagram Graph: `igg_` + `instagram_business_id`
  - Instagram Basic: `igb_` + `instagram_user_id`
  - TikTok: `tt_` + `open_id`

## Priority 3: Dropbox Integration
- Replace Supabase Storage with Dropbox for video uploads
- Store Dropbox URLs in `air_publisher_videos.video_url`
- Update discover page to load videos from Dropbox URLs

## Priority 4: OAuth Fixes
- Fix Instagram OAuth (currently redirecting to Facebook)
- Fix Facebook OAuth
- Implement TikTok OAuth

## Priority 5: Discover Page & Scheduling
- Make discover page functional with video feed
- Ensure post scheduling works for n8n automations






