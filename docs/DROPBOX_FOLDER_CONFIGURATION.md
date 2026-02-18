# Dropbox Folder Configuration

## Default Structure

By default, videos are stored in:
```
/AIR Publisher/
  ├── creator_{creator_id_1}/
  ├── creator_{creator_id_2}/
  └── ...
```

## Customize Base Folder

You can change the base folder name by adding to `.env.local`:

```env
DROPBOX_BASE_FOLDER=Your Company Name
```

This will create:
```
/Your Company Name/
  ├── creator_{creator_id_1}/
  ├── creator_{creator_id_2}/
  └── ...
```

## Use Existing Dropbox Folder

If you want to use an **existing folder** in your Dropbox:

### Option 1: Use Folder Name
Set `DROPBOX_BASE_FOLDER` to match your existing folder name:
```env
DROPBOX_BASE_FOLDER=My Videos
```

### Option 2: Use Full Path
If you need a specific path structure, you can modify the code in:
- `lib/dropbox/client.ts` → `getCreatorDropboxFolder()` function

Example:
```typescript
export function getCreatorDropboxFolder(creatorUniqueIdentifier: string): string {
  const baseFolder = process.env.DROPBOX_BASE_FOLDER || 'AIR Publisher'
  // Custom path structure
  return `/${baseFolder}/creators/${creatorUniqueIdentifier}/videos`
}
```

## Folder Creation

- The base folder (`/AIR Publisher/` or your custom name) will be created automatically on first upload
- Each creator's subfolder is created automatically when they upload their first video
- If folders already exist, the system will use them (no error)

## Current Configuration

Check your current base folder by looking at:
- `.env.local` → `DROPBOX_BASE_FOLDER` (if set)
- Default: `AIR Publisher`

## Examples

### Example 1: Default
```env
# No DROPBOX_BASE_FOLDER set
# Creates: /AIR Publisher/creator_123/
```

### Example 2: Custom Company Name
```env
DROPBOX_BASE_FOLDER=MyCompany Videos
# Creates: /MyCompany Videos/creator_123/
```

### Example 3: Use Existing Folder
```env
DROPBOX_BASE_FOLDER=Content Library
# Uses existing: /Content Library/creator_123/
```

---

**Note:** The folder must be accessible by the Dropbox account that connected to AIR Publisher. If using a team/company Dropbox, make sure the connected account has access to the base folder.






