# Security Fix: User Impersonation Vulnerability

## Issue Found

**Location**: `app/api/profile/actions.ts`

**Problem**: The `createProfileAction` function was accepting `user_id` from the client and using it if the server couldn't detect a session. This allowed user impersonation.

## Vulnerability

```typescript
// ❌ VULNERABLE CODE (before fix)
let userId = user?.id || profile.user_id || null  // Accepts client-provided user_id!

// In development mode, it would use client-provided user_id
if (profile.user_id) {
  userId = profile.user_id  // ⚠️ SECURITY RISK!
}
```

**Attack Scenario**:
1. Attacker sends request with `user_id: "victim-user-id"`
2. Server accepts it (in development mode)
3. Attacker creates profile for victim's account
4. **User impersonation successful!**

## Fix Applied

**Solution**: Removed client-provided `user_id` parameter and always use authenticated user ID from session.

```typescript
// ✅ SECURE CODE (after fix)
// SECURITY: Always use authenticated user ID from session - NEVER trust client-provided user_id
const userId = user?.id || null

if (!userId) {
  throw new Error('Unauthorized: Please sign in...')
}
```

## Security Principles

1. **Never trust client-provided user IDs** - Always validate from server session
2. **Always authenticate** - Require valid session for all user operations
3. **Fail securely** - If no session, reject the request (don't accept client data)

## What Changed

- ✅ Removed `user_id` parameter from `createProfileAction` function signature
- ✅ Removed all code that accepts client-provided `user_id`
- ✅ Now only uses authenticated user ID from `supabase.auth.getUser()`
- ✅ Rejects requests if no authenticated session exists

## Impact

- **Before**: Could create profiles for other users (in development mode)
- **After**: Can only create profile for authenticated user
- **Breaking Change**: Clients can no longer pass `user_id` parameter (this is intentional for security)

## Testing

After this fix:
- ✅ Users can only create profiles for themselves
- ✅ Unauthenticated requests are rejected
- ✅ No user impersonation possible


