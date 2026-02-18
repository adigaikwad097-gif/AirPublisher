# Ayrshare Setup Guide

## Quick Start

### 1. Create Ayrshare Account

1. Go to https://www.ayrshare.com
2. Sign up for a free account
3. Verify your email

### 2. Get API Key ✅

**Your API Key:**
```
7CC0FF99-1BD04EF6-96400107-C8D60455
```

**Add to `.env.local`:**
```bash
AYRSHARE_API_KEY=7CC0FF99-1BD04EF6-96400107-C8D60455
```

**⚠️ API Call Limit:** You have 20 API calls on the free tier. Each post counts as 1 call, regardless of how many platforms you post to.

### 3. Connect Social Accounts

**Option A: Via Dashboard (Recommended)**
1. Go to Ayrshare Dashboard
2. Click **"Connect Social Accounts"** or **"Profiles"**
3. Connect your:
   - YouTube channel
   - Instagram account
   - TikTok account
   - Any other platforms you want

**Option B: Via API (Advanced)**
- Users can connect accounts programmatically
- See Ayrshare Business Plan documentation

### 4. Test Connection

Once API key is set, the connections page will show:
- ✅ Connected accounts count
- ✅ Platform breakdown (YouTube, Instagram, TikTok)
- ✅ Link to manage accounts

---

## How It Works

### User Flow:

1. **Admin/You:** Add `AYRSHARE_API_KEY` to environment variables
2. **Users:** Go to `/settings/connections`
3. **Users:** Click "Connect Accounts via Ayrshare"
4. **Users:** Redirected to Ayrshare dashboard
5. **Users:** Connect their social accounts
6. **Done!** Users can now post via Ayrshare API

### Posting Flow:

1. User schedules a video in your app
2. Your app calls Ayrshare API: `POST /api/ayrshare/post`
3. Ayrshare posts to connected platforms
4. Ayrshare returns post IDs and status
5. Your app stores the Ayrshare post ID

---

## API Endpoints Created

### `POST /api/ayrshare/post`
Post content to connected platforms

**Request:**
```json
{
  "title": "Video Title",
  "description": "Video description",
  "video_url": "https://...",
  "thumbnail_url": "https://...",
  "platforms": ["youtube", "instagram", "tiktok"],
  "scheduled_at": "2026-01-20T12:00:00Z" // Optional
}
```

**Response:**
```json
{
  "success": true,
  "post": {
    "id": "ayrshare_post_id",
    "postIds": {
      "youtube": "youtube_post_id",
      "instagram": "instagram_post_id",
      "tiktok": "tiktok_post_id"
    },
    "status": "success"
  }
}
```

### `GET /api/ayrshare/profiles`
Get connected social media profiles

**Response:**
```json
{
  "success": true,
  "profiles": [
    {
      "id": "profile_id",
      "socialNetwork": "youtube",
      "socialUsername": "channel_name",
      "isConnected": true
    }
  ]
}
```

### `GET /api/ayrshare/analytics/[postId]`
Get analytics for a post

---

## Environment Variables

Add to `.env.local`:
```bash
AYRSHARE_API_KEY=your-ayrshare-api-key
```

Add to Render (production):
```bash
AYRSHARE_API_KEY=your-ayrshare-api-key
```

---

## Benefits Over Individual OAuth

### Before (Individual OAuth):
- ❌ 3 separate OAuth flows (YouTube, Instagram, TikTok)
- ❌ 3 separate token storage tables
- ❌ 3 separate API integrations
- ❌ Token refresh logic for each platform
- ❌ Complex error handling

### After (Ayrshare):
- ✅ 1 API key
- ✅ 1 simple API call
- ✅ Ayrshare handles all OAuth
- ✅ Ayrshare handles token refresh
- ✅ Ayrshare handles platform changes
- ✅ Supports 13 platforms, not just 3

---

## Next Steps

1. ✅ Get Ayrshare API key
2. ✅ Add to environment variables
3. ✅ Connect social accounts in Ayrshare dashboard
4. ✅ Test posting via API
5. ✅ Update video posting logic to use Ayrshare

---

## Pricing

- **Free Tier:** Limited posts per month
- **Paid Plans:** Start at ~$15/month for more posts
- **Check:** https://www.ayrshare.com/pricing

---

## Documentation

- **API Docs:** https://www.ayrshare.com/docs/apis/overview
- **Dashboard:** https://www.ayrshare.com/dashboard
- **Support:** Check Ayrshare help center

---

## Migration from Individual OAuth

If you want to remove the old OAuth code:

1. **Keep for now** (in case you need it)
2. **Or remove:**
   - `app/api/auth/youtube/`
   - `app/api/auth/instagram/`
   - `app/api/auth/tiktok/`
   - Token tables (or keep for reference)

The new Ayrshare integration is in:
- `lib/ayrshare/api.ts`
- `app/api/ayrshare/`
- `app/(dashboard)/settings/connections-ayrshare/page.tsx`

