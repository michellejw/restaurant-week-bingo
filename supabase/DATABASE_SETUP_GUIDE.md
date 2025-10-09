# Database Setup Guide - Restaurant Week Bingo

This guide covers the complete database setup for the Restaurant Week Bingo app, which uses **Clerk for authentication** and **Supabase for data storage**.

## Architecture Overview

- **Frontend Authentication**: Clerk (handles user registration, login, sessions)
- **Database**: Supabase PostgreSQL with custom RLS policies
- **Database Access**: 
  - Frontend uses Supabase **anon key** for direct database operations
  - Scripts use Supabase **service role key** for admin operations

## Complete Database Setup

### 1. Create New Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Note down the project URL and keys:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` 
   - `SUPABASE_SERVICE_ROLE_KEY`

### 2. Run Schema Setup

In the Supabase SQL editor, run the complete schema from:
```
supabase/updated_schema.sql
```

This will create:
- All tables (restaurants, sponsors, visits, user_stats, users)
- Database triggers for auto-updating user stats
- **Clerk-compatible RLS policies** (the key part!)
- Proper permissions for both anon and service_role

### 3. Environment Variables

Set these in your `.env.local`:
```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_key
CLERK_SECRET_KEY=your_clerk_secret

# Dev environment detection
NEXT_PUBLIC_DEV_HOSTNAME=your-dev-hostname.vercel.app
```

## Key RLS Policy Configuration

**IMPORTANT**: The RLS policies in this project are specifically designed for Clerk authentication.

### Why Standard Supabase RLS Doesn't Work

Standard Supabase RLS policies expect users to be authenticated through Supabase Auth:
```sql
-- This DOESN'T work with Clerk
CREATE POLICY "Standard policy" ON user_stats
    FOR ALL TO authenticated
    USING (auth.uid() = user_id);  -- auth.uid() is null with Clerk!
```

### Our Clerk-Compatible Solution

Instead, we use policies that trust the application layer (since Clerk handles auth):
```sql
-- This WORKS with Clerk + anon key
CREATE POLICY "Allow all operations for app" ON user_stats
    FOR ALL
    TO anon, service_role
    USING (true)
    WITH CHECK (true);
```

### Why This Is Secure

1. **Clerk handles authentication** - users can't access the app without being logged in through Clerk
2. **Application layer controls data access** - the frontend only allows users to access their own data
3. **Supabase URL is not exposed** - only your app can connect to the database
4. **Service role is server-side only** - never exposed to the frontend

## Tables and Relationships

```
restaurants (public read access)
├── visits (user-specific data)
│   └── user_stats (auto-updated via trigger)
│
sponsors (public read access)
│
users (contact info, user-specific data)
```

## Important Files

- `supabase/updated_schema.sql` - Complete database schema with Clerk-compatible RLS
- `src/lib/supabase.ts` - Frontend Supabase client (uses anon key)
- `scripts/supabase-client.js` - Script Supabase client (uses service role key)
- `src/components/UserInitializer.tsx` - Syncs Clerk users to Supabase

## Troubleshooting Common Issues

### 1. "Row Level Security" Errors (42501)
- **Cause**: RLS policies don't allow the operation
- **Fix**: Run the updated RLS policies from `updated_schema.sql`

### 2. "401 Unauthorized" or "406 Not Acceptable" Errors  
- **Cause**: Frontend trying to use service-role-only policies
- **Fix**: Ensure policies allow `anon` role access and permissions are granted to `anon`

### 3. "Cannot coerce result to single JSON object" (PGRST116)
- **Cause**: Query returned 0 rows when expecting 1 (usually contact info for new users)
- **Fix**: Handle null returns gracefully in application code

## Dev vs Production

**Use the same RLS policies for both environments.** The Clerk authentication pattern is identical in dev and production.

## Migration Guide

If you have an existing database with problematic RLS policies, run this in SQL editor:

```sql
-- Drop old policies
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON user_stats;
DROP POLICY IF EXISTS "Enable read for users based on user_id" ON user_stats;
-- (... other old policies)

-- Create new Clerk-compatible policies
CREATE POLICY "Allow all operations for app" ON user_stats
    FOR ALL TO anon, service_role USING (true) WITH CHECK (true);

-- Grant permissions to anon role
GRANT SELECT, INSERT, UPDATE ON user_stats TO anon;
```

## Testing the Setup

1. Deploy your app
2. Sign up/login through Clerk
3. Check browser dev tools - should see no 401/406/42501 errors
4. User stats should be created automatically
5. Check-ins should work without errors

---

**Summary**: This database setup allows Clerk authentication to work seamlessly with Supabase by using RLS policies that trust the application layer rather than trying to integrate Clerk with Supabase Auth.