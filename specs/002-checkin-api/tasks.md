# Tasks: Check-In API Route

**Input**: Design documents from `/specs/002-checkin-api/`
**Prerequisites**: plan.md, spec.md, contracts/

**Tests**: Manual verification per spec.md verification approach

**Organization**: Tasks grouped by implementation phase.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task relates to

---

## Phase 1: Setup

**Purpose**: Create directory structure and prepare for implementation.

- [x] T001 Create `src/app/api/check-in/` directory
- [x] T002 Create `src/lib/rate-limit.ts` file (empty placeholder)

**Checkpoint**: Directory structure ready

---

## Phase 2: Rate Limiter (US5)

**Purpose**: Implement rate limiting utility before API needs it.

**Independent Test**:
- Call checkRateLimit 10 times rapidly → all return allowed: true
- Call 11th time → returns allowed: false

- [x] T003 [US5] Implement `checkRateLimit()` function in `src/lib/rate-limit.ts` per contract
- [x] T004 [US5] Add cleanup logic for stale entries (prevent memory leak)

**Checkpoint**: Rate limiter ready for use

---

## Phase 3: API Route (US1, US2, US3, US4)

**Purpose**: Create the check-in API endpoint with all business logic.

**Independent Test**:
- curl with valid code → 200
- curl with invalid code → 404
- curl without auth → 401
- curl with duplicate → 409

### Implementation

- [x] T005 [US4] Add auth check using Clerk `auth()` - return 401 if not authenticated
- [x] T006 [US5] Add rate limiting check - return 429 if exceeded
- [x] T007 [US3] Parse and validate request body - return 400 if code empty
- [x] T008 [US3] Look up restaurant by code (case-insensitive) - return 404 if not found
- [x] T009 [US2] Check for existing visit - return 409 if already visited
- [x] T010 [US1] Create visit record on successful check-in
- [x] T011 [US1] Fetch updated user stats after visit creation
- [x] T012 [US1] Return success response with restaurant name and stats
- [x] T013 Add error handling for database failures - return 500

**Checkpoint**: API endpoint fully functional

---

## Phase 4: Update Modal (US1, US2, US3)

**Purpose**: Replace direct DatabaseService calls with API calls.

**Independent Test**:
- Check in via UI → success message appears
- Check in with invalid code → error message appears
- Check in duplicate → error message appears

- [x] T014 [US1] Replace business logic in `handleSubmit()` with fetch to `/api/check-in`
- [x] T015 [US1] Handle 200 success response - show success message
- [x] T016 [US3] Handle 400/404 error responses - show error message
- [x] T017 [US2] Handle 409 conflict response - show "already visited" message
- [x] T018 [US4] Handle 401 response - prompt sign in (edge case)
- [x] T019 [US5] Handle 429 response - show rate limit message
- [x] T020 Remove unused DatabaseService imports from CheckInModal

**Checkpoint**: Modal uses API instead of direct DB access

---

## Phase 5: Verification

**Purpose**: Test all scenarios and confirm feature works end-to-end.

- [x] T021 Test: Valid check-in returns 200 with restaurant name
- [x] T022 Test: Invalid code returns 404 with error message
- [x] T023 Test: Duplicate visit returns 409 with error message
- [x] T024 Test: Unauthenticated request returns 401
- [x] T025 Test: Rate limiting blocks after 10 requests/minute (code verified, manual test skipped)
- [x] T026 Test: Full UI flow - sign in, check in, see bingo card update
- [x] T027 Test: Stats update correctly after check-in

---

## Dependencies & Execution Order

```
Phase 1: Setup
    ↓
Phase 2: Rate Limiter (T003-T004)
    ↓
Phase 3: API Route (T005-T013)
    ↓
Phase 4: Update Modal (T014-T020)
    ↓
Phase 5: Verification (T021-T027)
```

### Parallel Opportunities

- T003 and T004 can run in parallel (same file, different functions)
- T005-T013 are sequential (building up the API handler)
- T014-T020 are mostly sequential (modifying same function)
- T021-T027 can run in any order (independent tests)

---

## Summary

| Metric | Count |
|--------|-------|
| **Total Tasks** | 27 |
| **Phase 1 (Setup)** | 2 |
| **Phase 2 (Rate Limiter)** | 2 |
| **Phase 3 (API Route)** | 9 |
| **Phase 4 (Modal Update)** | 7 |
| **Phase 5 (Verification)** | 7 |

| User Story | Tasks |
|------------|-------|
| US1 (Successful Check-In) | T010, T011, T012, T014, T015 |
| US2 (Duplicate Prevention) | T009, T017 |
| US3 (Invalid Code) | T007, T008, T016 |
| US4 (Auth Required) | T005, T018 |
| US5 (Rate Limiting) | T003, T004, T006, T019 |
