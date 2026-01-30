# Test Instagram Token and Verify Setup

## Your Current Status

✅ **JSON Body:** Processing correctly
✅ **Authorization Header:** Has "Bearer " prefix
✅ **Token Expiration:** Valid until March 2026
❌ **401 Error:** "Invalid OAuth access token - Cannot parse access token"

## Step 1: Test Token Directly

### Test 1: Verify Token is Valid

**Add an HTTP Request node before "Instagram Create Media" to test:**

**Node:** HTTP Request
**Name:** Test Instagram Token
**Method:** GET
**URL:** `https://graph.facebook.com/v18.0/me?access_token={{ $json.facebook_access_token }}`

**Expected Response:**
```json
{
  "id": "your_facebook_user_id",
  "name": "Your Name"
}
```

**If this fails:** Token is invalid or wrong type.

### Test 2: Verify Instagram Business Account

**Node:** HTTP Request
**Name:** Test Instagram Account
**Method:** GET
**URL:** `https://graph.facebook.com/v18.0/{{ $json.instagram_id }}?fields=id,username&access_token={{ $json.facebook_access_token }}`

**Expected Response:**
```json
{
  "id": "27085892291011296",
  "username": "your_username"
}
```

**If this fails:** Instagram ID is wrong or token doesn't have access to this account.

### Test 3: Check Token Permissions

**Node:** HTTP Request
**Name:** Debug Token
**Method:** GET
**URL:** `https://graph.facebook.com/v18.0/debug_token?input_token={{ $json.facebook_access_token }}&access_token={{ $json.facebook_access_token }}`

**Expected Response:**
```json
{
  "data": {
    "app_id": "836687999185692",
    "type": "USER",
    "application": "Your App Name",
    "expires_at": 1773910981,
    "is_valid": true,
    "scopes": [
      "instagram_business_basic",
      "instagram_business_content_publish",
      "pages_show_list"
    ]
  }
}
```

**Check:**
- `is_valid`: Should be `true`
- `scopes`: Should include `instagram_business_content_publish`
- `expires_at`: Should be in the future

## Step 2: Verify Instagram ID

Your Instagram ID is: `27085892291011296`

**Test if this ID is correct:**
```bash
curl "https://graph.facebook.com/v18.0/27085892291011296?fields=id,username&access_token=YOUR_TOKEN"
```

**Expected:** Should return the Instagram account info.

## Step 3: Check Token Type

Instagram Graph API requires a **Facebook access token** (not Instagram Basic Display token).

**Your token starts with:** `IGAAL...`

This looks like an **Instagram access token**, not a Facebook access token.

**Facebook access tokens** typically:
- Are longer
- Don't start with "IG"
- Are obtained through Facebook OAuth flow

## Step 4: Possible Solutions

### Solution 1: Token Needs to be Exchanged

If your token is an Instagram token, you might need to exchange it for a Facebook token:

**HTTP Request Node:**
- **Method:** GET
- **URL:** `https://graph.facebook.com/v18.0/oauth/access_token?grant_type=fb_exchange_token&client_id={{ $env.META_APP_ID }}&client_secret={{ $env.META_APP_SECRET }}&fb_exchange_token={{ $json.facebook_access_token }}`

### Solution 2: Re-authenticate with Correct Scopes

The token might not have the right permissions. Re-authenticate Instagram with:
- `instagram_business_basic`
- `instagram_business_content_publish`
- `pages_show_list`

### Solution 3: Use Facebook Page Access Token

If your Instagram is linked to a Facebook Page, you might need the Page access token instead:

1. Get Facebook Page ID
2. Get Page access token
3. Use Page access token for Instagram API calls

## Step 5: Complete Test Workflow

**Add these nodes before "Instagram Create Media":**

```
Get a row1
  ↓
Code Node: Prepare Data
  - Extract video_url, description, instagram_id, facebook_access_token
  ↓
HTTP Request: Test Token (Test 1)
  - Verify token works
  ↓
HTTP Request: Test Instagram Account (Test 2)
  - Verify Instagram ID is correct
  ↓
HTTP Request: Debug Token (Test 3)
  - Check permissions
  ↓
Instagram Create Media
  - Use verified token and data
```

## Quick Diagnostic

**Run this in n8n Code Node to see what you have:**

```javascript
const input = $input.item.json;

console.log('Token starts with:', input.facebook_access_token?.substring(0, 10));
console.log('Token length:', input.facebook_access_token?.length);
console.log('Instagram ID:', input.instagram_id);
console.log('Video URL:', input.video_url);

// Test token format
const token = input.facebook_access_token || '';
const isInstagramToken = token.startsWith('IG');
const isFacebookToken = token.length > 200 && !token.startsWith('IG');

return {
  json: {
    ...input,
    token_type: isInstagramToken ? 'Instagram Token' : (isFacebookToken ? 'Facebook Token' : 'Unknown'),
    token_preview: token.substring(0, 20) + '...',
  }
};
```

## Most Likely Issue

Based on your token starting with `IGAAL...`, this is an **Instagram access token**, but Instagram Graph API for posting requires a **Facebook access token**.

**Solution:** You need to re-authenticate through Facebook OAuth (not Instagram OAuth) to get a Facebook access token that has Instagram permissions.

## Check Your OAuth Flow

**Verify how you're getting the token:**

1. **If using Instagram OAuth directly:**
   - This gives Instagram tokens (starts with "IG")
   - These work for Instagram Basic Display API
   - **NOT for Instagram Graph API posting**

2. **If using Facebook OAuth with Instagram permissions:**
   - This gives Facebook tokens
   - These work for Instagram Graph API
   - **This is what you need**

**Your OAuth callback should:**
- Use Facebook OAuth endpoint
- Request Instagram permissions
- Get Facebook access token
- Exchange for long-lived token

## Next Steps

1. **Run the diagnostic Code Node** to confirm token type
2. **Test the token** with the test nodes above
3. **If token is Instagram type:** Re-authenticate through Facebook OAuth
4. **If token is Facebook type but still fails:** Check permissions and Instagram ID

