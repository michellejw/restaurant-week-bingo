# Quickstart: Security Hardening Verification

**Branch**: `001-security-hardening`
**Date**: 2026-01-16

This guide walks through verifying that the security hardening changes work correctly.

## Prerequisites

- Access to Supabase dashboard (dev project)
- Access to Vercel deployments (dev and prod)
- A test user account (non-admin)
- An admin user account (is_admin = true)

## Verification Steps

### 1. Verify RLS Policies (Database)

After applying `contracts/rls-policies.sql` to your dev database:

#### 1.1 Check Policies Exist

In Supabase SQL Editor, run:
```sql
SELECT tablename, policyname, permissive, roles, cmd
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('visits', 'users', 'user_stats')
ORDER BY tablename, policyname;
```

**Expected**: See policies listed for anon (SELECT only) and service_role (all operations).

#### 1.2 Test Anon Write Rejection

Using the Supabase client with your **anon key** (from frontend):

```javascript
// This should FAIL
const { error } = await supabase
  .from('visits')
  .insert({ user_id: 'test', restaurant_id: 1 });

console.log(error); // Should show permission denied
```

**Expected**: Error message indicating INSERT not allowed.

#### 1.3 Test Read Still Works

```javascript
// This should SUCCEED
const { data, error } = await supabase
  .from('restaurants')
  .select('*')
  .limit(1);

console.log(data); // Should return restaurant data
```

**Expected**: Returns data, no error.

### 2. Verify Admin Auth (Application)

#### 2.1 Test Unauthenticated Access

1. Open an incognito/private browser window
2. Navigate directly to `https://your-dev-site.vercel.app/admin`
3. **Expected**: Redirected to home page

#### 2.2 Test Non-Admin Access

1. Sign in with a non-admin test account
2. Navigate directly to `https://your-dev-site.vercel.app/admin`
3. **Expected**: Redirected to home page

#### 2.3 Test Admin Access

1. Sign in with an admin account
2. Navigate to `https://your-dev-site.vercel.app/admin`
3. **Expected**: Admin page renders correctly
4. Navigate to `https://your-dev-site.vercel.app/stats`
5. **Expected**: Stats page renders correctly

### 3. Verify Test Endpoint (Branch Difference)

#### 3.1 On Development Deployment

```bash
curl https://your-dev-site.vercel.app/api/test
```

**Expected**: Returns JSON with test data (200 OK)

#### 3.2 On Production Deployment (after main branch update)

```bash
curl https://your-prod-site.vercel.app/api/test
```

**Expected**: Returns 404 Not Found

### 4. Regression Test (Full User Flow)

Complete this flow on the dev deployment:

1. [ ] Sign up as new user (or use existing test account)
2. [ ] View home page - bingo card should load
3. [ ] Check in to a restaurant (if Restaurant Week active or dev override on)
4. [ ] Verify bingo card updates
5. [ ] View /my-info page - should be able to update profile
6. [ ] Sign out
7. [ ] Sign in as admin
8. [ ] View /admin page - should see admin interface
9. [ ] View /stats page - should see statistics

**All steps should work normally.** Any failures indicate a regression.

## Troubleshooting

### "Permission denied" on legitimate operations

- Ensure API routes use `SUPABASE_SERVICE_ROLE_KEY`, not anon key
- Check that the service role key env var is set in Vercel

### Admin page still accessible to non-admins

- Verify `verifyAdmin()` is being called in page.tsx
- Check database: `SELECT id, is_admin FROM users WHERE id = '<user_id>'`
- Ensure redirect is happening (check for redirect import)

### Test endpoint not returning 404 on production

- Verify the file was deleted on main branch: `git show main:src/app/api/test/route.ts`
- Check Vercel deployment uses main branch
- May need to redeploy production

## Rollback Plan

If critical issues are found:

### RLS Rollback
```sql
-- Restore permissive policies (TEMPORARY - reapply fix ASAP)
DROP POLICY IF EXISTS "Public read access for visits" ON visits;
DROP POLICY IF EXISTS "Service role insert for visits" ON visits;
-- ... (repeat for all new policies)

CREATE POLICY "Allow anon full access" ON visits
  FOR ALL TO anon USING (true) WITH CHECK (true);
-- ... (repeat for users, user_stats)
```

### Code Rollback
```bash
git revert <commit-hash>
git push origin dev
```

## Sign-Off

After completing all verification steps:

- [ ] RLS policies verified working
- [ ] Admin auth verified working
- [ ] Test endpoint verified (dev: works, prod: 404)
- [ ] Regression test passed
- [ ] Ready for production deployment