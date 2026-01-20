# Ayrshare API Usage Tips - 20 Call Limit

## ⚠️ Important: You Have 20 API Calls

**Current Limit:** 20 API calls per month (Free tier)

### What Counts as 1 API Call:
- ✅ **1 post to multiple platforms = 1 API call**
  - Example: Post to YouTube + Instagram + TikTok = **1 call** (not 3!)
- ✅ Getting profiles = 1 call
- ✅ Getting analytics = 1 call
- ✅ Deleting a post = 1 call

### What Doesn't Count:
- ❌ Getting profiles (cached, doesn't count against limit)
- ❌ Reading data (some endpoints are free)

---

## Optimization Strategies

### 1. Batch Posts to Multiple Platforms
**Instead of:**
```javascript
// ❌ BAD: 3 API calls
postToYouTube(video)
postToInstagram(video)
postToTikTok(video)
```

**Do this:**
```javascript
// ✅ GOOD: 1 API call for all platforms
await createPost({
  post: "Video title",
  platforms: ["youtube", "instagram", "tiktok"], // All in one call!
  mediaUrls: [video_url]
})
```

### 2. Cache Profile Data
- Don't fetch profiles on every request
- Cache profile list for 1 hour
- Only refresh when needed

### 3. Use Scheduled Posts Wisely
- Schedule multiple posts at once
- Each scheduled post = 1 call (when it posts, not when scheduled)

### 4. Monitor Usage
- Track API calls in your app
- Log each call
- Warn users when approaching limit

---

## Usage Tracking

Add this to track your API calls:

```typescript
// lib/ayrshare/usage.ts
let apiCallCount = 0
const MAX_CALLS = 20

export function trackApiCall() {
  apiCallCount++
  if (apiCallCount >= MAX_CALLS) {
    console.warn('⚠️ Ayrshare API call limit reached!')
  }
  return apiCallCount
}

export function getRemainingCalls() {
  return MAX_CALLS - apiCallCount
}
```

---

## When You Hit the Limit

### Options:

1. **Wait for Reset**
   - Free tier resets monthly
   - Check Ayrshare dashboard for reset date

2. **Upgrade Plan**
   - Paid plans have more calls
   - Check: https://www.ayrshare.com/pricing

3. **Use Individual OAuth** (Fallback)
   - Your existing YouTube/Instagram/TikTok OAuth code
   - Use when Ayrshare limit is reached

---

## Best Practices

### ✅ DO:
- Post to multiple platforms in one call
- Cache profile data
- Schedule posts efficiently
- Monitor usage

### ❌ DON'T:
- Make separate calls for each platform
- Fetch profiles repeatedly
- Test with real posts (use Ayrshare test mode)
- Waste calls on failed posts

---

## Testing Strategy

### For Development:
1. **Use Ayrshare Test Mode** (if available)
2. **Test with 1-2 posts only**
3. **Use individual OAuth for testing** (doesn't count against Ayrshare limit)
4. **Save Ayrshare calls for production**

### For Production:
1. **Batch all posts** (YouTube + Instagram + TikTok in one call)
2. **Monitor usage** closely
3. **Have fallback** to individual OAuth if needed

---

## Current Setup

- **API Key:** `7CC0FF99-1BD04EF6-96400107-C8D60455`
- **Limit:** 20 calls/month
- **Usage:** Track carefully!
- **Fallback:** Individual OAuth code still available

---

## Next Steps

1. ✅ API Key configured
2. ⏳ Connect social accounts in Ayrshare dashboard
3. ⏳ Test with 1-2 posts (save the rest!)
4. ⏳ Monitor usage
5. ⏳ Consider upgrade if needed


