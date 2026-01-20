# Restaurant Week Bingo - Improvement Plan

> **Context**: Comprehensive plan for building a professional, secure, and maintainable system that runs twice yearly with minimal effort. Designed for ~2 month timeline before Spring Restaurant Week, with documentation suitable for developer handoff.

---

## Table of Contents

1. [Current Setup (What's Working)](#current-setup-whats-working)
2. [Priority Levels](#priority-levels)
3. [Phase 1: Security Hardening](#phase-1-security-hardening)
4. [Phase 2: Code Quality](#phase-2-code-quality)
5. [Phase 3: Developer Experience](#phase-3-developer-experience)
6. [Phase 4: Documentation](#phase-4-documentation)
7. [Git Workflow Guide](#git-workflow-guide)
8. [Seasonal Operations Runbook](#seasonal-operations-runbook)
9. [Environment Reference](#environment-reference)

---

## Current Setup (What's Working)

Your environment separation is correctly configured:

| Component | Development | Production |
|-----------|-------------|------------|
| Git branch | `dev` | `main` |
| Vercel project | Dev deployment | Prod deployment |
| Supabase | Dev database | Prod database |
| Clerk | Dev environment (automatic) | Prod environment (automatic) |
| `forceEnableInProduction` | `true` (allows testing) | `false` (date-restricted) |

**This is a solid foundation.** The main branch has correct production settings.

---

## Priority Levels

| Level | Meaning | Timeline |
|-------|---------|----------|
| **P0 - Critical** | Security vulnerabilities. Must fix. | Week 1-2 |
| **P1 - High** | Data integrity, reliability. Should fix. | Week 3-4 |
| **P2 - Medium** | Code quality, maintainability. Good to fix. | Week 5-6 |
| **P3 - Low** | Nice-to-haves. If time permits. | Week 7-8 |

---

## Phase 1: Security Hardening

### 1.1 Add Server-Side Auth to Admin Routes (P0)

**Problem**: Admin pages check `is_admin` in the database, but don't verify the user is actually logged in via Clerk on the server. A sophisticated attacker could potentially bypass client-side checks.

**Why it matters**: Admin pages can modify user data, view all participants, and manage the raffle.

**Files to update**:
- `src/app/admin/page.tsx`
- `src/app/stats/page.tsx`

**How to fix**: Create a reusable admin auth check, then use it in both pages.

**Step 1** - Create helper function `src/lib/auth/admin-check.ts`:
```typescript
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';

export async function verifyAdmin(): Promise<{ authorized: boolean; userId: string | null }> {
  const { userId } = await auth();

  if (!userId) {
    return { authorized: false, userId: null };
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: user } = await supabase
    .from('users')
    .select('is_admin')
    .eq('id', userId)
    .single();

  return {
    authorized: user?.is_admin === true,
    userId
  };
}
```

**Step 2** - Update admin page (example pattern):
```typescript
// src/app/admin/page.tsx
import { redirect } from 'next/navigation';
import { verifyAdmin } from '@/lib/auth/admin-check';
import AdminContent from './AdminContent'; // Move current content to client component

export default async function AdminPage() {
  const { authorized } = await verifyAdmin();

  if (!authorized) {
    redirect('/');
  }

  return <AdminContent />;
}
```

**Note**: If your admin page currently uses client-side hooks (like `useState`), you'll need to split it:
- Server Component: Does auth check, renders if authorized
- Client Component: Contains the interactive UI

---

### 1.2 Fix RLS Policies (P0)

**Problem**: Your Supabase Row Level Security policies currently allow the `anon` role to read AND write all data. Since your app uses Clerk for auth (not Supabase auth), anyone who knows your Supabase URL and anon key could potentially write directly to your database.

**Current state** (in `supabase/updated_schema.sql`):
```sql
-- This allows anyone to do anything
CREATE POLICY "Allow anon full access" ON visits
  FOR ALL TO anon
  USING (true)
  WITH CHECK (true);
```

**Why it matters**: Your Supabase URL and anon key are in your frontend code (they have to be for reads). A malicious user could use these to insert fake visits or modify user data.

**The fix**: Restrict write operations to `service_role` only (which your API routes use), allow `anon` to only read.

**Step 1** - Create migration file `supabase/migrations/002_tighten_rls.sql`:
```sql
-- ============================================
-- TIGHTEN RLS POLICIES
-- ============================================
-- This migration restricts write access to service_role only.
-- The anon role (used by frontend) can only read.
-- All writes must go through API routes (which use service_role).
-- ============================================

-- Drop existing overly permissive policies
DROP POLICY IF EXISTS "Allow anon full access" ON visits;
DROP POLICY IF EXISTS "Allow anon full access" ON users;
DROP POLICY IF EXISTS "Allow anon full access" ON user_stats;

-- VISITS TABLE
-- Anyone can read visits (needed for bingo card display)
CREATE POLICY "Public read access for visits" ON visits
  FOR SELECT TO anon
  USING (true);

-- Only service_role can write (API routes)
CREATE POLICY "Service role write access for visits" ON visits
  FOR INSERT TO service_role
  WITH CHECK (true);

CREATE POLICY "Service role update access for visits" ON visits
  FOR UPDATE TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role delete access for visits" ON visits
  FOR DELETE TO service_role
  USING (true);

-- USERS TABLE
-- Anyone can read users (needed for profile display)
CREATE POLICY "Public read access for users" ON users
  FOR SELECT TO anon
  USING (true);

-- Only service_role can write
CREATE POLICY "Service role write access for users" ON users
  FOR INSERT TO service_role
  WITH CHECK (true);

CREATE POLICY "Service role update access for users" ON users
  FOR UPDATE TO service_role
  USING (true)
  WITH CHECK (true);

-- USER_STATS TABLE
-- Anyone can read stats (needed for leaderboards, etc)
CREATE POLICY "Public read access for user_stats" ON user_stats
  FOR SELECT TO anon
  USING (true);

-- Only service_role can write (trigger and API routes)
CREATE POLICY "Service role write access for user_stats" ON user_stats
  FOR INSERT TO service_role
  WITH CHECK (true);

CREATE POLICY "Service role update access for user_stats" ON user_stats
  FOR UPDATE TO service_role
  USING (true)
  WITH CHECK (true);
```

**Step 2** - Apply to dev database first:
```bash
# Connect to your dev Supabase project
# Go to Supabase Dashboard → SQL Editor → paste and run

# Or if you have direct connection string:
psql "your-dev-connection-string" -f supabase/migrations/002_tighten_rls.sql
```

**Step 3** - Test thoroughly on dev:
- Can you still sign up and create a user?
- Can you check in to a restaurant?
- Can you view the bingo card?
- Does the admin panel still work?

**Step 4** - Apply to production database.

---

### 1.3 Remove Test Endpoint from Production (P0)

**Problem**: `/api/test` exists on both branches. While low risk (only reads public data), it's unnecessary in production and exposes implementation details.

**Recommendation**: Keep it on `dev` branch only, remove from `main`.

**How to do this**:
```bash
# Switch to main branch
git checkout main

# Remove the test endpoint
rm src/app/api/test/route.ts

# Commit
git add -A
git commit -m "Remove debug endpoint from production

The /api/test endpoint is useful for development but unnecessary
in production. It remains available on the dev branch.

Co-Authored-By: Claude <noreply@anthropic.com>"

# Push
git push origin main

# Switch back to dev
git checkout dev
```

This way, dev keeps the endpoint for debugging, production doesn't have it.

---

## Phase 2: Code Quality

### 2.1 Resolve Stats Update Redundancy (P1)

**Problem**: User stats (`visit_count`, `raffle_entries`) are updated in two places:
1. A database trigger (`update_user_stats()`) that fires on visit insert
2. Application code that manually calls `incrementVisits()`

The existence of `fix-user-stats.js` script suggests these get out of sync.

**Investigation first** - Run this query on your dev database:
```sql
-- Find any users where cached stats don't match actual visit count
SELECT
  u.id,
  u.name,
  us.visit_count AS cached_count,
  COUNT(v.id) AS actual_count,
  us.visit_count - COUNT(v.id) AS drift
FROM users u
LEFT JOIN user_stats us ON u.id = us.user_id
LEFT JOIN visits v ON u.id = v.user_id
GROUP BY u.id, u.name, us.visit_count
HAVING us.visit_count IS DISTINCT FROM COUNT(v.id);
```

**If no drift found**: The trigger is working. Remove manual `incrementVisits()` calls from application code.

**If drift found**: The trigger has issues. Either fix the trigger or remove it and rely on application code.

**Recommended approach**: Trust the trigger, remove manual updates.

**File to update**: `src/lib/services/database.ts`

Find where `incrementVisits()` is called after creating a visit and remove those calls. The trigger will handle it.

---

### 2.2 Move Check-In Logic to API Route (P1)

**Problem**: The `CheckInModal.tsx` component contains business logic (restaurant lookup, duplicate detection, visit creation). This should be server-side for:
- Security (validation can't be bypassed)
- Testability (easier to write tests for API routes)
- Consistency (single source of truth)

**Create**: `src/app/api/check-in/route.ts`

```typescript
import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { DatabaseService } from '@/lib/services/database';

export async function POST(request: NextRequest) {
  try {
    // 1. Verify user is authenticated
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: 'Please sign in to check in' },
        { status: 401 }
      );
    }

    // 2. Parse and validate input
    const body = await request.json();
    const code = body.code?.trim()?.toUpperCase();

    if (!code) {
      return NextResponse.json(
        { error: 'Please enter a restaurant code' },
        { status: 400 }
      );
    }

    // 3. Find restaurant by code
    const restaurant = await DatabaseService.restaurants.getByCode(code);
    if (!restaurant) {
      return NextResponse.json(
        { error: 'Invalid code. Please check and try again.' },
        { status: 404 }
      );
    }

    // 4. Check for duplicate visit
    const existingVisits = await DatabaseService.visits.getByUser(userId);
    const alreadyVisited = existingVisits.some(v => v.restaurant_id === restaurant.id);

    if (alreadyVisited) {
      return NextResponse.json(
        {
          error: `You've already checked in at ${restaurant.name}!`,
          restaurant: restaurant.name,
          alreadyVisited: true
        },
        { status: 409 }
      );
    }

    // 5. Create visit record
    const visit = await DatabaseService.visits.create(userId, restaurant.id);
    if (!visit) {
      return NextResponse.json(
        { error: 'Failed to record visit. Please try again.' },
        { status: 500 }
      );
    }

    // 6. Get updated stats (trigger should have updated these)
    const stats = await DatabaseService.userStats.getOrCreate(userId);

    // 7. Return success with updated data
    return NextResponse.json({
      success: true,
      restaurant: restaurant.name,
      stats: {
        visitCount: stats?.visit_count ?? 1,
        raffleEntries: stats?.raffle_entries ?? 0
      }
    });

  } catch (error) {
    console.error('Check-in error:', error);
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    );
  }
}
```

**Then update `CheckInModal.tsx`** to call this API:
```typescript
const response = await fetch('/api/check-in', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ code: enteredCode })
});
const result = await response.json();
```

---

### 2.3 Add Rate Limiting (P1)

**Problem**: No rate limiting means a malicious user could spam the check-in endpoint.

**Simple solution** - Create `src/lib/rate-limit.ts`:

```typescript
// Simple in-memory rate limiter
// Note: Resets when Vercel function cold starts, but good enough for this use case

const requests = new Map<string, { count: number; resetAt: number }>();

const WINDOW_MS = 60 * 1000; // 1 minute window
const MAX_REQUESTS = 10; // 10 requests per minute per user

export function checkRateLimit(userId: string): {
  allowed: boolean;
  remaining: number;
  resetIn: number;
} {
  const now = Date.now();
  const record = requests.get(userId);

  // Clean up old entries periodically
  if (requests.size > 1000) {
    for (const [key, value] of requests) {
      if (now > value.resetAt) requests.delete(key);
    }
  }

  // No existing record or window expired
  if (!record || now > record.resetAt) {
    requests.set(userId, { count: 1, resetAt: now + WINDOW_MS });
    return { allowed: true, remaining: MAX_REQUESTS - 1, resetIn: WINDOW_MS };
  }

  // Within window, check count
  if (record.count >= MAX_REQUESTS) {
    return {
      allowed: false,
      remaining: 0,
      resetIn: record.resetAt - now
    };
  }

  // Increment and allow
  record.count++;
  return {
    allowed: true,
    remaining: MAX_REQUESTS - record.count,
    resetIn: record.resetAt - now
  };
}
```

**Add to check-in API route**:
```typescript
import { checkRateLimit } from '@/lib/rate-limit';

// At start of POST handler, after auth check:
const { allowed, resetIn } = checkRateLimit(userId);
if (!allowed) {
  return NextResponse.json(
    { error: `Too many attempts. Please wait ${Math.ceil(resetIn / 1000)} seconds.` },
    { status: 429 }
  );
}
```

---

## Phase 3: Developer Experience

### 3.1 Add Error Monitoring (P2)

**Problem**: Errors only go to console. You won't know if something breaks in production.

**Recommendation**: Sentry (free tier is generous, great Next.js integration)

```bash
npm install @sentry/nextjs
npx @sentry/wizard@latest -i nextjs
```

The wizard will:
1. Create `sentry.client.config.ts` and `sentry.server.config.ts`
2. Update `next.config.js`
3. Ask for your Sentry DSN (you'll need to create a free account)

**What you get**: Email alerts when errors occur, stack traces, user context.

---

### 3.2 Add Client-Side Caching (P2)

**Problem**: Every page load fetches all restaurants. They rarely change.

**Install SWR**:
```bash
npm install swr
```

**Create hook** `src/hooks/useRestaurants.ts`:
```typescript
import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then(res => res.json());

export function useRestaurants() {
  const { data, error, isLoading, mutate } = useSWR(
    '/api/restaurants',
    fetcher,
    {
      revalidateOnFocus: false, // Don't refetch when tab gains focus
      revalidateOnReconnect: false, // Don't refetch on reconnect
      dedupingInterval: 5 * 60 * 1000, // Cache for 5 minutes
    }
  );

  return {
    restaurants: data?.restaurants ?? [],
    sponsors: data?.sponsors ?? [],
    isLoading,
    isError: !!error,
    refresh: mutate, // Call this after check-in to refresh data
  };
}
```

**Benefits**: Faster page loads, fewer API calls, automatic caching.

---

### 3.3 Extract Configuration Constants (P2)

**Problem**: Magic numbers scattered throughout code (e.g., "4 restaurants = 1 raffle entry").

**Add to** `src/config/restaurant-week.ts`:

```typescript
export const GAME_CONFIG = {
  /** Number of restaurant visits required for one raffle entry */
  RESTAURANTS_PER_RAFFLE_ENTRY: 4,

  /** Rate limiting: max check-in attempts per minute */
  MAX_CHECKINS_PER_MINUTE: 10,

  /** Fuzzy match threshold for import scripts (0-1) */
  FUZZY_MATCH_THRESHOLD: 0.65,
} as const;
```

Then import and use instead of hardcoded values:
```typescript
import { GAME_CONFIG } from '@/config/restaurant-week';

const raffleEntries = Math.floor(visitCount / GAME_CONFIG.RESTAURANTS_PER_RAFFLE_ENTRY);
```

---

## Phase 4: Documentation

### 4.1 Create Operations Runbook (P2)

Create `docs/OPERATIONS.md` - See [Seasonal Operations Runbook](#seasonal-operations-runbook) section below.

### 4.2 Create Environment Setup Guide (P2)

Create `docs/ENVIRONMENT_SETUP.md` - See [Environment Reference](#environment-reference) section below.

### 4.3 Update README (P3)

Ensure `README.md` includes:
- Project overview
- Quick start for new developers
- Links to other docs
- Architecture diagram (can be simple ASCII)

---

## Git Workflow Guide

### Branch Strategy

```
main (production)
  │
  └── dev (development/testing)
        │
        └── feature/xyz (optional, for larger changes)
```

### Daily Workflow

**For small fixes and changes**:
```bash
# Make sure you're on dev
git checkout dev
git pull origin dev

# Make changes, test locally
# ...

# Commit
git add .
git commit -m "Fix: description of what you fixed"

# Push to dev (triggers Vercel dev deployment)
git push origin dev

# Test on dev deployment
# When satisfied, merge to main
git checkout main
git pull origin main
git merge dev
git push origin main

# Go back to dev for next changes
git checkout dev
```

**For larger features** (optional):
```bash
# Create feature branch from dev
git checkout dev
git pull origin dev
git checkout -b feature/new-thing

# Work on feature...
git commit -m "Add: new feature part 1"
git commit -m "Add: new feature part 2"

# When done, merge to dev
git checkout dev
git merge feature/new-thing
git push origin dev

# Test on dev, then merge to main as above

# Clean up
git branch -d feature/new-thing
```

### Golden Rules

1. **Never push directly to main** - Always go through dev first
2. **Test on dev deployment** before merging to main
3. **Pull before you push** - Avoid merge conflicts
4. **Commit often** - Small, focused commits are easier to understand and revert

### If Things Go Wrong

**Undo last commit (before push)**:
```bash
git reset --soft HEAD~1
# Your changes are still there, just uncommitted
```

**Revert a pushed commit**:
```bash
git revert <commit-hash>
git push
# Creates a new commit that undoes the bad one
```

**Dev is broken, main is fine**:
```bash
git checkout dev
git reset --hard origin/main
git push --force origin dev
# Dev now matches main exactly
```

---

## Seasonal Operations Runbook

### 4-6 Weeks Before Restaurant Week

#### Update Event Configuration

**File**: `src/config/restaurant-week.ts` (on `dev` branch first)

```typescript
export const RESTAURANT_WEEK_CONFIG = {
  startDate: '2026-04-15', // Update to new date
  // ...
  messages: {
    title: "Spring Restaurant Week Coming Soon!",
    beforeStart: "Restaurant Week check-ins will be available starting April 15, 2026...",
    // Update messaging
  }
}
```

#### Import New Restaurant Data

1. Get updated restaurant list from Chamber of Commerce
2. Generate template if needed:
   ```bash
   node scripts/generate-restaurant-template-interactive.js
   ```
3. Fill in template with new data
4. Run import on dev database:
   ```bash
   node scripts/smart-import-restaurants.js
   ```
5. Verify on dev site
6. Run import on prod database (select "production" when prompted)

#### Import/Update Sponsors

Same process as restaurants:
```bash
node scripts/generate-sponsor-template-interactive.js
# Fill template
node scripts/smart-import-sponsors.js
```

### 1 Week Before Restaurant Week

#### Final Testing Checklist

- [ ] Visit dev site, create test account
- [ ] Check in to a restaurant (should work due to `forceEnableInProduction: true` on dev)
- [ ] Verify bingo card updates
- [ ] Verify raffle entries calculate correctly
- [ ] Test on mobile device
- [ ] Check admin panel functions
- [ ] View stats page

#### Merge to Production

```bash
git checkout main
git pull origin main
git merge dev
git push origin main
```

#### Verify Production

- [ ] Visit production site
- [ ] Confirm check-in is blocked (shows countdown)
- [ ] Confirm date in countdown is correct
- [ ] Spot check restaurant list

### During Restaurant Week

#### Monitor

- Check Sentry (if installed) for errors
- Spot check stats periodically
- Be available for user support

#### Common Issues

**User can't check in**:
1. Is Restaurant Week active? (Check date)
2. Are they signed in?
3. Is the code correct? (Case shouldn't matter)
4. Have they already checked in there?

**Stats seem wrong**:
```bash
# Run consistency check
node scripts/check-db-consistency.js

# If issues found, fix with
node scripts/fix-user-stats.js
```

### After Restaurant Week

#### Run Raffle

```bash
node scripts/raffle-draw.js
```

#### Backup Data

```bash
node scripts/backup-database.js
```

#### Post-Event Cleanup (Optional)

Consider whether to:
- Keep user data for next event (recommended - returning users)
- Archive/export for records
- Reset test data from dev environment

---

## Environment Reference

### Required Environment Variables

#### Supabase

| Variable | Where | Description |
|----------|-------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Vercel + Local | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Vercel + Local | Public/anon key (safe for frontend) |
| `SUPABASE_SERVICE_ROLE_KEY` | Vercel only | Secret admin key (NEVER in frontend) |

**Get these from**: Supabase Dashboard → Settings → API

#### Clerk

| Variable | Where | Description |
|----------|-------|-------------|
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Vercel + Local | Public key for frontend |
| `CLERK_SECRET_KEY` | Vercel only | Secret key for backend |

**Get these from**: Clerk Dashboard → API Keys

**Note**: Clerk automatically uses different keys for development vs production based on the key prefix (`pk_test_` vs `pk_live_`).

#### Application

| Variable | Where | Description |
|----------|-------|-------------|
| `NEXT_PUBLIC_DEV_HOSTNAME` | Dev Vercel only | Hostname of dev deployment (enables testing) |

### Vercel Project Setup

**Production Project**:
- Connected to `main` branch
- Uses production Supabase URL/keys
- Uses production Clerk keys
- `NEXT_PUBLIC_DEV_HOSTNAME` not set

**Development Project**:
- Connected to `dev` branch
- Uses development Supabase URL/keys
- Uses development Clerk keys
- `NEXT_PUBLIC_DEV_HOSTNAME` = the dev deployment URL (e.g., `resto-bingo-dev.vercel.app`)

### Local Development

Copy `.env.local.example` to `.env.local` and fill in dev values:

```bash
cp .env.local.example .env.local
```

Then edit `.env.local` with your dev Supabase and Clerk credentials.

---

## Checklist Summary

### Before Spring Restaurant Week

#### Phase 1 - Security (Week 1-2)
- [ ] 1.1 Add server-side auth to admin pages
- [ ] 1.2 Apply RLS migration to dev, test, then apply to prod
- [ ] 1.3 Remove test endpoint from main branch

#### Phase 2 - Code Quality (Week 3-4)
- [ ] 2.1 Investigate stats redundancy, remove manual updates or fix trigger
- [ ] 2.2 Create check-in API route, update modal to use it
- [ ] 2.3 Add rate limiting

#### Phase 3 - Developer Experience (Week 5-6)
- [ ] 3.1 Set up Sentry error monitoring
- [ ] 3.2 Add SWR caching
- [ ] 3.3 Extract config constants

#### Phase 4 - Documentation (Week 7-8)
- [ ] 4.1 Finalize this improvement plan
- [ ] 4.2 Create/update OPERATIONS.md
- [ ] 4.3 Create/update ENVIRONMENT_SETUP.md
- [ ] 4.4 Update README with quick start

#### Pre-Launch (1 week before)
- [ ] Update event date in config
- [ ] Import updated restaurant/sponsor data
- [ ] Full testing on dev
- [ ] Merge to main
- [ ] Verify production

---

## Questions to Discuss

1. **RLS approach**: I recommend Option B (tighten RLS). It's more secure and you have time. Thoughts?

2. **Error monitoring**: Sentry is my recommendation. Are you open to setting up a free account?

3. **Stats redundancy**: Need to investigate whether trigger is working. Can you run the consistency query on your dev database?

4. **Test endpoint**: I suggest keeping it on dev only. Any reason you'd want it in production?

---

*Document created: 2026-01-16*
*Last updated: 2026-01-16*