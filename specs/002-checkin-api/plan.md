# Implementation Plan: Check-In API Route

**Branch**: `002-checkin-api` | **Date**: 2026-01-20 | **Spec**: [spec.md](./spec.md)

## Summary

This plan moves check-in business logic from `CheckInModal.tsx` (client-side) to a new `/api/check-in` route (server-side). This improves security by ensuring validation can't be bypassed and enables rate limiting.

## Technical Context

**Language/Version**: TypeScript 5.x with Next.js 15 (App Router)
**Primary Dependencies**: @clerk/nextjs (auth), @supabase/supabase-js (database), React 19
**Storage**: PostgreSQL via Supabase (with Row Level Security)
**Testing**: Manual verification
**Target Platform**: Vercel (serverless)

## Constitution Check

| Principle | Requirement | Status | Notes |
|-----------|-------------|--------|-------|
| I. Security First | Auth verified server-side before mutations | ✅ PASS | This feature IMPLEMENTS this |
| I. Security First | Input validation server-side | ✅ PASS | API validates code input |
| I. Security First | Rate limiting on public endpoints | ✅ PASS | US5 adds rate limiting |
| II. Server-Side Logic | Check-in validation in API routes | ✅ PASS | This feature IMPLEMENTS this |
| II. Server-Side Logic | Data mutations through API routes | ✅ PASS | Visit creation moves to API |
| III. Environment Separation | Test on dev before main | ✅ PASS | Standard workflow |
| IV. Documentation | Changes documented | ✅ PASS | Spec + plan documents |

**Gate Result**: PASS - This feature directly implements Constitution principles I and II.

## Current State Analysis

### Business Logic to Move (from CheckInModal.tsx lines 42-76)

```typescript
// Currently in client component - MUST move to API:
1. Get all restaurants to find matching code
2. Check if already visited
3. Create the visit record
4. Return success/error
```

### What Stays in CheckInModal.tsx

- UI rendering (form, success message, error display)
- Restaurant Week date checking (can stay client-side - it's just UX)
- Local state management (code input, loading, error, success)
- Dev environment detection (for testing override banner)

### Existing Infrastructure to Reuse

- `DatabaseService.restaurants.getByCode(code)` - Already does case-insensitive lookup
- `DatabaseService.visits.checkExists(userId, restaurantId)` - Duplicate check
- `DatabaseService.visits.create(userId, restaurantId)` - Creates visit
- `DatabaseService.userStats.getOrCreate(userId)` - Gets updated stats
- Database trigger `update_user_stats()` - Auto-updates stats on visit insert

## Project Structure

### New Files

```text
src/
├── app/
│   └── api/
│       └── check-in/
│           └── route.ts        # NEW: Check-in API endpoint
└── lib/
    └── rate-limit.ts           # NEW: Rate limiting utility
```

### Modified Files

```text
src/
└── components/
    └── CheckInModal.tsx        # MODIFY: Replace direct DB calls with API call
```

### Contracts

```text
specs/002-checkin-api/
└── contracts/
    ├── check-in-api.ts         # API request/response types
    └── rate-limit.ts           # Rate limiter interface
```

## API Design

### Endpoint: POST /api/check-in

**Request**:
```typescript
{
  code: string  // Restaurant code (case-insensitive)
}
```

**Response (200 - Success)**:
```typescript
{
  success: true,
  restaurant: string,      // Restaurant name
  stats: {
    visitCount: number,
    raffleEntries: number
  }
}
```

**Response (400 - Bad Request)**:
```typescript
{ error: "Please enter a restaurant code" }
```

**Response (401 - Unauthorized)**:
```typescript
{ error: "Please sign in to check in" }
```

**Response (404 - Not Found)**:
```typescript
{ error: "Invalid code. Please check and try again." }
```

**Response (409 - Conflict)**:
```typescript
{
  error: "You've already checked in at {restaurant}!",
  restaurant: string,
  alreadyVisited: true
}
```

**Response (429 - Rate Limited)**:
```typescript
{
  error: "Too many attempts. Please wait {seconds} seconds.",
  retryAfter: number
}
```

**Response (500 - Server Error)**:
```typescript
{ error: "Something went wrong. Please try again." }
```

## Implementation Phases

### Phase 1: Setup
- Create directory structure
- Create contract files

### Phase 2: Rate Limiter
- Implement in-memory rate limiting utility
- Configure: 10 requests per minute per user

### Phase 3: API Route
- Create `/api/check-in/route.ts`
- Implement auth check (Clerk)
- Implement rate limiting
- Implement business logic (restaurant lookup, duplicate check, visit creation)
- Return appropriate responses

### Phase 4: Update Modal
- Replace `DatabaseService` calls with `fetch('/api/check-in')`
- Handle all response types
- Maintain existing UI behavior

### Phase 5: Verification
- Test all scenarios from spec
- Verify rate limiting works
- Confirm stats update correctly

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Stats not updating after API change | Low | Medium | Database trigger handles this; API just reads final stats |
| Rate limiter resets on cold start | Medium | Low | Acceptable for this use case; prevents sustained abuse |
| Breaking existing check-in flow | Medium | High | Keep modal structure; only change data fetching |

## Dependencies

- Phase 2 (Rate Limiter) can run in parallel with Phase 1
- Phase 3 (API Route) depends on Phase 2
- Phase 4 (Modal Update) depends on Phase 3
- Phase 5 (Verification) depends on Phase 4
