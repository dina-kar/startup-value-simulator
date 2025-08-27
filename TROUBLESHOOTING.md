# Troubleshooting Guide

## Common Issues and Solutions

### 1. "Supabase error: {}" - Empty Error Object

This usually means the database tables don't exist or there's a connection issue.

**Solutions:**
1. Check your `.env.local` file has the correct Supabase credentials
2. Run the database setup: `npm run setup:db`
3. If tables don't exist, go to Supabase dashboard → SQL Editor and run the SQL from `database/setup.sql`

### 2. "Failed to save scenario: An unexpected error occurred"

This indicates a database operation failed.

**Solutions:**
1. Check if you're logged in (try logging out and back in)
2. Verify database tables exist: `npm run setup:db`
3. Check Supabase dashboard → Authentication → Users to see if your user exists
4. Check browser console for more detailed error messages

### 3. ESOP Field Won't Accept Zero Value

This was a UI issue where entering "0" in the ESOP pool size field wouldn't work.

**Solution:** Fixed in the latest version. The input now properly handles zero values.

### 4. Authentication Issues

**Symptoms:**
- "User not authenticated" errors
- Redirected to login page unexpectedly
- Can't save scenarios

**Solutions:**
1. Log out and log back in
2. Clear browser cookies/localStorage for your app
3. Check Supabase dashboard → Authentication settings
4. Verify redirect URLs are configured correctly

### 5. Database Connection Issues

**Symptoms:**
- "Connection refused" errors
- "Project not found" errors

**Solutions:**
1. Verify `NEXT_PUBLIC_SUPABASE_URL` in `.env.local`
2. Verify `NEXT_PUBLIC_SUPABASE_ANON_KEY` in `.env.local`
3. Check if Supabase project is active (not paused)
4. Restart development server: `npm run dev`

### 6. Permission Denied Errors

**Symptoms:**
- Can authenticate but can't read/write data
- "Permission denied" in console

**Solutions:**
1. Check Row Level Security policies in Supabase dashboard
2. Ensure policies allow authenticated users to access their own data
3. Run the complete SQL setup from `database/setup.sql`

## Debugging Steps

### Step 1: Check Environment Variables
```bash
# Check if variables are set
echo $NEXT_PUBLIC_SUPABASE_URL
echo $NEXT_PUBLIC_SUPABASE_ANON_KEY
```

### Step 2: Test Database Connection
```bash
npm run setup:db
```

### Step 3: Check Browser Console
1. Open developer tools (F12)
2. Go to Console tab
3. Look for error messages when the issue occurs
4. Check Network tab for failed requests

### Step 4: Check Supabase Dashboard
1. Go to your Supabase project dashboard
2. Check Authentication → Users (should see your user)
3. Check Database → Tables (should see `scenarios` and `shared_scenarios`)
4. Check API → Logs for any error messages

## Getting More Help

If you're still having issues:

1. Check the browser console for specific error messages
2. Check Supabase dashboard logs
3. Verify all environment variables are correct
4. Try creating a fresh Supabase project and running through setup again

## Reset Everything

If nothing else works, you can start fresh:

1. Delete `.env.local`
2. Create new Supabase project
3. Follow `SUPABASE_SETUP.md` from the beginning
4. Run `npm run setup:db` to verify setup
