# Debug Profile Lookup Issue

## 🔴 Problem

Profile is created and inserted into Supabase, but when you try to access it, the system asks you to create a profile again.

## 🔍 Debug Steps

### 1. Check Profile in Supabase

1. Go to Supabase Dashboard → Table Editor → `creator_profiles`
2. Find your profile
3. Check the `unique_identifier` column
4. Note the format: Should be `creator_<first8charsOfUserId>_<timestamp>_<random>`

### 2. Check Your User ID

1. Go to: http://localhost:3000/api/debug/profile-lookup
2. This will show:
   - Your user ID
   - Your user ID prefix (first 8 characters)
   - Cookie value
   - Profile found (if any)
   - All matching profiles with your user prefix

### 3. Check Server Logs

When you create a profile, check the terminal/console for:
- `[createProfileAction] ✅ Profile created successfully`
- `[createProfileAction] Storing profile ID in cookie`
- `[getCreatorByUserId] Searching with pattern: creator_<prefix>_%`
- `[getCreatorByUserId] Pattern search result`

### 4. Common Issues

#### Issue 1: Cookie Not Set
- **Symptom**: Profile created but cookie is null
- **Fix**: Check if `setProfileCookie()` is being called
- **Check**: Look for `[createProfileAction] ✅ Cookie set successfully` in logs

#### Issue 2: Pattern Mismatch
- **Symptom**: Profile exists but pattern search doesn't find it
- **Fix**: Check if `unique_identifier` format matches expected pattern
- **Check**: Compare `unique_identifier` in database with search pattern

#### Issue 3: RLS Policy Blocking
- **Symptom**: Profile exists but can't be read
- **Fix**: Check RLS policies in Supabase
- **Check**: Look for `42501` error code in logs

## 🧪 Test Profile Lookup

1. **Create a profile** at `/setup`
2. **Check debug endpoint**: http://localhost:3000/api/debug/profile-lookup
3. **Expected output**:
   ```json
   {
     "user": {
       "id": "your-user-id",
       "email": "your-email",
       "prefix": "first8chars"
     },
     "cookie": {
       "profileId": "creator_<prefix>_<timestamp>_<random>"
     },
     "profile": {
       "unique_identifier": "creator_<prefix>_<timestamp>_<random>",
       "display_name": "Your Name"
     },
     "matchingProfiles": [...]
   }
   ```

## 🔧 Quick Fixes

### If Cookie is Not Set

The cookie might not be set if:
- Server action failed silently
- Cookie setting failed (check server logs)

**Fix**: Manually set cookie or refresh the page after profile creation.

### If Pattern Doesn't Match

The `unique_identifier` format might be different than expected.

**Fix**: Check the actual format in Supabase and update the search pattern in `getCreatorByUserId()`.

### If Profile Not Found

The profile might exist but the lookup is failing.

**Fix**: 
1. Check debug endpoint output
2. Compare `unique_identifier` in database with search pattern
3. Check server logs for lookup errors

---

**Next Steps**: 
1. Visit `/api/debug/profile-lookup` to see what's happening
2. Check server logs when creating/accessing profile
3. Compare the output with expected values
