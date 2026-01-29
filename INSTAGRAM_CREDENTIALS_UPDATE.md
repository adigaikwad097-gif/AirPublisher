# Instagram Credentials Updated

## ✅ New Credentials

I've updated the Instagram OAuth credentials:

- **Client ID (META_APP_ID)**: `836687999185692`
- **Client Secret (META_APP_SECRET)**: `4691b6a3b97ab0dcaec41b218e4321c1`

## 📝 Update Your `.env.local` File

Add or update these lines in your `.env.local` file:

```bash
# Instagram OAuth (Meta/Facebook)
META_APP_ID=836687999185692
META_APP_SECRET=4691b6a3b97ab0dcaec41b218e4321c1
```

## 🔄 Next Steps

1. **Update `.env.local`** with the new credentials above
2. **Restart your dev server**:
   ```bash
   # Stop (Ctrl+C)
   npm run dev
   ```
3. **Test Instagram connection**:
   - Go to `/settings/connections`
   - Click "Connect Instagram"
   - Should redirect to Instagram/Facebook login

## 📌 Important Notes

### About Facebook Redirect

While you mentioned not needing Facebook redirect, Instagram OAuth technically still uses Facebook's OAuth system because:
- Instagram is owned by Meta (Facebook)
- The Instagram Graph API uses Facebook OAuth endpoints
- However, the new Instagram Login API (2025) makes it more Instagram-focused

### What I Changed

1. ✅ Updated credentials in documentation
2. ✅ Code already uses the new Instagram Login API scopes
3. ✅ Added `config_id` parameter to make OAuth more Instagram-focused

### The Flow

Even though it uses `facebook.com` OAuth endpoint:
- Users will see Instagram account selection
- It uses Instagram-specific scopes (`instagram_business_basic`, `instagram_business_content_publish`)
- No Facebook Page required (new API)
- More Instagram-focused experience

## ✅ After Updating

Once you've updated `.env.local` and restarted:
- The Instagram connection should work
- Users will authenticate with their Instagram account
- Tokens will be stored correctly

---

**Note**: Make sure to restart the dev server after updating `.env.local` for changes to take effect!



