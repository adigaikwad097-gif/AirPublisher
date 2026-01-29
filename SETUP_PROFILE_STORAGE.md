# Profile Picture Setup

Users can choose their profile picture in two ways:
1. **Select from pre-made avatars** - Available in `public/avatars/` folder
2. **Upload custom avatar** - Uploaded to Supabase Storage

## Pre-made Avatars

The app includes a set of pre-made avatars in the `public/avatars/` folder. These are served directly from the public folder and don't require any setup.

## Custom Avatar Uploads (Supabase Storage)

To enable custom avatar uploads, you need to create a Supabase Storage bucket.

### Steps:

1. Go to your Supabase Dashboard
2. Navigate to **Storage** → **Buckets**
3. Click **New bucket**
4. Name: `profile-pictures`
5. Make it **Public** (so profile pictures can be accessed)
6. Click **Create bucket**

### Storage Policies

You'll need to add policies to allow users to upload their own profile pictures:

```sql
-- Allow authenticated users to upload their own profile pictures
CREATE POLICY "Users can upload own profile pictures"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'profile-pictures' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow authenticated users to update/delete their own profile pictures
CREATE POLICY "Users can manage own profile pictures"
ON storage.objects FOR ALL
TO authenticated
USING (
  bucket_id = 'profile-pictures' AND
  (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'profile-pictures' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow public read access to profile pictures
CREATE POLICY "Public can view profile pictures"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'profile-pictures');
```

Alternatively, you can use the Supabase Dashboard to create these policies:
1. Go to **Storage** → **Policies**
2. Select the `profile-pictures` bucket
3. Add the policies above

## Database Table

Profile information is stored in the `airpublisher_creator_profiles` table with the following columns:
- `user_id` - References auth.users(id)
- `creator_unique_identifier` - Unique identifier for the creator (auto-generated)
- `handles` - Display name
- `profile_pic_url` - Avatar URL (can be from `/avatars/` or Supabase Storage) - **THIS IS WHERE PROFILE PICTURES ARE STORED**
- `created_at` - Timestamp
- `updated_at` - Timestamp

**Note:** The `profile_pic_url` column stores the full URL to the avatar image. This can be:
- A local path like `/avatars/blackbaddie.png` (for pre-made avatars)
- A Supabase Storage URL like `https://[project].supabase.co/storage/v1/object/public/profile-pictures/[user_id]/[filename]` (for custom uploads)

The update API endpoint (`/api/profile/update`) updates the `profile_pic_url` column in the `airpublisher_creator_profiles` table when users select an avatar or upload a custom image.

