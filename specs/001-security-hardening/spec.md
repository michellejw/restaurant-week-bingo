# Feature Specification: Security Hardening

**Feature Branch**: `001-security-hardening`
**Created**: 2026-01-16
**Status**: Draft
**Input**: Phase 1 Security Hardening as described in IMPROVEMENT_PLAN.md

## Overview

This feature addresses critical security vulnerabilities identified during code review. The application currently has gaps in authentication verification for admin pages and overly permissive database access policies. These issues could allow unauthorized access to admin functionality or direct database manipulation by malicious users.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Admin Access Protection (Priority: P1)

As a system administrator, I need admin pages to verify my identity on the server before granting access, so that unauthorized users cannot bypass client-side checks to access sensitive functionality.

**Why this priority**: Admin pages can modify user data, view all participants, and manage the raffle. A security breach here could compromise the entire event and participant trust.

**Independent Test**: Can be tested by attempting to access admin pages without authentication and verifying denial, then accessing with valid admin credentials and verifying access.

**Acceptance Scenarios**:

1. **Given** a user is not logged in, **When** they attempt to access the admin page directly via URL, **Then** they are redirected to the home page
2. **Given** a user is logged in but is NOT an admin, **When** they attempt to access the admin page, **Then** they are redirected to the home page
3. **Given** a user is logged in AND is an admin, **When** they access the admin page, **Then** they see the admin interface and can perform admin actions
4. **Given** a user is logged in AND is an admin, **When** they access the stats page, **Then** they see the statistics dashboard

---

### User Story 2 - Database Write Protection (Priority: P1)

As a system owner, I need database write operations restricted to authenticated server-side requests only, so that malicious users cannot directly manipulate data even if they obtain the public database credentials.

**Why this priority**: The database URL and anonymous key are exposed in frontend code (necessary for reads). Without proper restrictions, anyone could insert fake visits, modify user data, or corrupt raffle entries.

**Independent Test**: Can be tested by attempting direct database writes using the anonymous key and verifying they are rejected, then verifying that legitimate application flows still work.

**Acceptance Scenarios**:

1. **Given** a malicious user has the public database URL and anonymous key, **When** they attempt to INSERT a visit record directly, **Then** the operation is denied
2. **Given** a malicious user has the public database URL and anonymous key, **When** they attempt to UPDATE a user record directly, **Then** the operation is denied
3. **Given** a malicious user has the public database URL and anonymous key, **When** they attempt to DELETE any record directly, **Then** the operation is denied
4. **Given** a legitimate user checks in via the application, **When** the server processes their check-in, **Then** the visit is recorded successfully
5. **Given** a new user signs up via the application, **When** the server creates their account, **Then** the user record is created successfully
6. **Given** any user views the bingo card, **When** they load the page, **Then** they can read restaurant and visit data normally

---

### User Story 3 - Remove Debug Endpoint from Production (Priority: P2)

As a system owner, I need debugging endpoints removed from production while keeping them available in development, so that production exposes minimal attack surface while developers retain useful tools.

**Why this priority**: While lower risk than the other items (the endpoint only reads public data), it unnecessarily exposes implementation details and follows security best practice of minimizing production surface area.

**Independent Test**: Can be tested by verifying the endpoint does not exist on production deployment while confirming it still works on development deployment.

**Acceptance Scenarios**:

1. **Given** a user accesses the production site, **When** they request the test endpoint, **Then** they receive a 404 not found response
2. **Given** a developer accesses the development site, **When** they request the test endpoint, **Then** they receive a valid response with test data

---

### Edge Cases

- What happens if a user's admin status changes while they have an admin page open?
  - The next server request will re-verify and deny access if no longer admin
- What happens if the database trigger needs to write to user_stats but RLS blocks it?
  - Database triggers run with elevated privileges and are not affected by RLS policies for the anonymous role
- What happens if the authentication service is temporarily unavailable?
  - Admin pages should fail closed (deny access) rather than fail open

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST verify user authentication via the authentication provider on the server before rendering admin pages
- **FR-002**: System MUST verify user has admin privileges in the database before rendering admin pages
- **FR-003**: System MUST redirect unauthorized users to the home page when they attempt to access admin pages
- **FR-004**: Database MUST reject all INSERT operations from the anonymous role on user-modifiable tables (visits, users, user_stats)
- **FR-005**: Database MUST reject all UPDATE operations from the anonymous role on user-modifiable tables
- **FR-006**: Database MUST reject all DELETE operations from the anonymous role on user-modifiable tables
- **FR-007**: Database MUST allow SELECT operations from the anonymous role on all tables (required for application reads)
- **FR-008**: Database MUST allow all operations from the service role (used by server-side code)
- **FR-009**: Production deployment MUST NOT include debugging/test endpoints
- **FR-010**: Development deployment MUST retain debugging/test endpoints for developer use

### Key Entities

- **User**: Represents a participant; has `is_admin` flag that determines access level
- **Visit**: Represents a check-in at a restaurant; created through authenticated server routes
- **User Stats**: Cached statistics for a user; updated by database triggers and server routes

### Assumptions

- The authentication provider handles session management and token validation
- Server-side code uses a service role key that bypasses row-level security restrictions
- Database triggers execute with database owner privileges, not affected by RLS for anonymous role
- The test endpoint on development is useful for verifying database connectivity

### Out of Scope

The following Constitution requirements are intentionally NOT addressed by this feature:

- **Input Validation** (Constitution I): Server-side validation of user input is a Phase 3 concern per IMPROVEMENT_PLAN.md. Current API routes have basic validation; comprehensive sanitization will be addressed separately.
- **Rate Limiting** (Constitution I): Public endpoint rate limiting is a Phase 3 concern per IMPROVEMENT_PLAN.md. This feature focuses on access control, not abuse prevention.

These items remain on the improvement roadmap and do not block this security hardening work.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of admin page access attempts by non-admin users result in redirect to home page
- **SC-002**: 100% of direct database write attempts using the anonymous key are rejected
- **SC-003**: 100% of legitimate application operations (sign-up, check-in, profile update) continue to work after security changes
- **SC-004**: Production deployment returns 404 for test endpoint requests
- **SC-005**: Development deployment returns valid response for test endpoint requests
- **SC-006**: All existing user-facing functionality remains operational after changes (no regression)

### Verification Approach

1. **Admin access**: Attempt to access /admin and /stats pages as:
   - Logged out user → expect redirect
   - Logged in non-admin → expect redirect
   - Logged in admin → expect access

2. **Database protection**: Using database client with anonymous key, attempt:
   - INSERT into visits → expect denied
   - UPDATE users → expect denied
   - SELECT from restaurants → expect allowed

3. **Endpoint removal**: After deployment:
   - Request /api/test on production → expect 404
   - Request /api/test on development → expect 200 with data

4. **Regression check**: Complete full user flow:
   - Sign up → check in → view bingo card → view stats (as admin)