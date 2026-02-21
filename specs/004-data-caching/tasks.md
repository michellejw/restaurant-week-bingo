# Tasks: Client-Side Data Caching

**Input**: Design documents from `/specs/004-data-caching/`
**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, quickstart.md

**Tests**: No automated tests requested. Manual verification via quickstart.md.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup

**Purpose**: Install SWR and create base configuration

- [x] T001 Install SWR dependency via `npm install swr`
- [x] T002 [P] Create SWR config and cache keys in `src/lib/swr/config.ts`
- [x] T003 [P] Add SWRConfig provider wrapper in `src/app/layout.tsx`

---

## Phase 2: Foundational (Core Hooks)

**Purpose**: Create the SWR-based hooks that all user stories depend on

**⚠️ CRITICAL**: User story phases cannot begin until these hooks exist

- [x] T004 Create `useRestaurants` hook with SWR in `src/hooks/useRestaurants.ts`
- [x] T005 Refactor `useUserStats` hook to use SWR in `src/hooks/useUserStats.ts`

**Checkpoint**: Hooks ready - user story implementation can now begin

---

## Phase 3: User Story 1 - Instant Page Loads (Priority: P1) 🎯 MVP

**Goal**: Cached data appears instantly when navigating between pages

**Independent Test**: Navigate home → /my-info → home. Restaurants appear immediately on return (no spinner).

### Implementation for User Story 1

- [x] T006 [US1] Update `src/app/page.tsx` to use `useRestaurants` hook instead of inline fetch
- [x] T007 [US1] Update `src/components/BingoCard.tsx` to use cached restaurant data from parent
- [x] T008 [US1] Remove redundant data fetching from `src/app/page.tsx` useEffect

**Checkpoint**: User Story 1 complete - navigate between pages to verify instant data display

---

## Phase 4: User Story 2 - Auto-Refresh After Check-In (Priority: P2)

**Goal**: Stats and visited status update automatically after check-in succeeds

**Independent Test**: Check in at a restaurant. Visit count and bingo card update without page refresh.

### Implementation for User Story 2

- [x] T009 [US2] Add cache invalidation to `src/components/CheckInModal.tsx` after successful check-in
- [x] T010 [US2] Ensure `useRestaurants` hook receives mutate function for cache refresh
- [x] T011 [US2] Verify stats update in `src/app/page.tsx` after check-in via `useUserStats` refresh

**Checkpoint**: User Story 2 complete - check-in flow refreshes data automatically

---

## Phase 5: User Story 3 - Graceful Network Handling (Priority: P3)

**Goal**: App remains usable with cached data during network issues; auto-retry on reconnect

**Independent Test**: Load app, go offline, navigate. Cached data still displays. Reconnect and data refreshes.

### Implementation for User Story 3

- [x] T012 [US3] Configure error retry with exponential backoff in `src/lib/swr/config.ts`
- [x] T013 [US3] Add `revalidateOnReconnect: true` to SWR config for auto-refresh on network restore
- [x] T014 [US3] Ensure hooks return cached data even when `error` is present

**Checkpoint**: User Story 3 complete - app works gracefully offline with cached data

---

## Phase 6: Polish & Verification

**Purpose**: Final validation and cleanup

- [x] T015 Run quickstart.md verification steps (Cache Hit Test, Check-in Refresh Test, Network Tab Test, Offline Test)
- [x] T016 Remove debug console.log statements from `src/lib/services/database.ts` userStats methods
- [x] T017 Update feature status in `docs/ROADMAP.md` to mark 004-data-caching complete

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on T001-T003 completion - BLOCKS all user stories
- **User Stories (Phases 3-5)**: All depend on Foundational phase completion
  - User stories can proceed in priority order (P1 → P2 → P3)
  - Or in parallel if desired (different concerns, minimal overlap)
- **Polish (Phase 6)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational - No dependencies on other stories
- **User Story 2 (P2)**: Can start after Foundational - Integrates with US1 components but independently testable
- **User Story 3 (P3)**: Can start after Foundational - Configuration only, independently testable

### Within Each Phase

- T002 and T003 can run in parallel (different files)
- T006, T007, T008 must be sequential (same file dependencies)
- T012, T013, T014 can run in parallel (T012/T013 same file, but T014 is verification)

---

## Parallel Opportunities

### Phase 1 Parallel Tasks
```bash
# Can run together:
T002: Create SWR config in src/lib/swr/config.ts
T003: Add SWRConfig provider in src/app/layout.tsx
```

### User Story Independence
```bash
# After Foundational phase, all user stories can proceed in parallel:
# - US1: Focuses on page.tsx and BingoCard.tsx
# - US2: Focuses on CheckInModal.tsx
# - US3: Focuses on config refinement
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001-T003)
2. Complete Phase 2: Foundational (T004-T005)
3. Complete Phase 3: User Story 1 (T006-T008)
4. **STOP and VALIDATE**: Test navigation caching independently
5. Can deploy - core performance improvement delivered

### Incremental Delivery

1. Setup + Foundational → Hooks ready
2. Add User Story 1 → Test → **MVP delivered** (instant page loads)
3. Add User Story 2 → Test → Check-in refresh works
4. Add User Story 3 → Test → Offline resilience added
5. Each story adds value without breaking previous stories

---

## Notes

- No new API routes needed - uses existing `/api/restaurants` endpoint
- Existing `useUserStats` hook is refactored, not replaced - same return interface
- SWR handles deduplication, retry, and revalidation automatically
- Cache keys are centralized in `src/lib/swr/config.ts` for maintainability
- Manual testing per quickstart.md verification steps
