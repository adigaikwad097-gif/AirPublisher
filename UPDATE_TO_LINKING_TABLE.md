# Update Code to Use airpublisher_creator_profiles Linking Table

## ✅ Changes Made

### 1. Profile Creation (`app/api/profile/actions.ts`)

**Updated**: After creating a profile in `creator_profiles`, the code now:
1. Creates the profile in `creator_profiles` table
2. **Creates a linking record** in `airpublisher_creator_profiles` table
3. Stores the `unique_identifier` in cookie

**Key Changes**:
- Removed `user_id` from `creator_profiles` insert (since we rolled that back)
- Added insert into `airpublisher_creator_profiles` after profile creation
- All creation paths (normal, retry, service role) now create linking records

### 2. Profile Lookup (`lib/db/creator.ts`)

**Updated**: `getCreatorByUserId()` now:
1. **Primary**: Looks up via `airpublisher_creator_profiles` linking table
2. **Fallback**: Pattern matching for old profiles (backward compatibility)
3. **Auto-link**: If found by pattern, creates linking record for future lookups

**Key Changes**:
- Removed direct `user_id` lookup from `creator_profiles` (column doesn't exist)
- Added lookup via `airpublisher_creator_profiles` table
- Maintains backward compatibility with pattern matching

## 🔧 How It Works Now

### Sign Up Flow:
1. User signs up → Account created in `auth.users`
2. User redirected to `/dashboard` → If no profile, redirected to `/setup`
3. User creates profile → `createProfileAction()` is called
4. Profile created in `creator_profiles` table
5. **Linking record created** in `airpublisher_creator_profiles` table
6. Cookie set with `unique_identifier`
7. User redirected to dashboard

### Sign In Flow:
1. User signs in → Session created
2. User redirected to `/dashboard` → `getCurrentCreator()` is called
3. `getCreatorByUserId()` looks up via `airpublisher_creator_profiles` table
4. Finds `creator_unique_identifier` for the user
5. Fetches full profile from `creator_profiles` table
6. Returns profile to dashboard

## 📋 Database Structure

```
auth.users (Supabase Auth)
    ↓ (via user_id)
airpublisher_creator_profiles (Linking Table)
    ↓ (via creator_unique_identifier)
creator_profiles (Profile Data)
```

## ✅ Benefits

1. **Separation of concerns**: Profile data separate from user linking
2. **Better monitoring**: Can track which users have profiles
3. **Flexible**: Can add more metadata to linking table later
4. **Backward compatible**: Old profiles still work via pattern matching

## 🧪 Testing

1. **Sign up with new account**:
   - Should create profile in `creator_profiles`
   - Should create linking record in `airpublisher_creator_profiles`
   - Should be able to access profile immediately

2. **Sign in with existing account**:
   - Should find profile via linking table
   - Should work even if profile was created before linking table existed (fallback)

3. **Check Supabase**:
   - `airpublisher_creator_profiles` table should have records
   - Each record links `user_id` to `creator_unique_identifier`

---

**Note**: The code maintains backward compatibility - profiles created before the linking table will still work via pattern matching, and will automatically get linking records created when accessed.


