# Implementation Plan: Error Monitoring

**Branch**: `003-error-monitoring` | **Date**: 2026-01-26 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/003-error-monitoring/spec.md`

## Summary

Add comprehensive error monitoring to capture unhandled errors in production, send alerts to developers, and provide contextual information for debugging. Using Sentry's Next.js SDK which provides first-class support for both client and server error capture with minimal configuration.

## Technical Context

**Language/Version**: TypeScript 5.x with Next.js 15 (App Router)
**Primary Dependencies**: @sentry/nextjs (Sentry's official Next.js SDK)
**Storage**: N/A (Sentry is SaaS - no local storage for errors)
**Testing**: Manual verification (trigger errors, verify in Sentry dashboard)
**Target Platform**: Web (Vercel deployment)
**Project Type**: Web application (Next.js monorepo)
**Performance Goals**: <100ms additional page load time
**Constraints**: No PII capture; separate dev/prod Sentry projects
**Scale/Scope**: Low volume (~2 weeks active use, <1000 users)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Security First | ✅ Pass | No PII captured (FR-005); user ID only (Clerk ID, not email) |
| II. Server-Side Business Logic | ✅ Pass | No business logic added; error capture is observability |
| III. Environment Separation | ✅ Pass | Separate Sentry projects for dev/prod (FR-009) |
| IV. Documentation & Maintainability | ✅ Pass | Sentry DSN in env vars; setup documented in quickstart |

**Gate Result**: PASS - No violations, proceed with implementation.

## Project Structure

### Documentation (this feature)

```text
specs/003-error-monitoring/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output (minimal - no data entities)
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output (minimal - no new APIs)
└── tasks.md             # Phase 2 output (/speckit.tasks command)
```

### Source Code (repository root)

```text
src/
├── instrumentation.ts           # NEW: Sentry server-side init (Next.js 15 convention)
├── app/
│   ├── global-error.tsx         # NEW: App Router global error boundary with Sentry
│   └── api/
│       └── sentry-example-api/  # OPTIONAL: Test endpoint for verification
│           └── route.ts
└── lib/
    └── sentry/
        └── user-context.ts      # NEW: Helper to set Sentry user context from Clerk

# Root config files
sentry.client.config.ts          # NEW: Sentry client-side configuration
sentry.server.config.ts          # NEW: Sentry server-side configuration
sentry.edge.config.ts            # NEW: Sentry edge runtime configuration
next.config.ts                   # MODIFY: Add Sentry webpack plugin
```

**Structure Decision**: Following Next.js 15 App Router conventions with Sentry's recommended setup. The `instrumentation.ts` file is the standard location for server-side initialization in Next.js 15+.

## Complexity Tracking

> No violations - table not required.
