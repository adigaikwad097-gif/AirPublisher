# Fix Google OAuth "invalid_client" Error

## 🔴 Error

**Error 401: invalid_client** - "The OAuth client was not found"

This means:
- The Google OAuth Client ID is incorrect
- The Client ID doesn't exist in Google Cloud Console
- The credentials aren't configured correctly in Supabase

## ✅ Your Google OAuth Credentials

**Client ID:**
```
YOUR_GOOGLE_CLIENT_ID
```

**Client Secret:**
```
YOUR_GOOGLE_CLIENT_SECRET
```

## 🔧 Fix Steps

### Step 1: Verify in Google Cloud Console

1. **Go to**: https://console.cloud.google.com/apis/credentials
2. **Find your OAuth 2.0 Client ID**
3. **Verify** the Client ID matches:
   ```
   YOUR_GOOGLE_CLIENT_ID
   ```
4. **If it doesn't match**, you need to:
   - Use the correct Client ID from Google Cloud Console
   - Or create a new OAuth client

### Step 2: Check Supabase Configuration

1. **Go to**: https://supabase.com/dashboard/project/pezvnqhexxttlhcnbtta/auth/providers
2. **Find Google** provider
3. **Click Configure**
4. **Verify** the credentials match exactly:
   - **Client ID**: `YOUR_GOOGLE_CLIENT_ID`
   - **Client Secret**: `YOUR_GOOGLE_CLIENT_SECRET`
5. **Make sure**:
   - No extra spaces
   - No quotes around values
   - Copied exactly (don't type manually)

### Step 3: Verify Redirect URI in Google Cloud Console

1. **In Google Cloud Console**, click **Edit** on your OAuth client
2. **Check Authorized redirect URIs** includes:
   ```
   https://pezvnqhexxttlhcnbtta.supabase.co/auth/v1/callback
   ```
3. **Also add** (if using ngrok):
   ```
   https://untasting-overhugely-kortney.ngrok-free.dev/auth/callback
   ```

### Step 4: Check OAuth Consent Screen

1. **Go to**: https://console.cloud.google.com/apis/credentials/consent
2. **Verify** OAuth consent screen is configured
3. **Make sure** app is in "Testing" or "Production" mode
4. **Add test users** if in Testing mode

## 🔍 Common Issues

### Issue 1: Wrong Client ID
- **Symptom**: Error 401: invalid_client
- **Fix**: Use the exact Client ID from Google Cloud Console

### Issue 2: Client Secret Mismatch
- **Symptom**: Error 401: invalid_client
- **Fix**: Make sure Client Secret matches the Client ID in Google Cloud Console

### Issue 3: OAuth Client Deleted
- **Symptom**: Error 401: invalid_client
- **Fix**: Create a new OAuth client in Google Cloud Console

### Issue 4: Wrong Project
- **Symptom**: Error 401: invalid_client
- **Fix**: Make sure you're using credentials from the correct Google Cloud project

## ✅ Quick Verification

1. **Google Cloud Console**:
   - Client ID exists: ✅
   - Client Secret matches: ✅
   - Redirect URI added: ✅

2. **Supabase Dashboard**:
   - Google provider enabled: ✅
   - Client ID correct: ✅
   - Client Secret correct: ✅

3. **Test**:
   - Try Google Sign-In again
   - Should work now!

---

## 🆘 If Still Not Working

1. **Create a new OAuth client** in Google Cloud Console
2. **Get new Client ID and Secret**
3. **Update Supabase** with new credentials
4. **Add redirect URI** to new client
5. **Test again**

---

**Most likely issue**: The Client ID in Supabase doesn't match the one in Google Cloud Console. Double-check both!

