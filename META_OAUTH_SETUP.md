# Meta (Facebook/Instagram) OAuth Setup Guide

## Step-by-Step Instructions

### Step 1: Create Meta Developer Account

1. Go to [Meta for Developers](https://developers.facebook.com/)
2. Sign in with your Facebook account
3. If you don't have a developer account, you'll be prompted to create one

### Step 2: Create a New App

1. Click **"My Apps"** in the top right
2. Click **"Create App"**
3. You'll see a screen asking **"What do you want your app to do?"**

### Step 3: Select Use Case

**You'll see a screen titled "Add use cases" with a list of options.**

**For Instagram posting, you MUST select:**
- ✅ **"Manage messaging & content on Instagram"** ← **SELECT THIS ONE!**
  - Icon: Instagram camera logo (square with circle inside)
  - Description: "Publish posts, share stories, respond to comments, answer direct messages and more with the Instagram API."
  - This is the ONLY use case that enables Instagram Graph API for posting

**How to find it:**
1. Look through the list of use cases
2. Find the one with the Instagram camera icon
3. Title: "Manage messaging & content on Instagram"
4. Check the checkbox on the right side

**If you don't see it:**
- Try filtering by "Content management" in the left sidebar
- Or select "All" to see all 19 use cases
- Scroll down - it might be further down the list

**DO NOT select:**
- ❌ "Create an app without a use case" - Won't give you Instagram API access
- ❌ "Other" - This is going away soon and won't work properly
- ❌ Any Marketing API use cases - These are for ads, not posting content

**Why "Manage messaging & content on Instagram"?**
- This is the official use case for Instagram Graph API
- Enables posting to Instagram (posts, stories, etc.)
- Required for Instagram content publishing features

### Step 3.5: Connect Business Portfolio

After selecting the use case, you'll be asked to **"Connect Business Portfolio"**:

1. **If you have a Business Manager account:**
   - Click **"Connect"** or **"Link Business Manager"**
   - Select your Business Manager account
   - This links your app to your business assets

2. **If you don't have a Business Manager account:**
   - You can **skip this step** for now (click "Skip" or "Not Now")
   - You can add it later in Settings
   - For development/testing, you don't need Business Manager

**Note:** Business Manager is optional for development. You can test with your personal Facebook Page and Instagram account.

### Step 3.6: Verify Business and App

Meta will ask you to **"Verify Business and App"**:

1. **For Development/Testing:**
   - You can **skip verification** for now
   - Click **"Skip"** or **"Not Now"**
   - Verification is only required for production/live apps
   - You can verify later when going live

2. **What verification requires:**
   - Business verification (business documents, phone number, etc.)
   - App verification (more detailed app information)
   - This is mainly for apps that will be used by other businesses

3. **For now:**
   - **Skip verification** - Your app will be in "Development Mode"
   - You can still test with your own accounts
   - You can verify later when ready for production

**Important:** Even without verification, you can:
- ✅ Test OAuth flows
- ✅ Post to your own Instagram account
- ✅ Use all features in Development Mode
- ✅ Add test users to your app

### Step 4: Complete App Creation

After skipping verification, you'll proceed to app creation:

1. **App Name**: Enter "AIR Publisher" (or your preferred name)
2. **App Contact Email**: Your email address
3. **App Purpose** (if asked): Select "Business" or "Other"
4. Click **"Create App"** or **"Continue"**

**You should now see your app dashboard!**

### Step 5: Add Instagram Graph API Product

1. After app creation, you'll see the app dashboard
2. Look for **"Add Products"** section or go to **"Products"** in the left sidebar
3. Find **"Instagram Graph API"** and click **"Set Up"**
4. Follow the setup wizard:
   - Select **"Instagram Graph API"**
   - Choose **"Business"** or **"Creator"** account type
   - Accept terms

### Step 6: Configure OAuth Settings

1. Go to **Settings** → **Basic** (left sidebar)
2. Note your **App ID** and **App Secret** (you'll need these for `.env.local`)
3. Scroll down to **"Add Platform"** section
4. Click **"Add Platform"** → Select **"Website"**
5. Enter **Site URL**: `http://localhost:3000` (or your production URL)

### Step 7: Set OAuth Redirect URIs

1. Go to **Products** → **Instagram Graph API** → **Basic Display** (or find OAuth settings)
2. Look for **"Valid OAuth Redirect URIs"** or **"Redirect URIs"**
3. Add these URIs:
   ```
   http://localhost:3000/api/auth/instagram/callback
   https://your-production-domain.com/api/auth/instagram/callback
   ```
4. Click **"Save Changes"**

### Step 8: Configure App Permissions

1. Go to **App Review** → **Permissions and Features** (left sidebar)
2. Request these permissions:
   - `instagram_basic` (usually approved automatically)
   - `instagram_content_publish` (needs review for production)
   - `pages_show_list` (to list Facebook Pages)
   - `pages_read_engagement` (to read page insights)

**Note**: For development/testing, you can use your own account without app review. For production, you'll need to submit for review.

### Step 9: Link Instagram Account to Facebook Page

**Important**: To post to Instagram, you need:

1. An **Instagram Business** or **Creator** account (not personal)
2. A **Facebook Page** (create one if you don't have one)
3. Link your Instagram account to your Facebook Page:
   - Go to your Instagram app → Settings → Account → Switch to Professional Account
   - Choose "Business" or "Creator"
   - Connect to your Facebook Page

### Step 10: Test Mode vs Live Mode

- **Test Mode**: Only you and test users can use the app
- **Live Mode**: Public access (requires app review)

For development, Test Mode is fine. Switch to Live Mode when ready for production.

---

## Quick Checklist

- [ ] Created Meta Developer account
- [ ] Created app with "Business" use case
- [ ] Added Instagram Graph API product
- [ ] Set OAuth redirect URIs
- [ ] Got App ID and App Secret
- [ ] Instagram account is Business/Creator type
- [ ] Instagram account linked to Facebook Page
- [ ] Added credentials to `.env.local`

---

## Common Issues

**"App type not suitable for Instagram Graph API"**
- Make sure you selected "Business" use case
- Ensure Instagram Graph API product is added

**"Redirect URI mismatch"**
- Check that the URI in your code matches exactly (including http vs https, trailing slashes, etc.)

**"Instagram account not eligible"**
- Must be Business or Creator account
- Must be linked to a Facebook Page

**"Permission denied"**
- Some permissions require app review
- For testing, add yourself as a test user in App Dashboard → Roles → Test Users

---

## Next Steps

1. Add your App ID and App Secret to `.env.local`:
   ```bash
   INSTAGRAM_APP_ID=your-app-id
   INSTAGRAM_APP_SECRET=your-app-secret
   ```

2. Test the OAuth flow:
   - Go to `/settings/connections`
   - Click "Connect Instagram"
   - Complete the authorization flow

3. If you encounter issues, check:
   - App is in Test Mode (for development)
   - Redirect URI matches exactly
   - Instagram account is Business/Creator type

