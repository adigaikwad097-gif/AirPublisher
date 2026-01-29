# Rollback user_id Migration and Create Linking Table

## ✅ SQL Files Created

### 1. Rollback Migration
**File**: `supabase/migrations/008_rollback_user_id_and_create_linking_table.sql`

This migration:
1. ✅ Removes `user_id` column from `creator_profiles`
2. ✅ Drops all constraints and indexes related to `user_id`
3. ✅ Restores old RLS policies
4. ✅ Creates new `airpublisher_creator_profiles` linking table
5. ✅ Sets up RLS policies for the new table

## 📋 How to Apply

### Step 1: Run the Rollback Migration

1. Go to Supabase Dashboard → SQL Editor
2. Copy and paste the contents of `supabase/migrations/008_rollback_user_id_and_create_linking_table.sql`
3. Run it

### Step 2: Verify

1. Check `creator_profiles` table → Should NOT have `user_id` column
2. Check new table → `airpublisher_creator_profiles` should exist
3. Check structure:
   - `id` (UUID, primary key)
   - `user_id` (UUID, foreign key to auth.users)
   - `creator_unique_identifier` (TEXT, foreign key to creator_profiles)
   - `created_at`, `updated_at` (timestamps)

## 🔧 New Table Structure

```sql
airpublisher_creator_profiles
├── id (UUID, PK)
├── user_id (UUID, FK → auth.users, UNIQUE)
├── creator_unique_identifier (TEXT, FK → creator_profiles, UNIQUE)
├── created_at (TIMESTAMPTZ)
└── updated_at (TIMESTAMPTZ)
```

**Constraints**:
- One profile per user (`UNIQUE(user_id)`)
- One user per profile (`UNIQUE(creator_unique_identifier)`)
- Cascade delete when user is deleted
- Cascade delete when profile is deleted

## 📝 Next Steps

After running the migration, you'll need to update the code to:
1. Insert into `airpublisher_creator_profiles` when creating a profile
2. Query `airpublisher_creator_profiles` to find user's profile
3. Join with `creator_profiles` to get full profile data

---

**Note**: This approach separates concerns - `creator_profiles` stores profile data, `airpublisher_creator_profiles` links users to profiles.



