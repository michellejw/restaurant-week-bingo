# Tasks: Security Hardening

**Input**: Design documents from `/specs/001-security-hardening/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: No automated tests - verification via manual testing per quickstart.md

**Organization**: Tasks grouped by user story for independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project structure already exists. Minimal setup needed.

- [x] T001 Create feature branch `001-security-hardening` from `dev`
- [x] T002 Create `src/lib/auth/` directory for auth utilities

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core auth infrastructure that MUST be complete before user story implementations

**CRITICAL**: No user story work can begin until this phase is complete

- [x] T003 Implement `verifyAdmin()` helper in `src/lib/auth/admin-check.ts` per contract (must fail closed on any error)

**Checkpoint**: Foundation ready - user story implementation can now begin

---

## Phase 3: User Story 1 - Admin Access Protection (Priority: P1)

**Goal**: Admin pages verify user identity on server before granting access

**Independent Test**:
- Access /admin logged out → redirected
- Access /admin as non-admin → redirected
- Access /admin as admin → page renders

### Implementation for User Story 1

- [x] T004 [US1] Review existing `src/app/admin/page.tsx` to understand current structure
- [x] T005 [US1] Extract interactive UI from admin page to `src/app/admin/AdminContent.tsx` (Client Component)
- [x] T006 [US1] Modify `src/app/admin/page.tsx` to Server Component with `verifyAdmin()` check and redirect
- [x] T007 [P] [US1] Review existing `src/app/stats/page.tsx` to understand current structure
- [x] T008 [P] [US1] Extract interactive UI from stats page to `src/app/stats/StatsContent.tsx` (Client Component)
- [x] T009 [US1] Modify `src/app/stats/page.tsx` to Server Component with `verifyAdmin()` check and redirect
- [x] T010 [US1] Verify `src/middleware.ts` has Clerk middleware configured correctly

**Checkpoint**: Admin pages now require server-verified admin authentication

---

## Phase 4: User Story 2 - Database Write Protection (Priority: P1)

**Goal**: Database writes restricted to authenticated server-side requests only

**Independent Test**:
- Using anon key: INSERT into visits → denied
- Using anon key: UPDATE users → denied
- Using anon key: SELECT from restaurants → allowed
- Legitimate check-in via app → works

### Implementation for User Story 2

- [x] T011 [US2] Review current RLS policies on dev Supabase database
- [x] T012 [US2] Create migration file `supabase/migrations/20260117000000_tighten_rls.sql` from contract
- [ ] T013 [US2] Apply RLS migration to DEV Supabase database
- [ ] T014 [US2] Verify policies exist using verification query from contract
- [ ] T015 [US2] Test anon write rejection (INSERT, UPDATE, DELETE attempts)
- [ ] T016 [US2] Test legitimate operations still work (sign-up, check-in, profile update)

**Checkpoint**: Database now enforces read-only access for anonymous connections

---

## Phase 5: User Story 3 - Remove Debug Endpoint (Priority: P2)

**Goal**: Production has no test endpoint; development retains it

**Independent Test**:
- curl production /api/test → 404
- curl development /api/test → 200 with data

### Implementation for User Story 3

- [x] T017 [US3] Verify `src/app/api/test/route.ts` exists on dev branch
- [x] T018 [US3] Switch to main branch and delete `src/app/api/test/route.ts`
- [x] T019 [US3] Commit and push deletion to main branch
- [x] T020 [US3] Return to dev branch (file should still exist)

**Checkpoint**: Production endpoint removed; development endpoint preserved

---

## Phase 6: Polish & Verification

**Purpose**: Full verification that all changes work together without regression

- [ ] T021 Complete quickstart.md verification checklist section 1 (RLS Policies)
- [ ] T022 Complete quickstart.md verification checklist section 2 (Admin Auth)
- [ ] T023 Complete quickstart.md verification checklist section 3 (Test Endpoint)
- [ ] T024 Complete quickstart.md verification checklist section 4 (Regression Test - Full User Flow)
- [ ] T025 Update quickstart.md sign-off section with completion status

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - start immediately
- **Foundational (Phase 2)**: Depends on Setup - BLOCKS all user stories
- **US1 (Phase 3)**: Depends on Phase 2 (needs `verifyAdmin()` helper)
- **US2 (Phase 4)**: Depends on Phase 1 only - can run in parallel with US1
- **US3 (Phase 5)**: No dependencies on other stories - can run in parallel with US1/US2
- **Polish (Phase 6)**: Depends on all user stories being complete

### Parallel Opportunities

With multiple developers or parallel execution:

```
Phase 1: Setup
    ↓
Phase 2: Foundational (T003)
    ↓
    ├── Phase 3: US1 (T004-T010) ─────────────────────┐
    ├── Phase 4: US2 (T011-T016) [can parallel US1] ──┼── All must complete
    └── Phase 5: US3 (T017-T020) [can parallel US1/2]─┘
                                                      ↓
                                              Phase 6: Polish
```

### Within Each User Story

1. Review existing code first
2. Create new files before modifying existing
3. Modify existing files
4. Test independently

---

## Implementation Strategy

### Recommended Approach (Solo Developer)

1. Complete Setup + Foundational (T001-T003)
2. Complete US1 (T004-T010) - Admin protection
3. Complete US2 (T011-T016) - Database protection
4. Complete US3 (T017-T020) - Endpoint cleanup
5. Complete Polish (T021-T025) - Full verification

### If Time-Constrained (P1 Only)

1. Complete Setup + Foundational (T001-T003)
2. Complete US1 (T004-T010) - Admin protection
3. Complete US2 (T011-T016) - Database protection
4. Skip US3 (lower priority)
5. Partial verification (sections 1-2 of quickstart)

---

## Notes

- Commit after each completed task or logical group
- Test each user story independently before moving on
- RLS changes affect DEV database first; apply to PROD only after full verification
- US3 requires working on both dev and main branches

---

## Summary

| Metric | Count |
|--------|-------|
| **Total Tasks** | 25 |
| **Phase 1 (Setup)** | 2 |
| **Phase 2 (Foundational)** | 1 |
| **US1 Tasks** | 7 |
| **US2 Tasks** | 6 |
| **US3 Tasks** | 4 |
| **Polish Tasks** | 5 |
| **Parallel Opportunities** | 3 (US1/US2/US3 can all run in parallel after Phase 2) |