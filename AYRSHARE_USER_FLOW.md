# Ayrshare User Flow - Correct Implementation

## Understanding the Flow

### What We Need:
1. **User signs in** to AIR Publisher (Supabase Auth) ✅ Already done
2. **Create Ayrshare Profile** for each user (via Ayrshare Business API)
3. **User connects social accounts** through Ayrshare OAuth (using their profileId)
4. **Store profileId/profileKey** in our database (linked to creator_unique_identifier)
5. **Post on their behalf** using their profileId/profileKey

---

## Ayrshare Business Plan Required

For this flow, you need **Ayrshare Business Plan** which supports:
- Multiple user profiles
- User-specific OAuth flows
- Profile Keys for each user

**Current Setup:** You have 20 API calls (likely free tier)
**Needed:** Business Plan for multi-user support

---

## Database Schema

We need to store Ayrshare profile info per user:

```sql
-- Add to your database
CREATE TABLE IF NOT EXISTS ayrshare_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL, -- Links to Supabase auth.users
  creator_unique_identifier TEXT NOT NULL, -- Links to creator_profiles
  ayrshare_profile_id TEXT NOT NULL, -- Ayrshare profile ID
  ayrshare_profile_key TEXT, -- Profile key (if Business Plan)
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id),
  UNIQUE(creator_unique_identifier)
);
```

---

## Implementation Flow

### Step 1: User Signs In
- ✅ Already working (Supabase Auth)
- User gets `user_id` and `creator_unique_identifier`

### Step 2: Create Ayrshare Profile (On First Login)
```typescript
// When user first logs in or visits settings
POST https://api.ayrshare.com/api/profiles
Headers:
  Authorization: Bearer YOUR_API_KEY (your master API key)
Body:
  {
    "profileName": "User's Name",
    "email": "user@example.com"
  }
  
Response:
  {
    "profileId": "profile_123",
    "profileKey": "AX1XGG-9jK3M5LS-GR5RX5G-LLCK8EA"
  }
```

### Step 3: Store Profile Info
```typescript
// Store in ayrshare_profiles table
{
  user_id: user.id,
  creator_unique_identifier: creator.unique_identifier,
  ayrshare_profile_id: "profile_123",
  ayrshare_profile_key: "AX1XGG-..."
}
```

### Step 4: User Connects Social Accounts
```typescript
// User clicks "Connect YouTube" in settings
// Redirect to Ayrshare OAuth with their profileId
https://app.ayrshare.com/oauth/authorize?
  client_id=YOUR_CLIENT_ID&
  profile_id=profile_123&
  redirect_uri=...
```

### Step 5: Post on User's Behalf
```typescript
// When posting, use user's profileKey
POST https://api.ayrshare.com/api/post
Headers:
  Authorization: Bearer YOUR_API_KEY
  Profile-Key: user_profile_key  // User's specific profile key
Body:
  {
    "post": "Content",
    "platforms": ["youtube", "instagram", "tiktok"]
  }
```

---

## What Needs to Change

### Current Implementation (Wrong):
- ❌ Using one API key for everyone
- ❌ No user-specific profiles
- ❌ Can't track which user posted what

### Correct Implementation (Needed):
- ✅ Create Ayrshare profile per user
- ✅ Store profileId/profileKey per user
- ✅ Use user's profileKey when posting
- ✅ Track posts per user

---

## Ayrshare Business Plan

**You'll need to:**
1. Upgrade to Ayrshare Business Plan
2. Get Business API credentials
3. Enable user profile creation

**Check:** https://www.ayrshare.com/pricing

---

## Next Steps

1. **Upgrade Ayrshare** to Business Plan (if not already)
2. **Create database table** for ayrshare_profiles
3. **Implement profile creation** on user signup/login
4. **Implement OAuth flow** for connecting accounts
5. **Update posting logic** to use user's profileKey

Let me know if you have Business Plan access, and I'll implement the full flow!



