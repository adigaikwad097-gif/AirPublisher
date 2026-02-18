# Fix: TikTok "unaudited_client_can_only_post_to_private_accounts" Error

## Problem

TikTok API returns error:
```
"unaudited_client_can_only_post_to_private_accounts"
```

This means your TikTok app is **not audited** by TikTok, so it can only post to private accounts, not public ones.

## Solution

Change the `privacy_level` from `"PUBLIC_TO_EVERYONE"` to one of these private options:

### Available Privacy Levels for Unaudited Apps:

1. **`"SELF_ONLY"`** - Only you can see the video (recommended for testing)
2. **`"FRIENDS_ONLY"`** - Only your friends can see the video
3. **`"PRIVATE"`** - Private (similar to SELF_ONLY)

### Available Privacy Levels for Audited Apps:

- `"PUBLIC_TO_EVERYONE"` - Public (requires app audit)

## Updated Code

The code in `N8N_CODE_NODE_FIXED_CODE.js` has been updated to use:

```javascript
privacy_level: "SELF_ONLY"
```

## To Post Public Videos

To post public videos, you need to:

1. **Submit your TikTok app for review** at [TikTok Developer Portal](https://developers.tiktok.com/)
2. **Complete the app audit process**
3. **Get approval** from TikTok
4. **Then** you can use `"PUBLIC_TO_EVERYONE"`

## Alternative Privacy Levels

If you want to test with different privacy levels, change the code to:

```javascript
// Option 1: Only you can see (most private)
privacy_level: "SELF_ONLY"

// Option 2: Only friends can see
privacy_level: "FRIENDS_ONLY"

// Option 3: Private
privacy_level: "PRIVATE"
```

## TikTok App Audit Process

To get your app audited:

1. Go to [TikTok Developer Portal](https://developers.tiktok.com/)
2. Navigate to your app settings
3. Submit for review
4. Provide:
   - App description
   - Use case details
   - Privacy policy URL
   - Terms of service URL
   - Demo video showing your integration
5. Wait for TikTok's review (can take several days/weeks)

## Current Status

- ✅ Code updated to use `"SELF_ONLY"` for unaudited apps
- ⚠️ Videos will be private until app is audited
- 📝 To post public videos, complete TikTok app audit


