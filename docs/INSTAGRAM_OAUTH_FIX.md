# Instagram OAuth Fix - Direct Instagram Login

## Problem
Instagram OAuth redirects to Facebook login instead of Instagram login.

## Current Implementation
- Using: `https://www.instagram.com/oauth/authorize`
- But still redirects to Facebook

## What Repurpose.io Likely Does
Based on apps that successfully redirect to Instagram:
1. Uses Instagram Business Login (new API)
2. May use `config_id` parameter to specify Instagram Login config
3. App configured for Instagram Login, not Facebook Login

## Solutions to Try

### Option 1: Use `config_id` Parameter
If your Meta App has Instagram Login configured, add `config_id`:
```
https://www.instagram.com/oauth/authorize?client_id=...&config_id=...&redirect_uri=...&scope=...&response_type=code
```

### Option 2: Use Facebook OAuth with Instagram-First Config
Configure the app to show Instagram login first:
```
https://www.facebook.com/v18.0/dialog/oauth?client_id=...&redirect_uri=...&scope=instagram_business_basic,instagram_business_content_publish&config_id=...&display=page
```

### Option 3: Use Instagram Basic Display API
For personal Instagram accounts:
```
https://api.instagram.com/oauth/authorize?client_id=...&redirect_uri=...&scope=user_profile,user_media&response_type=code
```

## Meta App Configuration
In Meta App Dashboard:
1. **Products** → **Instagram** → **Instagram Login**
2. Make sure Instagram Login is enabled (not just Facebook Login)
3. Add your redirect URI to Instagram Login settings
4. Note the `config_id` if shown
5. Make sure scopes include `instagram_business_basic` and `instagram_business_content_publish`






