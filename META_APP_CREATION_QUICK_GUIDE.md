# Meta App Creation - Quick Guide (Current Flow)

## Step-by-Step: What You're Seeing

### Step 1: Use Cases Screen
**What you see:** "What do you want your app to do?"

**What to select:**
- ✅ **"Connect Business Portfolio"** ← **SELECT THIS ONE**
- OR **"Manage Business Account"**
- OR **"Build Connected Experiences"**

**Why:** These are the only use cases that support Instagram Graph API for posting.

---

### Step 2: Connect Business Portfolio
**What you see:** "Connect Business Portfolio" or "Link Business Manager"

**What to do:**
1. **If you have Business Manager:**
   - Click **"Connect"** and select your Business Manager
   - OR click **"Skip"** if you want to add it later

2. **If you DON'T have Business Manager:**
   - Click **"Skip"** or **"Not Now"** ← **DO THIS**
   - You don't need it for development/testing
   - You can add it later if needed

**Important:** You can skip this step! It's optional for development.

---

### Step 3: Verify Business and App
**What you see:** "Verify Business and App" or "Business Verification"

**What to do:**
- Click **"Skip"** or **"Not Now"** ← **DO THIS**
- Verification is only needed for production/live apps
- For development, you can skip it

**What happens if you skip:**
- ✅ Your app works in "Development Mode"
- ✅ You can test with your own accounts
- ✅ All features work for testing
- ✅ You can verify later when going live

**When you need verification:**
- Only when you want to make your app public
- Only when other businesses will use your app
- Not needed for personal/testing use

---

## Complete Flow Summary

```
1. Select Use Case
   → Choose "Connect Business Portfolio"
   
2. Connect Business Portfolio
   → Click "Skip" (optional for dev)
   
3. Verify Business and App
   → Click "Skip" (optional for dev)
   
4. Enter App Details
   → App Name: "AIR Publisher"
   → Email: your email
   → Click "Create App"
   
5. Add Instagram Graph API
   → Go to Products → Add Instagram Graph API
   
6. Configure OAuth
   → Set redirect URIs
   → Get App ID and Secret
```

---

## Common Questions

**Q: Do I need Business Manager?**
A: No, not for development. Skip it for now.

**Q: Do I need to verify?**
A: No, not for development. Skip it. Verify only when going live.

**Q: Will my app work without verification?**
A: Yes! It works in Development Mode. You can test everything.

**Q: Can I verify later?**
A: Yes, you can verify anytime in Settings → Business Verification.

---

## After App Creation

Once your app is created:

1. **Add Instagram Graph API:**
   - Go to **Products** (left sidebar)
   - Find **"Instagram Graph API"**
   - Click **"Set Up"**

2. **Set OAuth Redirect URI:**
   - Go to **Settings** → **Basic**
   - Scroll to **"Add Platform"** → Add **"Website"**
   - Site URL: `http://localhost:3000`
   - Go to **Products** → **Instagram Graph API** → **Basic Display**
   - Add redirect URI: `http://localhost:3000/api/auth/instagram/callback`

3. **Get Credentials:**
   - Go to **Settings** → **Basic**
   - Copy **App ID** and **App Secret**
   - Add to `.env.local`

---

## Troubleshooting

**"I can't skip verification"**
- Try clicking "Not Now" or "Skip for Now"
- Some accounts may require it - in that case, you'll need to provide basic business info

**"Business Portfolio required"**
- This is usually optional
- If it's blocking you, you can create a free Business Manager account at business.facebook.com
- Then link it, or try a different use case

**"App type not suitable"**
- Make sure you selected "Connect Business Portfolio" or "Manage Business Account"
- These are the only use cases that support Instagram posting

---

## Next Steps After Creation

1. ✅ App created (even in Development Mode)
2. ✅ Add Instagram Graph API product
3. ✅ Set redirect URIs
4. ✅ Get App ID and Secret
5. ✅ Add to `.env.local`
6. ✅ Test OAuth flow at `/settings/connections`

You're all set! 🎉



