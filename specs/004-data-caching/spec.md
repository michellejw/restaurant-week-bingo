# Feature Specification: Client-Side Data Caching

**Feature Branch**: `004-data-caching`
**Created**: 2026-02-01
**Status**: Complete
**Input**: User description: "SWR-based client-side caching for restaurants and user stats"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Instant Page Loads After First Visit (Priority: P1)

When a user navigates between pages (e.g., from the bingo card to settings and back), they should see their data immediately without waiting for network requests. The app should feel snappy and responsive, showing cached data while silently revalidating in the background.

**Why this priority**: This is the core value proposition. Users currently experience loading states every time they navigate, which feels slow during active restaurant week usage when they're checking their bingo card frequently.

**Independent Test**: Can be tested by navigating between pages and observing that restaurant data and user stats appear instantly on subsequent visits.

**Acceptance Scenarios**:

1. **Given** a user has visited the home page and loaded restaurant data, **When** they navigate away and return, **Then** restaurant data appears immediately (within 100ms) without a loading spinner
2. **Given** a user has loaded their stats, **When** they navigate to another page and return, **Then** their stats appear immediately without a loading state
3. **Given** cached data exists, **When** the page loads, **Then** stale data is shown immediately while fresh data is fetched in the background

---

### User Story 2 - Automatic Data Refresh After Check-In (Priority: P2)

After a user checks in at a restaurant, their bingo card and stats should update automatically across all views without requiring a manual page refresh. The check-in confirmation should trigger a cache invalidation so the user sees their new visit reflected everywhere.

**Why this priority**: Without this, users would see stale data after checking in, which would be confusing and might make them think the check-in failed.

**Independent Test**: Can be tested by performing a check-in and verifying that stats update immediately on the current page and persist when navigating.

**Acceptance Scenarios**:

1. **Given** a user completes a check-in, **When** the check-in succeeds, **Then** their visit count and raffle entries update immediately without a page refresh
2. **Given** a user checks in on the home page, **When** they navigate to view their stats elsewhere, **Then** the updated stats are reflected immediately

---

### User Story 3 - Graceful Handling of Network Issues (Priority: P3)

When the network is slow or temporarily unavailable, users should still be able to view their cached data. Error states should be informative but not alarming, and the app should automatically retry when connectivity is restored.

**Why this priority**: Restaurant week happens in downtown areas with varying connectivity. Users shouldn't be blocked from viewing their progress due to brief network hiccups.

**Independent Test**: Can be tested by simulating offline mode and verifying cached data remains visible.

**Acceptance Scenarios**:

1. **Given** a user has cached data and loses network connectivity, **When** they view their bingo card, **Then** they see their previously cached restaurants and visit status
2. **Given** a network request fails, **When** connectivity is restored, **Then** the app automatically retries and updates the display

---

### Edge Cases

- What happens when a user logs in for the first time (no cached data exists)? → Normal loading state, then cache is populated
- What happens when cached data is extremely stale (e.g., from a previous restaurant week)? → Revalidate immediately on app load; stale data shown briefly while fresh data loads
- What happens if the background revalidation returns different data? → UI updates smoothly without jarring changes
- What happens during concurrent check-ins (user rapidly checking in at multiple restaurants)? → Each check-in should properly invalidate and refetch; race conditions should not cause data loss

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST cache restaurant data on the client after initial fetch
- **FR-002**: System MUST cache user stats (visit count, raffle entries) on the client after initial fetch
- **FR-003**: System MUST display cached data immediately when available, while revalidating in the background
- **FR-004**: System MUST invalidate relevant caches after a successful check-in operation
- **FR-005**: System MUST automatically retry failed requests with exponential backoff
- **FR-006**: System MUST share cached data across components that need the same data (no duplicate requests)
- **FR-007**: System MUST handle the transition from logged-out to logged-in state (cache should be user-specific for stats)
- **FR-008**: System SHOULD deduplicate concurrent requests for the same data

### Key Entities

- **Restaurant Data**: List of restaurants with their details (name, location, category) and visited status for the current user
- **User Stats**: Current user's visit count and raffle entry count
- **Cache Keys**: Identifiers that determine when cached data should be shared vs. isolated (e.g., user-specific vs. global)

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Subsequent page loads display data within 100ms when cached data exists (vs. current 500ms+ network delay)
- **SC-002**: Number of API requests to `/api/restaurants` reduced by at least 50% during a typical user session (navigating between 5+ pages)
- **SC-003**: User stats update within 1 second after a successful check-in without manual refresh
- **SC-004**: App remains usable (shows cached data) during brief network outages of up to 30 seconds

## Assumptions

- Restaurant data changes infrequently (only when admins update the database), so caching for several minutes is acceptable
- User stats only change when the user checks in, so cache invalidation can be triggered explicitly
- The existing `useUserStats` hook will be replaced or refactored to use the caching solution
- The existing `/api/restaurants` endpoint will continue to serve restaurant data (no backend changes required)