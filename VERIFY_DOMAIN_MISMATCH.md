# Domain Mismatch Issue - Fix Guide

## The Problem

I can see you have **different domains** configured:

### Instagram OAuth Settings:
- ✅ `https://airpublisher-tjha.vercel.app/api/auth/instagram/callback`
- ✅ `https://airpublisher.app/api/auth/instagram/callback` (custom domain)

### TikTok OAuth Settings:
- ✅ `https://airpublisher.vercel.app/api/auth/tiktok/callback`

### Your Vercel Environment:
- `NEXT_PUBLIC_APP_URL` = `airpublisher.vercel.app` (you mentioned)

## The Issue

**There's a mismatch:**
- TikTok expects: `airpublisher.vercel.app` (no `-tjha`)
- Instagram has: `airpublisher-tjha.vercel.app` (with `-tjha`)
- Your env var: `airpublisher.vercel.app` (no `-tjha`)

**Vercel projects have TWO URLs:**
1. **Project URL**: `your-project-name.vercel.app` (e.g., `airpublisher.vercel.app`)
2. **Deployment URL**: `your-project-name-hash.vercel.app` (e.g., `airpublisher-tjha.vercel.app`)

The `-tjha` is a deployment-specific hash that Vercel uses.

## Solution

### Option 1: Use the Project URL (Recommended)

If `airpublisher.vercel.app` is your main domain:

1. **Update Vercel Environment Variable:**
   ```
   NEXT_PUBLIC_APP_URL=https://airpublisher.vercel.app
   ```
   (Make sure it includes `https://`)

2. **Update Instagram OAuth Settings:**
   - Remove: `https://airpublisher-tjha.vercel.app/api/auth/instagram/callback`
   - Keep: `https://airpublisher.app/api/auth/instagram/callback` (if this is your custom domain)
   - Add: `https://airpublisher.vercel.app/api/auth/instagram/callback`

3. **Verify TikTok OAuth Settings:**
   - Should be: `https://airpublisher.vercel.app/api/auth/tiktok/callback`
   - ✅ Already correct!

4. **Redeploy** your Vercel application

### Option 2: Use the Deployment URL

If `airpublisher-tjha.vercel.app` is what you want to use:

1. **Update Vercel Environment Variable:**
   ```
   NEXT_PUBLIC_APP_URL=https://airpublisher-tjha.vercel.app
   ```

2. **Update TikTok OAuth Settings:**
   - Change from: `https://airpublisher.vercel.app/api/auth/tiktok/callback`
   - Change to: `https://airpublisher-tjha.vercel.app/api/auth/tiktok/callback`

3. **Verify Instagram OAuth Settings:**
   - Should have: `https://airpublisher-tjha.vercel.app/api/auth/instagram/callback`
   - ✅ Already has it!

4. **Redeploy** your Vercel application

## How to Check Your Actual Vercel URL

1. Go to **Vercel Dashboard** → Your Project
2. Look at the **Domains** section
3. Check what URLs are listed:
   - Project URL: `airpublisher.vercel.app`
   - Deployment URL: `airpublisher-tjha.vercel.app` (if exists)
   - Custom domain: `airpublisher.app` (if configured)

## Recommended Setup

Since you mentioned `airpublisher.vercel.app` is your main domain:

### Step 1: Update Vercel Environment Variable

```
NEXT_PUBLIC_APP_URL=https://airpublisher.vercel.app
```

**Important:** Include `https://` and no trailing slash!

### Step 2: Update Instagram OAuth Settings

In Meta for Developers → Instagram → Business login settings:

**OAuth redirect URIs:**
- ✅ Keep: `https://airpublisher.app/api/auth/instagram/callback` (if custom domain)
- ❌ Remove: `https://airpublisher-tjha.vercel.app/api/auth/instagram/callback`
- ✅ Add: `https://airpublisher.vercel.app/api/auth/instagram/callback`

### Step 3: Verify TikTok OAuth Settings

In TikTok Developers Portal → Login Kit → Web:

**Redirect URI:**
- ✅ Should be: `https://airpublisher.vercel.app/api/auth/tiktok/callback`
- ✅ Already correct!

### Step 4: Redeploy and Test

1. **Redeploy** your Vercel application
2. **Wait 2-3 minutes** for changes to propagate
3. **Test OAuth flows**

## Verification Checklist

After making changes:

- [ ] `NEXT_PUBLIC_APP_URL` in Vercel = `https://airpublisher.vercel.app` (with https://)
- [ ] Instagram OAuth redirect URI = `https://airpublisher.vercel.app/api/auth/instagram/callback`
- [ ] TikTok OAuth redirect URI = `https://airpublisher.vercel.app/api/auth/tiktok/callback`
- [ ] All URLs match exactly (no trailing slashes, same protocol, same domain)
- [ ] Redeployed application
- [ ] Tested OAuth flows

## Still Not Working?

1. **Check Vercel function logs** to see what redirect URI is actually being sent
2. **Compare with OAuth app settings** - must match character-for-character
3. **Verify `NEXT_PUBLIC_APP_URL`** includes `https://` (not just the domain)
4. **Wait 2-3 minutes** after saving OAuth app changes

The redirect URI in your code, OAuth app settings, and environment variable must all match exactly!


