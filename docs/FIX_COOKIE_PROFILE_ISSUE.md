# Fix: Cookie Causing Wrong Profile to Show

## 🔴 Problem

No matter what email you sign in with, you see "Alyan Raheel" (the first user's profile). This happens because:

1. **Cookie persists across sessions**: The `creator_profile_id` cookie is set with `httpOnly: true` and persists even after signing out
2. **No validation**: The cookie was checked first without validating it belongs to the current user
3. **Cookie priority**: The code checked the cookie BEFORE checking the current user's ID

## ✅ Fix Applied

### 1. **Validate Cookie Against Current User** (`lib/db/creator.ts`)

Changed the priority order:
- **Before**: Check cookie → Return profile (even if wrong user)
- **After**: Get current user → Check cookie → **Validate cookie profile belongs to current user** → If not, clear cookie and search by user ID

Key change:
```typescript
// CRITICAL: Validate that this profile belongs to the current user
const userPrefix = user.id.slice(0, 8)
if (data.unique_identifier.includes(userPrefix) || data.unique_identifier.includes(user.id)) {
  // Profile belongs to current user - return it
} else {
  // Profile doesn't belong to current user - clear cookie and search by user ID
  cookieStore.delete('creator_profile_id')
}
```

### 2. **Clear Cookie on Sign Out** (`components/dashboard/sidebar.tsx`)

Added API route `/api/auth/clear-profile-cookie` to clear the `httpOnly` cookie when user signs out.

### 3. **New Priority Order**

1. **Priority 1**: Use provided `unique_identifier` (from query param)
2. **Priority 2**: Get current authenticated user (REQUIRED for validation)
3. **Priority 3**: Check cookie, but **validate it belongs to current user**
4. **Priority 4**: Find profile by user ID pattern

## 🧪 Testing

1. **Clear browser cookies** (to remove old cookie)
2. **Sign in with alyanmr738@gmail.com** → Should see "Alyan Raheel" (if profile exists)
3. **Sign out**
4. **Sign in with a different email** → Should NOT see "Alyan Raheel"
   - If no profile exists → Should redirect to `/setup`
   - If profile exists → Should see that user's profile

## 🔍 How It Works Now

1. **User signs in** → Supabase Auth creates session
2. **`getCurrentCreator()` called**:
   - Gets current user from Supabase Auth
   - Checks cookie for profile ID
   - **Validates cookie profile belongs to current user** (by checking if `unique_identifier` contains user ID)
   - If cookie is invalid → Clears it and searches by user ID
   - If no profile found → Returns `null` (user redirected to `/setup`)
3. **User signs out** → Cookie is cleared via API route

## ⚠️ Important Notes

- **Cookie validation is critical**: Even if cookie persists, it's validated against current user
- **Cookie is cleared on sign out**: Prevents cross-user profile leakage
- **No more fallbacks**: Code will NOT return a random profile if user's profile isn't found

---

**If you still see the wrong profile:**
1. Clear browser cookies manually
2. Sign out and sign in again
3. Check browser console for profile lookup logs
4. Verify your profile exists in Supabase: `creator_profiles` table






