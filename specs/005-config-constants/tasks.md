# Tasks: Centralized Game Configuration

**Input**: Design documents from `/specs/005-config-constants/`
**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, quickstart.md

**Tests**: No automated tests requested. Manual verification via quickstart.md.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup

**Purpose**: Add GAME_CONFIG to the existing configuration file

- [x] T001 Add `GAME_CONFIG` export with raffle and rateLimit sections to `src/config/restaurant-week.ts`

**Details for T001**:
- Add after `RESTAURANT_WEEK_CONFIG` export
- Include `raffle.restaurantsPerEntry: 4` with SQL trigger warning comment
- Include `rateLimit.maxRequestsPerWindow: 10` and `rateLimit.windowMs: 60_000`
- Use `as const` for type safety
- Follow structure from data-model.md

---

## Phase 2: User Story 1 - Developer Changes Game Rules (Priority: P1) 🎯 MVP

**Goal**: Centralize raffle configuration so developers can change game rules in one place

**Independent Test**: Open `src/config/restaurant-week.ts`, find `GAME_CONFIG.raffle.restaurantsPerEntry` with clear SQL warning comment.

### Implementation for User Story 1

- [x] T002 [US1] Verify `GAME_CONFIG.raffle.restaurantsPerEntry` has SQL trigger warning comment in `src/config/restaurant-week.ts`

**Checkpoint**: User Story 1 complete - raffle config is centralized with proper documentation

---

## Phase 3: User Story 2 - Developer Adjusts Rate Limiting (Priority: P2)

**Goal**: Rate limiter reads settings from centralized config instead of local constants

**Independent Test**: Change `GAME_CONFIG.rateLimit.maxRequestsPerWindow` to 5, verify rate limiter uses new value.

### Implementation for User Story 2

- [x] T003 [US2] Update `src/lib/rate-limit.ts` to import `GAME_CONFIG` from `@/config/restaurant-week`
- [x] T004 [US2] Replace local `MAX_REQUESTS` constant with `GAME_CONFIG.rateLimit.maxRequestsPerWindow` in `src/lib/rate-limit.ts`
- [x] T005 [US2] Replace local `WINDOW_MS` constant with `GAME_CONFIG.rateLimit.windowMs` in `src/lib/rate-limit.ts`
- [x] T006 [US2] Remove unused local constant definitions from `src/lib/rate-limit.ts`

**Checkpoint**: User Story 2 complete - rate limiter uses centralized config

---

## Phase 4: User Story 3 - User Sees Accurate Instructions (Priority: P3)

**Goal**: How-to-play page interpolates raffle threshold from config

**Independent Test**: Change `GAME_CONFIG.raffle.restaurantsPerEntry` to 5, verify how-to-play shows "Every 5 check-ins".

### Implementation for User Story 3

- [x] T007 [US3] Import `GAME_CONFIG` in `src/app/how-to-play/page.tsx`
- [x] T008 [US3] Replace hardcoded "4" in instructions text with `GAME_CONFIG.raffle.restaurantsPerEntry` in `src/app/how-to-play/page.tsx`

**Checkpoint**: User Story 3 complete - how-to-play page uses config value

---

## Phase 5: Polish & Verification

**Purpose**: Final validation and cleanup

- [x] T009 Run `npm run build` to verify TypeScript compiles without errors
- [x] T010 Run quickstart.md verification steps (Config Import Check, Rate Limiter Test, Config Discoverability, How-to-Play Text, No Duplicate Definitions)
- [x] T011 Update `docs/ROADMAP.md` to mark 005-config-constants complete

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - creates GAME_CONFIG
- **User Story 1 (Phase 2)**: Depends on T001 - verifies raffle config documentation
- **User Story 2 (Phase 3)**: Depends on T001 - updates rate limiter to use config
- **User Story 3 (Phase 4)**: Depends on T001 - updates how-to-play page
- **Polish (Phase 5)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Setup - No dependencies on other stories
- **User Story 2 (P2)**: Can start after Setup - Independent of US1
- **User Story 3 (P3)**: Can start after Setup - Independent of US1/US2

### Within Each Phase

- T003-T006 must be sequential (modifying same file)
- T007-T008 must be sequential (modifying same file)

---

## Parallel Opportunities

### After Setup (T001) completes:

```bash
# User stories can proceed in parallel (different files):
US1: T002 (verifies config file)
US2: T003-T006 (modifies rate-limit.ts)
US3: T007-T008 (modifies how-to-play/page.tsx)
```

---

## Implementation Strategy

### MVP First (User Story 1 + 2)

1. Complete T001: Add GAME_CONFIG
2. Complete T002: Verify raffle config documentation
3. Complete T003-T006: Update rate limiter
4. **STOP and VALIDATE**: Rate limiting works with centralized config
5. Can deploy - core centralization delivered

### Full Implementation

1. Setup (T001) → Config exists
2. User Story 1 (T002) → Raffle config documented
3. User Story 2 (T003-T006) → Rate limiter uses config
4. User Story 3 (T007-T008) → How-to-play uses config
5. Polish (T009-T011) → Verified and documented

---

## Notes

- No new files created - all modifications to existing files
- `MAX_ENTRIES = 1000` stays in rate-limit.ts (implementation detail, not game config)
- SQL trigger sync is documented, not enforced at runtime
- Manual testing per quickstart.md (no automated tests)
