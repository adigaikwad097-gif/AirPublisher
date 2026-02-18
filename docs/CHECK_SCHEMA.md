# Check Schema - airpublisher_creator_profiles

## Issue
Error: "Could not find the 'handles' column of 'airpublisher_creator_profiles' in the schema cache"

## Possible Causes
1. **Migration 009 hasn't run** - The `handles` column was added in migration 009, but maybe it wasn't applied to Supabase
2. **Schema cache is stale** - TypeScript types need to be regenerated
3. **Column doesn't actually exist** - The migration failed or was rolled back

## Check in Supabase
Run this in Supabase SQL Editor to check if the column exists:
```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'airpublisher_creator_profiles'
ORDER BY ordinal_position;
```

## If Column Doesn't Exist
Run migration 009 in Supabase SQL Editor:
```sql
-- From migration 009
ALTER TABLE airpublisher_creator_profiles
ADD COLUMN IF NOT EXISTS handles TEXT NOT NULL DEFAULT '';
```

## Required Columns in airpublisher_creator_profiles
- `id` (UUID, PRIMARY KEY)
- `user_id` (UUID, REFERENCES auth.users)
- `creator_unique_identifier` (TEXT, UNIQUE)
- `handles` (TEXT, NOT NULL DEFAULT '') ← **This is the one missing**
- `profile_pic_url` (TEXT, nullable)
- `created_at` (TIMESTAMPTZ)
- `updated_at` (TIMESTAMPTZ)

## Note
- `Niche` was removed (migration 010) - niche should come from `creator_profiles` (shared schema)






