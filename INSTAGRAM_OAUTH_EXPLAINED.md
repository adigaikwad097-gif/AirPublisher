# Instagram OAuth - Why Facebook Login Appears

## ✅ This is Normal and Expected!

When you click "Connect Instagram", you **will see Facebook login**. This is correct behavior.

## Why Facebook Login?

Instagram is owned by Meta (Facebook). The Instagram API uses **Facebook's OAuth system** for authentication, even though you're connecting an Instagram account.

### The Flow:

1. **User clicks "Connect Instagram"** in your app
2. **Redirects to Facebook login** (this is Meta's OAuth system)
3. **User signs in with Facebook** (or uses existing Facebook session)
4. **Meta shows Instagram account selection** (if user has multiple Instagram accounts)
5. **User grants permissions** for Instagram access
6. **Redirects back to your app** with tokens
7. **Your app stores tokens** and connects the Instagram account

## What You'll See:

- **Facebook login screen** ✅ (This is correct!)
- **Permission request** for Instagram access
- **Instagram account selection** (if applicable)
- **Redirect back to your app**

## Important Notes:

1. **Facebook login is required** - Even though you're connecting Instagram, Meta uses Facebook OAuth
2. **Instagram account must be Professional** - Business or Creator account
3. **New API (2025)** - Uses `instagram_business_basic` and `instagram_business_content_publish` scopes
4. **No Facebook Page required** - The new API doesn't require linking to a Facebook Page (unlike old API)

## What to Check:

### ✅ Your Implementation is Correct

Your code is already:
- Using the new scopes (`instagram_business_basic`, `instagram_business_content_publish`)
- Redirecting to Facebook OAuth (correct)
- Handling the callback properly
- Trying to get Instagram account directly (without requiring Pages)

### ⚠️ Make Sure:

1. **Redirect URI is added** in Meta App:
   - `https://untasting-overhugely-kortney.ngrok-free.dev/api/auth/instagram/callback`
   
2. **Facebook Login is enabled** in Meta App:
   - Products → Facebook Login → Settings
   - Enable Client OAuth Login
   - Enable Web OAuth Login

3. **Your Instagram account is Professional**:
   - Business or Creator account
   - Can be connected without a Facebook Page (new API)

## After Facebook Login:

Once you complete Facebook login:
1. You'll be redirected back to your app
2. The callback will exchange tokens
3. Your Instagram account will be connected
4. The settings page will show "Instagram Connected"

---

## Summary

**Seeing Facebook login when connecting Instagram is 100% normal and expected.** This is how Meta's OAuth system works. Just complete the Facebook login, and your Instagram account will be connected!



