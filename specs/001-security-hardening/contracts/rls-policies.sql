-- ============================================
-- RLS POLICY CONTRACT: Security Hardening
-- ============================================
-- Branch: 001-security-hardening
-- Date: 2026-01-16
--
-- This migration tightens Row Level Security policies to:
-- - Allow anon role SELECT only (read operations)
-- - Restrict INSERT/UPDATE/DELETE to service_role only
--
-- IMPORTANT: Apply to DEV database first, test thoroughly,
-- then apply to PRODUCTION database.
-- ============================================

-- ============================================
-- VISITS TABLE
-- ============================================

-- Drop existing overly permissive policy
DROP POLICY IF EXISTS "Allow anon full access" ON visits;

-- Allow anyone to read visits (needed for bingo card display)
CREATE POLICY "Public read access for visits" ON visits
  FOR SELECT TO anon
  USING (true);

-- Only service_role can insert visits (via API routes)
CREATE POLICY "Service role insert for visits" ON visits
  FOR INSERT TO service_role
  WITH CHECK (true);

-- Only service_role can update visits (if needed)
CREATE POLICY "Service role update for visits" ON visits
  FOR UPDATE TO service_role
  USING (true)
  WITH CHECK (true);

-- Only service_role can delete visits (admin cleanup)
CREATE POLICY "Service role delete for visits" ON visits
  FOR DELETE TO service_role
  USING (true);

-- ============================================
-- USERS TABLE
-- ============================================

-- Drop existing overly permissive policy
DROP POLICY IF EXISTS "Allow anon full access" ON users;

-- Allow anyone to read users (needed for profile display)
CREATE POLICY "Public read access for users" ON users
  FOR SELECT TO anon
  USING (true);

-- Only service_role can insert users (via UserInitializer)
CREATE POLICY "Service role insert for users" ON users
  FOR INSERT TO service_role
  WITH CHECK (true);

-- Only service_role can update users (via my-info page)
CREATE POLICY "Service role update for users" ON users
  FOR UPDATE TO service_role
  USING (true)
  WITH CHECK (true);

-- Note: No delete policy for users (data retention)

-- ============================================
-- USER_STATS TABLE
-- ============================================

-- Drop existing overly permissive policy
DROP POLICY IF EXISTS "Allow anon full access" ON user_stats;

-- Allow anyone to read stats (needed for dashboard display)
CREATE POLICY "Public read access for user_stats" ON user_stats
  FOR SELECT TO anon
  USING (true);

-- Only service_role can insert stats (via UserInitializer or trigger)
CREATE POLICY "Service role insert for user_stats" ON user_stats
  FOR INSERT TO service_role
  WITH CHECK (true);

-- Only service_role can update stats (via trigger or fix scripts)
CREATE POLICY "Service role update for user_stats" ON user_stats
  FOR UPDATE TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================
-- VERIFICATION QUERIES
-- ============================================
-- Run these after applying migration to verify policies

-- Check policies exist
-- SELECT tablename, policyname, permissive, roles, cmd
-- FROM pg_policies
-- WHERE schemaname = 'public'
--   AND tablename IN ('visits', 'users', 'user_stats')
-- ORDER BY tablename, policyname;

-- Expected output:
-- visits     | Public read access for visits      | PERMISSIVE | {anon}         | SELECT
-- visits     | Service role insert for visits     | PERMISSIVE | {service_role} | INSERT
-- visits     | Service role update for visits     | PERMISSIVE | {service_role} | UPDATE
-- visits     | Service role delete for visits     | PERMISSIVE | {service_role} | DELETE
-- users      | Public read access for users       | PERMISSIVE | {anon}         | SELECT
-- users      | Service role insert for users      | PERMISSIVE | {service_role} | INSERT
-- users      | Service role update for users      | PERMISSIVE | {service_role} | UPDATE
-- user_stats | Public read access for user_stats  | PERMISSIVE | {anon}         | SELECT
-- user_stats | Service role insert for user_stats | PERMISSIVE | {service_role} | INSERT
-- user_stats | Service role update for user_stats | PERMISSIVE | {service_role} | UPDATE