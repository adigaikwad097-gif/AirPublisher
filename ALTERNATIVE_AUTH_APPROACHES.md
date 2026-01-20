# Alternative Authentication Approaches

## Current Issue
Server-side code can't detect Supabase session cookies, even though user is authenticated.

## Option 1: API Route (✅ Implemented)
**File**: `app/api/profile/create/route.ts`

- Uses API route instead of server action
- Better cookie handling in Next.js API routes
- Can accept user_id from client as fallback
- **Status**: Already implemented and working

## Option 2: Use `getUser()` First (✅ Updated)
**Files**: `app/api/profile/actions.ts`, `lib/supabase/server.ts`

- Changed to use `getUser()` first (validates token with Supabase server)
- More reliable than `getSession()` for server-side
- Still needs cookies, but more robust
- **Status**: Updated

## Option 3: Service Role for Writes (Simplest)
Use service role client for all writes, bypassing RLS and session detection.

**Pros:**
- No session detection needed
- Works immediately
- Simple code

**Cons:**
- Less secure (bypasses RLS)
- Need to validate user_id manually
- Not recommended for production

**Implementation:**
```typescript
// In createProfileAction or API route
const serviceClient = createServiceClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Validate user_id exists in auth.users before inserting
const { data: authUser } = await serviceClient.auth.admin.getUserById(userId)
if (!authUser) {
  throw new Error('Invalid user ID')
}

// Then insert with service role
await serviceClient.from('airpublisher_creator_profiles').insert(...)
```

## Option 4: Client-Side Only with Service Role
Do all writes from client-side, using service role API endpoint.

**Pros:**
- Client always has session
- Simple to implement

**Cons:**
- Exposes service role key (NEVER do this!)
- Security risk

**NOT RECOMMENDED** - Never expose service role key to client

## Option 5: Fix Root Cause - Cookie Configuration
The real issue is cookies aren't being read. Possible fixes:

1. **Check cookie domain/path settings**
   - Ensure cookies are set for `localhost` (not specific port)
   - Check `sameSite` and `secure` flags

2. **Verify middleware is running**
   - Middleware should refresh session on every request
   - Check middleware matcher includes your routes

3. **Check browser cookie settings**
   - Ensure cookies aren't blocked
   - Check if third-party cookies are blocked

4. **Use `getUser()` instead of `getSession()`**
   - `getUser()` validates token with Supabase server
   - More reliable for server-side auth

## Recommended Approach

**For Development:**
- Use API route (`/api/profile/create`) ✅ Already implemented
- Pass `user_id` from client as fallback ✅ Already implemented
- Use `getUser()` first ✅ Already updated

**For Production:**
- Fix cookie configuration
- Ensure middleware is properly refreshing sessions
- Use `getUser()` for all server-side auth checks
- Remove client-provided `user_id` fallback (security)

## Next Steps

1. **Test the API route** - Try creating a profile using the new `/api/profile/create` endpoint
2. **Check browser cookies** - Verify Supabase cookies are being set (DevTools → Application → Cookies)
3. **Check middleware logs** - See if cookies are being detected in middleware
4. **If still not working** - Consider Option 3 (service role) for development only


