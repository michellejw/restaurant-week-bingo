# Quickstart: Client-Side Data Caching

**Feature**: 004-data-caching
**Date**: 2026-02-01

## Prerequisites

- Node.js 18+
- Existing restaurant-week-bingo project running locally
- Understanding of React hooks

## Installation

```bash
npm install swr
```

## Key Files

After implementation, these files will be added/modified:

| File | Action | Purpose |
|------|--------|---------|
| `src/lib/swr/config.ts` | **New** | SWR configuration, cache keys, global settings |
| `src/hooks/useRestaurants.ts` | **New** | SWR hook for restaurant data |
| `src/hooks/useUserStats.ts` | **Modified** | Refactor to use SWR |
| `src/app/layout.tsx` | **Modified** | Add SWRConfig provider |
| `src/app/page.tsx` | **Modified** | Use new hooks |
| `src/components/CheckInModal.tsx` | **Modified** | Invalidate cache after check-in |

## Usage Examples

### Basic Data Fetching

```typescript
// In any component
import { useRestaurants } from '@/hooks/useRestaurants';

function MyComponent() {
  const { restaurants, sponsors, isLoading, error } = useRestaurants();

  if (isLoading) return <Spinner />;
  if (error) return <Error message={error.message} />;

  return <RestaurantList restaurants={restaurants} />;
}
```

### Accessing User Stats

```typescript
import { useUserStats } from '@/hooks/useUserStats';

function StatsDisplay() {
  const { stats, loading, error, refresh } = useUserStats();

  return (
    <div>
      <p>Visits: {stats.visit_count}</p>
      <p>Raffle Entries: {stats.raffle_entries}</p>
    </div>
  );
}
```

### Invalidating Cache After Mutation

```typescript
import { mutate } from 'swr';
import { CACHE_KEYS } from '@/lib/swr/config';

async function handleCheckIn(restaurantCode: string, userId: string) {
  const result = await fetch('/api/check-in', {
    method: 'POST',
    body: JSON.stringify({ code: restaurantCode }),
  });

  if (result.ok) {
    // Invalidate both caches - SWR will refetch automatically
    mutate(CACHE_KEYS.userStats(userId));
    mutate(CACHE_KEYS.restaurantsWithVisits(userId));
  }
}
```

## Verification Steps

After implementation, verify:

1. **Cache Hit Test**:
   - Load home page (restaurants load)
   - Navigate to /my-info
   - Navigate back to home
   - ✅ Restaurants appear instantly (no loading spinner)

2. **Check-in Refresh Test**:
   - Note current visit count
   - Check in at a restaurant
   - ✅ Visit count updates without page refresh
   - ✅ Restaurant shows as visited

3. **Network Tab Test**:
   - Open browser DevTools > Network
   - Navigate between pages multiple times
   - ✅ Only one `/api/restaurants` request per session (not per navigation)

4. **Offline Test**:
   - Load home page
   - Set browser to offline (DevTools > Network > Offline)
   - Navigate to another page and back
   - ✅ Cached data still displays

## Troubleshooting

### Data not updating after check-in
- Ensure `mutate()` is called with the correct cache key
- Check that the cache key includes the userId

### Cache not shared between components
- Ensure `SWRConfig` wraps the entire app in `layout.tsx`
- Verify cache keys are identical (use `CACHE_KEYS` constants)

### Stale data persisting too long
- Check `revalidateOnFocus` is enabled in SWR config
- Manually call `mutate(key)` to force refresh
