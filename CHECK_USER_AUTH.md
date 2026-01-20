# Check User Authentication in Supabase

## ✅ User Credentials

**Email:** `alyanmr738@gmail.com`  
**Password:** `12345679`

---

## 🔍 How to Check User in Supabase Dashboard

### Step 1: Go to Authentication

1. **Open**: https://supabase.com/dashboard/project/pezvnqhexxttlhcnbtta/auth/users
2. **Look for**: `alyanmr738@gmail.com` in the users list

### Step 2: Verify User Details

Check:
- ✅ **Email**: `alyanmr738@gmail.com`
- ✅ **Email Confirmed**: Should be `true` (green checkmark)
- ✅ **Created At**: Should show when account was created
- ✅ **Last Sign In**: Should show recent login time

### Step 3: Test Login

1. **Go to**: http://localhost:3000/login
2. **Enter**:
   - Email: `alyanmr738@gmail.com`
   - Password: `12345679`
3. **Click**: "Sign In"
4. **Should redirect to**: `/dashboard`

---

## 🐛 If User Doesn't Exist

### Option 1: Create User via Supabase Dashboard

1. **Go to**: https://supabase.com/dashboard/project/pezvnqhexxttlhcnbtta/auth/users
2. **Click**: "Add user" or "Invite user"
3. **Enter**:
   - Email: `alyanmr738@gmail.com`
   - Password: `12345679`
   - Auto Confirm: ✅ (check this box)
4. **Click**: "Create user"

### Option 2: Create User via Sign Up Page

1. **Go to**: http://localhost:3000/signup
2. **Enter**:
   - Email: `alyanmr738@gmail.com`
   - Password: `12345679`
3. **Click**: "Sign Up"
4. **If email confirmation is required**:
   - Check Supabase dashboard for confirmation email
   - Or disable email confirmation in Supabase settings

---

## 🔧 Disable Email Confirmation (Optional)

If you want users to sign in immediately without email confirmation:

1. **Go to**: https://supabase.com/dashboard/project/pezvnqhexxttlhcnbtta/auth/providers
2. **Find**: "Email" provider
3. **Click**: "Configure"
4. **Uncheck**: "Confirm email" (or set to "Off")
5. **Save**

---

## ✅ Verify Authentication Status

After logging in, check:

1. **Browser Console** (F12):
   - Should see: `User signed in successfully: [user-id]`
   - Should see: `Session exists: true`

2. **Supabase Dashboard**:
   - Go to: https://supabase.com/dashboard/project/pezvnqhexxttlhcnbtta/auth/users
   - Find `alyanmr738@gmail.com`
   - Check "Last Sign In" is recent

3. **App**:
   - Should redirect to `/dashboard`
   - Should show user profile/creator profile
   - Should not redirect back to `/login`

---

## 🆘 Troubleshooting

### "Invalid login credentials"
- **Fix**: Check password is exactly `12345679` (no spaces)
- **Fix**: Check email is exactly `alyanmr738@gmail.com` (lowercase)

### "Email not confirmed"
- **Fix**: Go to Supabase dashboard → Auth → Users → Find user → Click "Confirm email" button
- **Or**: Disable email confirmation in Auth settings

### "User not found"
- **Fix**: Create user via Supabase dashboard (see Option 1 above)

### Redirects back to login
- **Fix**: Check middleware is working
- **Fix**: Check session is being created
- **Fix**: Check browser cookies are enabled

---

**Quick Test**: Try logging in at http://localhost:3000/login with the credentials above!


