# Research: Client-Side Data Caching

**Feature**: 004-data-caching
**Date**: 2026-02-01

## Decision 1: Caching Library Selection

**Decision**: Use SWR (stale-while-revalidate) by Vercel

**Rationale**:
- Built by Vercel, designed specifically for Next.js/React applications
- Lightweight (~4KB gzipped) vs alternatives like React Query (~13KB)
- Stale-while-revalidate pattern matches spec requirements exactly (show cached, revalidate in background)
- Built-in request deduplication (FR-008)
- Built-in error retry with exponential backoff (FR-005)
- Simple API - single `useSWR` hook covers most use cases
- Already proven in production Next.js applications

**Alternatives Considered**:

| Library | Size | Pros | Cons | Verdict |
|---------|------|------|------|---------|
| SWR | ~4KB | Vercel-native, simple API, lightweight | Less features than React Query | ✅ Selected |
| React Query (TanStack Query) | ~13KB | More features, better devtools | Overkill for this project, larger bundle | Rejected |
| RTK Query | ~15KB+ | Good if already using Redux | Not using Redux, adds complexity | Rejected |
| Custom useState/useEffect | 0KB | No dependency | Must implement caching, dedup, retry manually | Rejected |

## Decision 2: Cache Key Strategy

**Decision**: Use hierarchical string keys with user context where needed

**Rationale**:
- Restaurant data is global (same for all users) → key: `'restaurants'`
- User stats are user-specific → key: `['user-stats', userId]`
- Visited status is per-user but bundled with restaurants → key: `['restaurants', userId]` when user is logged in
- Simple string keys are debuggable and easy to invalidate

**Cache Key Patterns**:
```typescript
// Global data (cached regardless of user)
const CACHE_KEYS = {
  restaurants: 'restaurants',           // All restaurant data
  sponsors: 'sponsors',                 // All sponsor data
} as const;

// User-specific data (includes userId in key)
const userCacheKey = (userId: string) => ({
  stats: ['user-stats', userId],        // User's visit count, raffle entries
  restaurantsWithVisits: ['restaurants', userId],  // Restaurants + visited status
});
```

## Decision 3: Cache Duration / Revalidation Strategy

**Decision**: Use "revalidate on focus" + manual invalidation after mutations

**Rationale**:
- Restaurant data changes rarely (admin-only updates) → long cache OK
- User stats only change on check-in → invalidate manually after check-in succeeds
- "Revalidate on focus" ensures fresh data when user returns to app
- No need for polling/intervals given the update patterns

**Configuration**:
```typescript
const swrConfig = {
  revalidateOnFocus: true,       // Refresh when tab regains focus
  revalidateOnReconnect: true,   // Refresh when network reconnects
  dedupingInterval: 5000,        // Dedupe requests within 5 seconds
  errorRetryCount: 3,            // Retry failed requests 3 times
  errorRetryInterval: 1000,      // Start with 1s delay, exponential backoff
};
```

## Decision 4: SWR Provider Placement

**Decision**: Add SWRConfig provider in root layout

**Rationale**:
- Global configuration applies to all hooks
- Cache is shared across all components automatically
- Single place to configure error handling, retry logic
- Provider must wrap components that use SWR hooks

**Implementation Location**: `src/app/layout.tsx` will wrap children in `<SWRConfig>`.

## Decision 5: Handling Auth State Transitions

**Decision**: Clear cache on logout, re-fetch on login using Clerk's auth state

**Rationale**:
- When user logs out, user-specific cached data must be cleared (security)
- When user logs in, fresh data should be fetched with new user context
- SWR's `mutate` function with `undefined` clears specific cache entries
- Can use Clerk's `useUser` hook to detect auth changes

**Implementation**:
```typescript
// On logout: clear user-specific caches
mutate(['user-stats', oldUserId], undefined, false);
mutate(['restaurants', oldUserId], undefined, false);

// On login: SWR will automatically fetch with new userId in key
// (key change triggers new fetch)
```

## Decision 6: Error Handling Strategy

**Decision**: Use SWR's built-in error retry + surface errors via hook return value

**Rationale**:
- SWR retries automatically with exponential backoff (FR-005)
- Errors are returned from hook, not thrown (React-friendly)
- Components can show cached data while displaying error indicator
- Matches spec requirement for graceful degradation (User Story 3)

**Error States**:
- `isLoading: true` - First load, no cached data
- `error: Error` - Request failed (but may still have stale `data`)
- `isValidating: true` - Background refresh in progress

## Integration Points

### Existing Code to Modify

1. **`src/hooks/useUserStats.ts`**
   - Replace useState/useEffect with `useSWR`
   - Keep same return interface for compatibility

2. **`src/app/page.tsx`**
   - Replace inline data fetching with `useRestaurants` hook
   - Pass `mutate` function to CheckInModal for cache invalidation

3. **`src/components/CheckInModal.tsx`**
   - After successful check-in, call `mutate` to refresh both restaurants and stats

4. **`src/app/layout.tsx`**
   - Wrap app in `SWRConfig` provider

### New Files to Create

1. **`src/lib/swr/config.ts`** - SWR configuration and cache keys
2. **`src/hooks/useRestaurants.ts`** - SWR hook for restaurant data

## References

- [SWR Documentation](https://swr.vercel.app/)
- [SWR with Next.js App Router](https://swr.vercel.app/docs/with-nextjs)
- [Cache Invalidation Patterns](https://swr.vercel.app/docs/mutation)
