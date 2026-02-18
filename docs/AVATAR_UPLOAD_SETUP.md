# Avatar Upload Setup

## Storage Bucket Setup

Before using the avatar upload feature, you need to create a Supabase Storage bucket:

1. Go to your Supabase dashboard
2. Navigate to **Storage**
3. Create a new bucket named: `air-publisher-avatars`
4. Set it to **Public** (or configure RLS policies as needed)
5. Configure CORS if needed for direct uploads

## Features

The avatar selector component provides:

1. **Preset Avatars**: 12 pre-generated avatars using DiceBear API
2. **Upload Image**: Upload your own image file (max 5MB)
3. **Custom URL**: Enter a direct image URL
4. **Preview**: See selected avatar before submitting

## Usage

The `AvatarSelector` component is integrated into the setup form:

```tsx
<AvatarSelector value={avatarUrl} onChange={setAvatarUrl} />
```

## API Endpoint

`POST /api/profile/upload-avatar`

**Request:**
- FormData with `file` field
- File must be an image
- Max size: 5MB

**Response:**
```json
{
  "success": true,
  "url": "https://...",
  "path": "avatars/user-id/timestamp.ext"
}
```

## Preset Avatars

Uses DiceBear API for generating preset avatars:
- 12 different avatar styles
- Click to select
- Visual feedback when selected

## Styling

Matches the app's dark theme:
- Dark card backgrounds
- Primary color accents
- Border styling consistent with theme
- Hover effects and transitions


