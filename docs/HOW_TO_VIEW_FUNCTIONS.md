# How to View Database Functions

## In Supabase Dashboard

### Method 1: SQL Editor

1. Go to your Supabase Dashboard: https://supabase.com/dashboard/project/pezvnqhexxttlhcnbtta
2. Navigate to **SQL Editor** (left sidebar)
3. Run the query from `view_all_functions.sql` to see all functions

### Method 2: Database Functions Tab

1. Go to **Database** → **Functions** in the left sidebar
2. You should see functions like:
   - `get_valid_youtube_token`
   - `get_valid_instagram_token`
   - `get_valid_tiktok_token`
   - `refresh_expired_youtube_tokens`
   - `refresh_expired_instagram_tokens`

### Method 3: Database Tables Tab

1. Go to **Database** → **Tables**
2. Look for the **Views** section
3. You should see `valid_platform_tokens` view

## Quick SQL Queries

### List All Functions

```sql
SELECT 
  routine_name,
  routine_type,
  data_type as return_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND (routine_name LIKE '%token%' OR routine_name LIKE '%refresh%')
ORDER BY routine_name;
```

### View Function Source Code

```sql
SELECT 
  p.proname as function_name,
  pg_get_function_arguments(p.oid) as arguments,
  pg_get_function_result(p.oid) as return_type,
  p.prosrc as source_code
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.proname = 'get_valid_youtube_token';
```

### View the Database View

```sql
SELECT 
  table_name,
  view_definition
FROM information_schema.views
WHERE table_schema = 'public'
  AND table_name = 'valid_platform_tokens';
```

## Test the Functions

### Test YouTube Token Function

```sql
-- Replace with actual creator_unique_identifier
SELECT * FROM get_valid_youtube_token('your-creator-id-here');
```

**Expected output:**
```
access_token | expires_at              | refresh_token_expired
-------------|-------------------------|----------------------
ya29.a0...   | 2024-01-01 12:00:00+00  | false
```

### Test Instagram Token Function

```sql
SELECT * FROM get_valid_instagram_token('your-creator-id-here');
```

### Test TikTok Token Function

```sql
SELECT * FROM get_valid_tiktok_token('your-creator-id-here');
```

### Query the View (All Platforms)

```sql
SELECT * FROM valid_platform_tokens
WHERE creator_unique_identifier = 'your-creator-id-here';
```

**Expected output:**
```
platform  | creator_unique_identifier | access_token | expires_at              | refresh_token_expired
----------|---------------------------|--------------|-------------------------|----------------------
youtube   | creator-id                | ya29.a0...   | 2024-01-01 12:00:00+00  | false
instagram | creator-id                | EAABw...     | 2024-01-15 12:00:00+00  | false
tiktok    | creator-id                | tiktok...    | NULL                    | false
```

## Functions Created

### Token Getter Functions

1. **`get_valid_youtube_token(creator_unique_identifier TEXT)`**
   - Returns: `access_token`, `expires_at`, `refresh_token_expired`
   - Checks if token is expired and returns valid token

2. **`get_valid_instagram_token(creator_unique_identifier TEXT)`**
   - Returns: `access_token`, `expires_at`, `refresh_token_expired`
   - Checks if token is expired and returns valid token

3. **`get_valid_tiktok_token(creator_unique_identifier TEXT)`**
   - Returns: `access_token`, `expires_at`, `refresh_token_expired`
   - Returns TikTok token (typically doesn't expire)

### Background Refresh Functions

4. **`refresh_expired_youtube_tokens()`**
   - Returns: `INTEGER` (count of tokens needing refresh)
   - Called by cron job every 10 minutes

5. **`refresh_expired_instagram_tokens()`**
   - Returns: `INTEGER` (count of tokens needing refresh)
   - Called by cron job every 6 hours

### Database View

6. **`valid_platform_tokens`**
   - View that combines all platform tokens
   - Can be queried directly by n8n
   - Automatically calls the getter functions

## Using in n8n

In n8n, use a **Supabase** node:

**Query Type:** SQL Query

**Query:**
```sql
SELECT * FROM valid_platform_tokens
WHERE creator_unique_identifier = '{{ $json.creator_unique_identifier }}'
  AND platform = 'youtube'
```

Or call the function directly:

**Query Type:** RPC

**Function:** `get_valid_youtube_token`

**Parameters:**
```json
{
  "p_creator_unique_identifier": "{{ $json.creator_unique_identifier }}"
}
```

