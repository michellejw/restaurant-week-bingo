# Feature Specification: Check-In API Route

**Feature Branch**: `002-checkin-api`
**Created**: 2026-01-20
**Status**: Draft
**Input**: Phase 2.2 from IMPROVEMENT_PLAN.md

## Overview

Currently, the check-in business logic (restaurant lookup, duplicate detection, visit creation) lives in the `CheckInModal.tsx` client component. This means validation happens client-side and could theoretically be bypassed. Moving this logic to a server-side API route improves security, testability, and maintainability.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Successful Check-In (Priority: P1)

As a signed-in user at a participating restaurant, I want to enter the restaurant's code and have my visit recorded, so that I earn credit toward raffle entries.

**Why this priority**: This is the core functionality of the app during Restaurant Week.

**Independent Test**: Can be tested by signing in, entering a valid restaurant code, and verifying the visit is recorded.

**Acceptance Scenarios**:

1. **Given** a signed-in user with a valid restaurant code, **When** they submit the code, **Then** the visit is recorded and they see a success message with the restaurant name
2. **Given** a signed-in user who checks in, **When** the check-in succeeds, **Then** their bingo card updates to show the visited restaurant
3. **Given** a signed-in user who checks in, **When** the check-in succeeds, **Then** their raffle entry count updates if they've crossed a threshold (every 4 visits)

---

### User Story 2 - Duplicate Check-In Prevention (Priority: P1)

As a system owner, I want to prevent users from checking in to the same restaurant twice, so that the raffle remains fair.

**Why this priority**: Duplicate check-ins would allow gaming the raffle system.

**Independent Test**: Can be tested by checking in to a restaurant, then attempting to check in again with the same code.

**Acceptance Scenarios**:

1. **Given** a user who has already visited a restaurant, **When** they try to check in there again, **Then** the check-in is rejected with a friendly message
2. **Given** a duplicate check-in attempt, **When** rejected, **Then** no new visit record is created in the database

---

### User Story 3 - Invalid Code Handling (Priority: P1)

As a user who mistyped a code, I want to receive a clear error message, so that I can correct my mistake.

**Why this priority**: Good error messages improve user experience and reduce support requests.

**Independent Test**: Can be tested by entering an invalid code and verifying the error message.

**Acceptance Scenarios**:

1. **Given** a user enters a code that doesn't match any restaurant, **When** they submit, **Then** they see "Invalid code. Please check and try again."
2. **Given** a user enters an empty code, **When** they submit, **Then** they see "Please enter a restaurant code"
3. **Given** a user enters a code with different casing, **When** the code matches a restaurant (case-insensitive), **Then** the check-in succeeds

---

### User Story 4 - Unauthenticated User Handling (Priority: P1)

As a system owner, I want check-ins to require authentication, so that visits are properly attributed to users.

**Why this priority**: Anonymous check-ins would break the raffle system.

**Independent Test**: Can be tested by attempting to call the API without authentication.

**Acceptance Scenarios**:

1. **Given** an unauthenticated request to the check-in endpoint, **When** submitted, **Then** the request is rejected with a 401 status
2. **Given** an unauthenticated user in the UI, **When** they try to check in, **Then** they are prompted to sign in first

---

### User Story 5 - Rate Limiting (Priority: P2)

As a system owner, I want to limit how quickly users can attempt check-ins, so that the system can't be abused.

**Why this priority**: Prevents brute-force attempts to guess codes or spam the system.

**Independent Test**: Can be tested by rapidly submitting multiple check-in requests.

**Acceptance Scenarios**:

1. **Given** a user who has made 10 check-in attempts in the last minute, **When** they try again, **Then** they receive a "Too many attempts" message with a wait time
2. **Given** a rate-limited user, **When** they wait for the cooldown period, **Then** they can attempt check-ins again

---

### Edge Cases

- What happens if the database is temporarily unavailable?
  - Return a 500 error with "Something went wrong. Please try again."
- What happens if a user's session expires mid-check-in?
  - Return 401 and prompt re-authentication
- What happens if Restaurant Week hasn't started yet?
  - This is already handled by the frontend; API doesn't need to re-check (but could for defense-in-depth)

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST verify user authentication via Clerk before processing check-in
- **FR-002**: System MUST look up restaurant by code (case-insensitive)
- **FR-003**: System MUST reject check-ins to restaurants the user has already visited
- **FR-004**: System MUST create a visit record on successful check-in
- **FR-005**: System MUST return the restaurant name on successful check-in
- **FR-006**: System MUST return updated stats (visit count, raffle entries) on successful check-in
- **FR-007**: System MUST return appropriate error messages for invalid codes
- **FR-008**: System MUST return appropriate error messages for duplicate visits
- **FR-009**: System MUST implement rate limiting (10 requests per minute per user)
- **FR-010**: System MUST return 429 status when rate limit exceeded

### Non-Functional Requirements

- **NFR-001**: API response time SHOULD be under 500ms for typical requests
- **NFR-002**: Error messages SHOULD be user-friendly (not expose internal details)
- **NFR-003**: API SHOULD log errors for debugging without exposing sensitive data

### Key Entities

- **Visit**: Represents a check-in at a restaurant; links user to restaurant with timestamp
- **Restaurant**: Has a unique code used for check-in validation
- **User Stats**: Cached visit count and raffle entries; updated by database trigger

### Assumptions

- Database trigger `update_user_stats()` correctly updates stats after visit insert
- Frontend will call this API instead of directly using DatabaseService
- Restaurant codes are unique across all restaurants

### Out of Scope

- QR code scanning (future enhancement)
- Offline check-in support
- Check-in time restrictions (handled by frontend config)

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of check-in logic removed from CheckInModal.tsx (only API calls remain)
- **SC-002**: All check-in requests go through `/api/check-in` endpoint
- **SC-003**: Rate limiting blocks requests exceeding 10/minute/user
- **SC-004**: Invalid code attempts return 404 with user-friendly message
- **SC-005**: Duplicate visit attempts return 409 with user-friendly message
- **SC-006**: Unauthenticated requests return 401

### Verification Approach

1. **API Testing**: Use curl or similar to test each scenario:
   - Valid check-in → 200 with restaurant name and stats
   - Invalid code → 404 with error message
   - Duplicate visit → 409 with error message
   - No auth → 401
   - Rate limit exceeded → 429

2. **Integration Testing**: Complete check-in flow via UI:
   - Sign in → Enter code → See success → Bingo card updates

3. **Regression Testing**: Existing functionality still works:
   - Stats calculate correctly
   - Raffle entries increment at correct intervals
