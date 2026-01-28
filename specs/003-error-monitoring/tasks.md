# Tasks: Error Monitoring

**Input**: Design documents from `/specs/003-error-monitoring/`
**Prerequisites**: plan.md, spec.md, research.md, quickstart.md, contracts/sentry-config.ts

**Tests**: Manual verification per quickstart.md verification checklist

**Organization**: Tasks grouped by user story to enable independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task relates to

---

## Phase 1: Setup (External Configuration)

**Purpose**: Create Sentry projects and configure environment variables. These are prerequisites that must be done in the Sentry dashboard and Vercel, not in code.

- [x] T001 Create Sentry project (select Next.js platform) - single project with environment filtering
- [x] T002 Run Sentry wizard to configure SDK and add DSN to `.env.local`
- [x] T003 Add `SENTRY_AUTH_TOKEN` to `.env.local` (for local source map uploads)
- [x] T004 Add `NEXT_PUBLIC_SENTRY_DSN` to Vercel environment variables
- [x] T005 Add `SENTRY_AUTH_TOKEN` to Vercel (for source maps)

**Checkpoint**: Environment variables configured, ready for SDK installation

---

## Phase 2: Foundational (Sentry SDK Installation)

**Purpose**: Install and configure the Sentry SDK. This uses the Sentry wizard which handles most setup automatically.

- [x] T006 Run `npx @sentry/wizard@latest -i nextjs` to install SDK and generate config files
- [x] T007 Review generated `src/instrumentation-client.ts` - fixed: DSN from env var, sendDefaultPii: false
- [x] T008 [P] Review generated `sentry.server.config.ts` - fixed: DSN from env var, sendDefaultPii: false
- [x] T009 [P] Review generated `sentry.edge.config.ts` - fixed: DSN from env var, sendDefaultPii: false
- [x] T010 Review `next.config.ts` changes - Sentry webpack plugin included by wizard
- [x] T011 Verify `src/instrumentation.ts` exists and imports server config

**Checkpoint**: Sentry SDK installed and configured, basic error capture working

---

## Phase 3: User Story 1 - Developer Receives Error Alerts (Priority: P1)

**Goal**: Capture unhandled errors and send email alerts within 5 minutes

**Independent Test**: Trigger an error in production, verify alert email arrives within 5 minutes

### Implementation

- [ ] T012 [US1] Create `src/app/global-error.tsx` - App Router global error boundary with Sentry capture
- [ ] T013 [US1] Configure Sentry alert rule: "When a new issue is created, send email to team"
- [ ] T014 [US1] Add team member emails to Sentry project notification settings
- [ ] T015 [US1] Verify `debug: false` in production config (sentry.client.config.ts)

### Verification

- [x] T016 [US1] Test: Trigger client-side error, verify it appears in Sentry dashboard
- [ ] T017 [US1] Test: Trigger server-side error (via `/api/sentry-example-api`), verify it appears in Sentry dashboard
- [ ] T018 [US1] Test: Trigger new error in production, verify email notification within 5 minutes

**Checkpoint**: Error alerts working - MVP complete

---

## Phase 4: User Story 2 - Developer Investigates Errors with Context (Priority: P2)

**Goal**: Include user ID and contextual information in error reports without capturing PII

**Independent Test**: Trigger error while signed in, verify user ID visible in Sentry but no email/name

### Implementation

- [ ] T019 [US2] Create `src/lib/sentry/user-context.ts` per contract (setSentryUserContext helper)
- [ ] T020 [US2] Integrate user context in app layout or provider - call `setSentryUserContext(user?.id)` on auth state change
- [ ] T021 [US2] Verify NO PII fields are passed (no email, username, name, phone, ip_address)

### Verification

- [ ] T022 [US2] Test: Trigger error while signed in, verify user ID appears in error report
- [ ] T023 [US2] Test: Audit error report - confirm NO email, name, or phone visible
- [ ] T024 [US2] Test: Trigger error while signed out, verify user context is null

**Checkpoint**: Error context working with user ID only (no PII)

---

## Phase 5: User Story 3 - Developer Reviews Error Trends (Priority: P3)

**Goal**: View error frequency and patterns in Sentry dashboard

**Independent Test**: View Sentry dashboard, verify errors are grouped and counts visible

### Implementation

- [ ] T025 [US3] Verify Sentry issue grouping is working (similar errors grouped automatically)
- [ ] T026 [US3] Explore Sentry dashboard - locate frequency chart/timeline view
- [ ] T027 [US3] Explore Sentry dashboard - locate user impact counts

### Verification

- [ ] T028 [US3] Test: Trigger same error 3 times, verify they're grouped with count of 3
- [ ] T029 [US3] Test: View error timeline/frequency in Sentry dashboard
- [ ] T030 [US3] Test: Verify user count shows affected users for grouped errors

**Checkpoint**: Error trends visible in dashboard

---

## Phase 6: Polish & Verification

**Purpose**: Final cleanup and full verification per quickstart.md checklist

- [ ] T031 Delete `/api/sentry-example-api` route (if not needed for ongoing testing)
- [ ] T032 Verify dev errors are tagged with `environment: development` in Sentry
- [ ] T033 Verify prod errors are tagged with `environment: production` in Sentry
- [ ] T034 Measure page load time impact (should be <100ms increase)
- [ ] T035 Test: Set invalid DSN, trigger error, verify app doesn't crash (FR-010 graceful degradation)
- [ ] T036 Run full quickstart.md verification checklist

---

## Dependencies & Execution Order

```
Phase 1: Setup (T001-T005) - External configuration
    ↓
Phase 2: Foundational (T006-T011) - SDK installation
    ↓
Phase 3: User Story 1 (T012-T018) - Error Alerts (MVP)
    ↓
Phase 4: User Story 2 (T019-T024) - Error Context
    ↓
Phase 5: User Story 3 (T025-T030) - Error Trends
    ↓
Phase 6: Polish (T031-T036) - Cleanup & Verification
```

### Parallel Opportunities

- T001, T002 can run in parallel (separate Sentry projects)
- T003, T004, T005 can run in parallel (different environment targets)
- T007, T008, T009 can run in parallel (reviewing different config files)
- T016, T017 can run in parallel (different error types)
- T022, T023, T024 can run in parallel (different verification scenarios)
- T028, T029, T030 can run in parallel (dashboard exploration)

### User Story Independence

- **US1 (Error Alerts)**: Can be completed and verified independently - this is the MVP
- **US2 (Error Context)**: Depends on US1 being complete (need working error capture first)
- **US3 (Error Trends)**: Depends on US1 being complete (need errors in dashboard to view trends)

---

## Summary

| Metric | Count |
|--------|-------|
| **Total Tasks** | 36 |
| **Phase 1 (Setup)** | 5 |
| **Phase 2 (Foundational)** | 6 |
| **Phase 3 (US1 - Alerts)** | 7 |
| **Phase 4 (US2 - Context)** | 6 |
| **Phase 5 (US3 - Trends)** | 6 |
| **Phase 6 (Polish)** | 6 |

| User Story | Tasks |
|------------|-------|
| US1 (Error Alerts) | T012-T018 |
| US2 (Error Context) | T019-T024 |
| US3 (Error Trends) | T025-T030 |
