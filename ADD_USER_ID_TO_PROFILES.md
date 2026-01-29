# Add user_id Column to creator_profiles Table

## ✅ Migration Created

Created migration `007_add_user_id_to_creator_profiles.sql` that:

1. **Adds `user_id` column** to `creator_profiles` table
2. **Creates foreign key** relationship to `auth.users`
3. **Adds unique constraint** (one profile per user)
4. **Updates RLS policies** to use `user_id` instead of pattern matching
5. **Creates index** for faster lookups

## 🔧 Code Updates

### 1. Profile Creation (`app/api/profile/actions.ts`)
- Now includes `user_id` when creating profiles
- All profile creation paths now set `user_id`

### 2. Profile Lookup (`lib/db/creator.ts`)
- **Primary**: Direct lookup by `user_id` (fast and reliable)
- **Fallback**: Pattern matching for old profiles (backward compatibility)
- **Auto-update**: If profile found by pattern, updates it with `user_id` for future lookups

## 📋 How to Apply

### Step 1: Run Migration

1. Go to Supabase Dashboard → SQL Editor
2. Run the migration file: `supabase/migrations/007_add_user_id_to_creator_profiles.sql`
3. Or copy-paste the SQL directly

### Step 2: Update Existing Profiles (Optional)

If you have existing profiles without `user_id`, you can update them:

```sql
-- Update profiles that match user ID pattern
UPDATE creator_profiles
SET user_id = (
  SELECT id FROM auth.users 
  WHERE id::text LIKE SUBSTRING(creator_profiles.unique_identifier FROM 9 FOR 8) || '%'
  LIMIT 1
)
WHERE user_id IS NULL
AND unique_identifier LIKE 'creator_%';
```

**Note**: This is optional - the code will handle old profiles with pattern matching fallback.

### Step 3: Verify

1. Create a new profile → Should have `user_id` set
2. Check Supabase → `creator_profiles` table should have `user_id` column
3. Test lookup → Should find profile by `user_id` directly

## ✅ Benefits

1. **Faster lookups**: Direct `user_id` query instead of pattern matching
2. **More reliable**: No dependency on `unique_identifier` format
3. **Better RLS**: Policies can use `auth.uid() = user_id` directly
4. **Data integrity**: Foreign key ensures user exists
5. **One profile per user**: Unique constraint prevents duplicates

## 🔍 Testing

1. **Create new profile**:
   - Should set `user_id` automatically
   - Should be found by `user_id` lookup

2. **Access existing profile**:
   - Should work with pattern matching fallback
   - Should auto-update with `user_id` if found

3. **Check Supabase**:
   - `creator_profiles` table should have `user_id` column
   - New profiles should have `user_id` set
   - Old profiles can have `user_id` as NULL (will use fallback)

---

**Note**: The code maintains backward compatibility - old profiles without `user_id` will still work via pattern matching, but new profiles will use the direct `user_id` lookup.



