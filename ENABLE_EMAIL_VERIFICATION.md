# Enable Email Verification in Supabase

## 🔴 Problem

You signed up but didn't receive the verification email.

## ✅ Solution: Enable Email Verification in Supabase

### Step 1: Go to Supabase Dashboard

1. **Open**: https://supabase.com/dashboard/project/pezvnqhexxttlhcnbtta/auth/providers
2. **Or**: Go to your project → Authentication → Providers

### Step 2: Enable Email Provider

1. **Find**: "Email" provider in the list
2. **Toggle**: Enable it (should be ON)
3. **Click**: "Configure" or settings icon

### Step 3: Configure Email Settings

1. **Go to**: Authentication → Settings (or Email Templates)
2. **Check**: "Enable email confirmations" is **ON**
3. **Set**: "Confirm email" to **ON**

### Step 4: Check Email Templates

1. **Go to**: Authentication → Email Templates
2. **Find**: "Confirm signup" template
3. **Verify**: Template is enabled and has correct redirect URL

### Step 5: Set Redirect URL

In the email template, make sure the redirect URL is:
```
http://localhost:3000/auth/callback
```

Or for production:
```
https://your-domain.com/auth/callback
```

## 🔍 Check if Email Was Sent

### Option 1: Check Supabase Logs

1. **Go to**: Supabase Dashboard → Logs → Auth Logs
2. **Look for**: Email send events
3. **Check**: If email was sent or if there was an error

### Option 2: Check Spam Folder

- Check your spam/junk folder
- Check promotions tab (Gmail)
- Check all mail folders

### Option 3: Check Supabase Email Settings

1. **Go to**: Settings → Auth
2. **Check**: "Site URL" is set correctly
3. **Check**: "Redirect URLs" includes your callback URL

## 🧪 Test Email Verification

### Option 1: Disable Email Confirmation (Development)

For development/testing, you can temporarily disable email confirmation:

1. **Go to**: Authentication → Settings
2. **Set**: "Enable email confirmations" to **OFF**
3. **Save**

**Note**: This allows immediate sign-in without email verification (for testing only).

### Option 2: Use Supabase Magic Link

Instead of password signup, you can use magic link (email-only signup):

1. User enters email
2. Receives magic link
3. Clicks link → Automatically signed in

## 🔧 Alternative: Manual Email Verification

If emails aren't working, you can manually verify users:

1. **Go to**: Supabase Dashboard → Authentication → Users
2. **Find**: Your user account
3. **Click**: User email
4. **Click**: "Confirm email" button (or similar)
5. **User can now sign in**

## 📋 Quick Checklist

- [ ] Email provider is enabled in Supabase
- [ ] "Enable email confirmations" is ON
- [ ] Email template is configured
- [ ] Redirect URL is set correctly
- [ ] Checked spam folder
- [ ] Checked Supabase auth logs
- [ ] Site URL is configured in Supabase settings

## 🆘 If Still Not Working

1. **Check Supabase Status**: https://status.supabase.com
2. **Check Email Service**: Supabase uses their own email service
3. **Try Different Email**: Some email providers block automated emails
4. **Contact Support**: If issue persists, contact Supabase support

---

**Quick Fix for Development**: Disable email confirmation temporarily to test the flow, then re-enable for production.



