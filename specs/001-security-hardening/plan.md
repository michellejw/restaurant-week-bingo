# Implementation Plan: Security Hardening

**Branch**: `001-security-hardening` | **Date**: 2026-01-16 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-security-hardening/spec.md`

## Summary

This plan implements three critical security improvements:
1. **Server-side admin auth**: Add Clerk session verification + database admin check before rendering admin pages
2. **RLS policy tightening**: Restrict database writes to service_role only; anon role becomes read-only
3. **Test endpoint removal**: Remove /api/test from production (main branch) while keeping it on dev

## Technical Context

**Language/Version**: TypeScript 5.x with Next.js 15 (App Router)
**Primary Dependencies**: @clerk/nextjs (auth), @supabase/supabase-js (database), React 19
**Storage**: PostgreSQL via Supabase (with Row Level Security)
**Testing**: Manual verification (no automated test framework currently)
**Target Platform**: Vercel (serverless edge/node functions)
**Project Type**: Web application (Next.js full-stack)
**Performance Goals**: Standard web app latency (<1s page loads)
**Constraints**: Must maintain backward compatibility with existing user sessions
**Scale/Scope**: ~100-500 users per Restaurant Week event

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Requirement | Status | Notes |
|-----------|-------------|--------|-------|
| I. Security First | Auth verified server-side before mutations | ✅ PASS | This feature IMPLEMENTS this principle |
| I. Security First | Admin ops verify Clerk + is_admin flag | ✅ PASS | User Story 1 directly addresses this |
| I. Security First | Writes use service_role; anon is read-only | ✅ PASS | User Story 2 directly addresses this |
| II. Server-Side Logic | Business logic in API routes, not UI | ✅ PASS | Auth check moves to server component |
| III. Environment Separation | Dev/prod isolated | ✅ PASS | User Story 3 maintains dev endpoint |
| III. Environment Separation | Test on dev before main | ✅ PASS | RLS changes apply to dev first |
| IV. Documentation | Changes documented | ✅ PASS | Migration file includes comments |

**Gate Result**: PASS - No violations. This feature directly implements Constitution principles.

## Project Structure

### Documentation (this feature)

```text
specs/001-security-hardening/
├── plan.md              # This file
├── research.md          # Phase 0: Research findings
├── data-model.md        # Phase 1: Entity definitions
├── quickstart.md        # Phase 1: Verification guide
├── contracts/           # Phase 1: No new API contracts (modifying existing)
│   └── rls-policies.sql # Database policy definitions
└── tasks.md             # Phase 2: Implementation tasks (via /speckit.tasks)
```

### Source Code (repository root)

```text
src/
├── app/
│   ├── admin/
│   │   ├── page.tsx           # MODIFY: Add server-side auth wrapper
│   │   └── AdminContent.tsx   # NEW: Client component (extracted from page.tsx)
│   ├── stats/
│   │   ├── page.tsx           # MODIFY: Add server-side auth wrapper
│   │   └── StatsContent.tsx   # NEW: Client component (extracted from page.tsx)
│   └── api/
│       └── test/
│           └── route.ts       # DELETE (from main branch only)
├── lib/
│   └── auth/
│       └── admin-check.ts     # NEW: Reusable admin verification helper
└── middleware.ts              # REVIEW: Ensure Clerk middleware in place

supabase/
├── migrations/
│   └── 002_tighten_rls.sql    # NEW: RLS policy migration
└── updated_schema.sql         # REFERENCE: Current schema
```

**Structure Decision**: Existing Next.js App Router structure. New files added to `src/lib/auth/` for
reusable auth utilities. Database migrations in `supabase/migrations/`.

## Complexity Tracking

> No complexity violations. This feature simplifies security by centralizing auth checks.