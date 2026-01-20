# New Profile Creation Flow

## Current Flow (Old)
1. User signs up
2. User manually creates profile (name, niche, avatar)
3. User connects platforms (YouTube, Instagram, etc.)

## New Flow (Proposed)
1. User signs up
2. User connects at least one platform (YouTube, Instagram, TikTok, Facebook)
3. Profile is **auto-created** from platform data:
   - `creator_unique_identifier` = platform prefix + platform ID (e.g., `yt_UCCGry4...`)
   - `handles` = platform username/display name
   - `profile_pic_url` = platform profile picture
   - Niche can be set later or inferred

## Benefits
- ✅ No manual profile creation step
- ✅ Unique identifier comes from platform (matches Aditya's schema)
- ✅ Profile data is accurate (from platform APIs)
- ✅ Users can connect multiple platforms, profile updates with each connection

## Implementation Plan

### Step 1: Update OAuth Callbacks
When user connects a platform:
- Extract platform ID (channel_id, page_id, instagram_business_id, etc.)
- Generate `creator_unique_identifier` with prefix (yt_, fb_, igg_, igb_, tt_)
- Create/update `airpublisher_creator_profiles` with platform data
- Store tokens in platform-specific token tables

### Step 2: Remove Manual Profile Creation
- Remove `/setup` page or make it optional
- Remove profile creation form
- Auto-create profile on first platform connection

### Step 3: Handle Multiple Platforms
- If user connects multiple platforms, use the first one as primary
- Or allow user to choose primary platform
- Update profile when connecting additional platforms

## Migration Strategy
1. Keep existing profiles (they already have creator_unique_identifier)
2. For new users: require platform connection before accessing dashboard
3. Show "Connect Platform" page instead of "Create Profile" page


