<!--
SYNC IMPACT REPORT
==================
Version change: N/A → 1.0.0 (initial ratification)

Added principles:
- I. Security First
- II. Server-Side Business Logic
- III. Environment Separation
- IV. Documentation & Maintainability

Added sections:
- Development Workflow
- Seasonal Operations

Templates status:
- ✅ plan-template.md - Constitution Check section exists, compatible
- ✅ spec-template.md - Requirements structure compatible
- ✅ tasks-template.md - Phase structure compatible

Follow-up TODOs: None
-->

# Restaurant Week Bingo Constitution

## Core Principles

### I. Security First

All user-facing operations MUST be protected by authentication and authorization checks:

- **Authentication**: Clerk session MUST be verified server-side before any data mutation
- **Authorization**: Admin operations MUST verify both Clerk session AND `is_admin` database flag
- **Database Access**: Write operations MUST use `service_role` key via API routes; `anon` role is read-only
- **Input Validation**: All user input MUST be validated and sanitized server-side before database operations
- **Rate Limiting**: Public endpoints MUST implement rate limiting to prevent abuse

**Rationale**: This is a public-facing application handling user data. Security vulnerabilities could expose
participant information or allow manipulation of raffle entries.

### II. Server-Side Business Logic

Business logic MUST reside in API routes or server-side services, NOT in UI components:

- **Check-in validation**: Restaurant code lookup, duplicate detection, visit creation MUST happen in API routes
- **Stats calculation**: Raffle entry calculations MUST be handled by database triggers or server-side code
- **Data mutations**: All INSERT/UPDATE/DELETE operations MUST go through authenticated API routes
- **Error handling**: Meaningful error messages MUST be returned from API routes; UI displays them

**Rationale**: Keeping business logic server-side ensures security (can't be bypassed), testability (easier to
test API routes than UI components), and consistency (single source of truth).

### III. Environment Separation

Development and production environments MUST be completely isolated:

- **Branches**: `dev` branch for development/testing, `main` branch for production only
- **Databases**: Separate Supabase projects for dev and prod; never share connection strings
- **Auth**: Clerk automatically separates dev/prod keys; verify correct keys per environment
- **Feature flags**: `forceEnableInProduction` MUST be `false` on `main` branch, may be `true` on `dev`
- **Testing**: All changes MUST be tested on dev deployment before merging to main

**Rationale**: This application runs twice yearly for public events. A production bug during Restaurant Week
would impact real users and the Chamber of Commerce's reputation.

### IV. Documentation & Maintainability

Code and processes MUST be documented for handoff and seasonal operations:

- **Operations Runbook**: Step-by-step guides MUST exist for seasonal tasks (data import, raffle draw, backup)
- **Environment Setup**: Clear documentation MUST exist for all environment variables and their sources
- **Git Workflow**: Branch strategy and merge procedures MUST be documented
- **Configuration**: Magic numbers MUST be extracted to named constants with explanatory comments
- **Scripts**: Admin scripts MUST include usage instructions and be safely re-runnable

**Rationale**: This project may be handed off to another developer. It runs infrequently (twice yearly),
so documentation prevents knowledge loss between events.

## Development Workflow

All code changes follow this workflow:

1. **Branch from dev**: New work starts on feature branches created from `dev` (enforced by Speckit config)
2. **Local testing**: Run and test locally with dev database
3. **Push to dev**: Merge feature branch to `dev`, triggering Vercel dev deployment
4. **Test on dev deployment**: Verify functionality on the dev URL
5. **Merge to main**: Only after dev testing passes, merge `dev` to `main`
6. **Verify production**: Spot-check production deployment after merge

**Prohibited actions**:
- Direct commits to `main` branch
- Skipping dev deployment testing
- Using production database for development
- Pushing untested code before an event

## Seasonal Operations

Restaurant Week occurs twice yearly (Spring and Fall). Operations follow this cycle:

**4-6 weeks before event**:
- Update event dates in configuration
- Import updated restaurant/sponsor data using smart-import scripts
- Test full user flow on dev environment

**1 week before event**:
- Final merge from dev to main
- Verify production shows correct countdown/dates
- Confirm all restaurants appear correctly

**During event**:
- Monitor for errors (Sentry if configured)
- Be available for user support issues
- Run consistency checks if stats seem off

**After event**:
- Run raffle draw script
- Backup all data
- Archive results for Chamber records

## Governance

This constitution governs all development on Restaurant Week Bingo. Compliance is verified through:

- **Code review**: All PRs MUST be checked against these principles before merge
- **Speckit integration**: Constitution Check in plan-template.md validates compliance during planning
- **Pre-launch checklist**: Seasonal operations include constitution compliance verification

**Amendment process**:
1. Propose change with rationale in a PR
2. Update constitution version following semantic versioning:
   - MAJOR: Principle removal or fundamental redefinition
   - MINOR: New principle or significant expansion
   - PATCH: Clarification or wording improvement
3. Update dependent templates if principles change
4. Document change in Sync Impact Report at top of this file

**Version**: 1.0.0 | **Ratified**: 2026-01-16 | **Last Amended**: 2026-01-16