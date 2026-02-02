# Implementation Plan: Client-Side Data Caching

**Branch**: `004-data-caching` | **Date**: 2026-02-01 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/004-data-caching/spec.md`

## Summary

Add client-side data caching using SWR to eliminate redundant API calls and provide instant page loads when navigating between views. The caching layer will wrap existing data fetching for restaurants and user stats, with automatic cache invalidation after check-ins.

## Technical Context

**Language/Version**: TypeScript 5.x with Next.js 15 (App Router)
**Primary Dependencies**: SWR (stale-while-revalidate), existing @supabase/supabase-js, @clerk/nextjs
**Storage**: Client-side memory cache (SWR default); no persistent storage needed
**Testing**: Manual testing (no test framework currently configured)
**Target Platform**: Web (modern browsers, mobile responsive)
**Project Type**: Web application (Next.js App Router)
**Performance Goals**: <100ms for cached data display; background revalidation transparent to user
**Constraints**: Must work with Clerk auth context; cache must be user-aware for stats
**Scale/Scope**: ~40 restaurants, ~500 concurrent users during restaurant week events

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Security First | ✅ Pass | No security changes; caching is read-only client-side layer |
| II. Server-Side Business Logic | ✅ Pass | Business logic remains in API routes; caching only affects data fetching |
| III. Environment Separation | ✅ Pass | No environment-specific changes; SWR works identically in dev/prod |
| IV. Documentation & Maintainability | ✅ Pass | Will document cache keys and invalidation patterns |

**Gate Result**: PASS - No violations. Proceed to Phase 0.

## Project Structure

### Documentation (this feature)

```text
specs/004-data-caching/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output (N/A - no new API contracts)
└── tasks.md             # Phase 2 output
```

### Source Code (repository root)

```text
src/
├── app/
│   ├── page.tsx              # Will use useRestaurants hook
│   └── my-info/page.tsx      # Will use cached user data
├── components/
│   ├── BingoCard.tsx         # Will use useRestaurants hook
│   └── CheckInModal.tsx      # Will trigger cache invalidation
├── hooks/
│   ├── useUserStats.ts       # REFACTOR: Replace with SWR-based hook
│   ├── useRestaurants.ts     # NEW: SWR hook for restaurant data
│   └── useUser.ts            # Unchanged
└── lib/
    ├── services/
    │   └── database.ts       # Unchanged - still provides fetcher functions
    └── swr/
        └── config.ts         # NEW: SWR provider configuration
```

**Structure Decision**: Hooks-based approach in existing `src/hooks/` directory. New SWR configuration in `src/lib/swr/`. No new API routes needed - existing `/api/restaurants` endpoint serves data.

## Complexity Tracking

> No violations to justify - plan uses minimal additions to existing structure.
