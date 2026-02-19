# Restaurant Week Bingo - Development Roadmap

> **Purpose**: Track progress on improvement initiatives. Each item maps to a feature spec in `/specs/`.
>
> **Source**: Derived from [IMPROVEMENT_PLAN.md](./IMPROVEMENT_PLAN.md)

---

## Status Legend

- [x] Complete
- [ ] Not started
- [ ] **In Progress** ← actively being worked on

---

## Phase 1: Security Hardening (P0 - Critical)

> **Goal**: Close security vulnerabilities before production use.

- [x] **001-security-hardening** - Server-side auth & RLS policies
  - [x] Add server-side auth to admin routes (`verifyAdmin()`)
  - [x] Tighten RLS policies (anon = read-only, service_role = write)
  - [x] Remove test endpoint from production (main branch only)

---

## Phase 2: Code Quality (P1 - High)

> **Goal**: Improve code reliability, testability, and maintainability.

- [x] **002-checkin-api** - Check-in API route with validation
  - [x] Move check-in logic from modal to API route
  - [x] Add rate limiting (10 requests/min per user)
  - [x] Add server-side input validation
  - [x] Remove stats update redundancy (rely on DB trigger)

---

## Phase 3: Developer Experience (P2 - Medium)

> **Goal**: Better tooling for development and debugging.

- [x] **003-error-monitoring** - Sentry integration
  - [x] Install and configure @sentry/nextjs
  - [x] Set up error alerting for production
  - [x] Add user context to error reports

- [x] **004-data-caching** - SWR for client-side caching
  - [x] Install SWR
  - [x] Create `useRestaurants` hook with caching
  - [x] Create `useUserStats` hook with caching
  - [x] Reduce unnecessary API calls on page loads

- [x] **005-config-constants** - Centralize magic numbers
  - [x] Create `GAME_CONFIG` in restaurant-week.ts
  - [x] Extract `RESTAURANTS_PER_RAFFLE_ENTRY` (currently hardcoded as 4)
  - [x] Extract `MAX_CHECKINS_PER_MINUTE` (currently hardcoded as 10)
  - [x] Update all references to use config constants

---

## Phase 4: Documentation (P2-P3)

> **Goal**: Enable smooth handoff and seasonal operations.

- [x] **006-operations-docs** - Seasonal operations documentation
  - [x] Create `docs/OPERATIONS.md` runbook
  - [x] Document pre-season setup steps
  - [x] Document during-event monitoring
  - [x] Document post-event tasks (raffle, backup)

- [ ] **007-developer-docs** - Developer onboarding
  - [ ] Create `docs/ENVIRONMENT_SETUP.md`
  - [ ] Update README with quick start guide
  - [ ] Add architecture overview

---

## Future Enhancements (P3 - Low / Backlog)

> **Goal**: Nice-to-haves if time permits.

- [ ] **TBD** - Automated testing
  - [ ] Unit tests for API routes
  - [ ] Integration tests for check-in flow

- [ ] **TBD** - Performance optimization
  - [ ] Image optimization for restaurant/sponsor logos
  - [ ] Lazy loading for map markers

- [ ] **TBD** - User experience improvements
  - [ ] Push notifications for check-in confirmation
  - [ ] Share bingo card on social media

---

## Progress Summary

| Phase | Status | Specs |
|-------|--------|-------|
| Phase 1: Security | ✅ Complete | 001 |
| Phase 2: Code Quality | ✅ Complete | 002 |
| Phase 3: Dev Experience | ✅ Complete | 003 ✅, 004 ✅, 005 ✅ |
| Phase 4: Documentation | ⏳ In Progress | 006 ✅, 007 |

---

## Next Steps

1. Pick the next unchecked item
2. Run `/speckit.specify` to create the feature spec
3. Run `/speckit.plan` to create the implementation plan
4. Run `/speckit.tasks` to generate tasks
5. Implement and verify
6. Check off items in this roadmap

---

*Last updated: 2026-02-17*
