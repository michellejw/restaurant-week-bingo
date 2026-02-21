# Implementation Plan: Centralized Game Configuration

**Branch**: `005-config-constants` | **Date**: 2026-02-11 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/005-config-constants/spec.md`

## Summary

Centralize scattered magic numbers (raffle entry threshold, rate limit settings) into a single `GAME_CONFIG` object in the existing `restaurant-week.ts` config file. Update `rate-limit.ts` to import from the centralized config. Optionally interpolate the config value into how-to-play page text.

## Technical Context

**Language/Version**: TypeScript 5.x with Next.js 15 (App Router)
**Primary Dependencies**: Existing @supabase/supabase-js, @clerk/nextjs (no new dependencies)
**Storage**: N/A (config is static TypeScript constants)
**Testing**: Manual verification per quickstart.md
**Target Platform**: Web (Vercel deployment)
**Project Type**: Web application (Next.js)
**Performance Goals**: N/A (static config, no runtime impact)
**Constraints**: Must not break existing functionality; SQL trigger dependency must be documented
**Scale/Scope**: ~5 files affected, <100 lines changed

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Applicable? | Status | Notes |
|-----------|-------------|--------|-------|
| I. Security First | No | N/A | Config constants don't affect auth/security |
| II. Server-Side Business Logic | Yes | ✅ Pass | Config is imported by server-side rate limiter |
| III. Environment Separation | No | N/A | Static config, same values across environments |
| IV. Documentation & Maintainability | Yes | ✅ Pass | This feature directly implements "Magic numbers MUST be extracted to named constants with explanatory comments" |

**Gate Status**: PASS - No violations. This feature directly supports Constitution Principle IV.

## Project Structure

### Documentation (this feature)

```text
specs/005-config-constants/
├── plan.md              # This file
├── research.md          # Phase 0 output (minimal - no unknowns)
├── data-model.md        # Phase 1 output (config shape)
├── quickstart.md        # Phase 1 output (verification steps)
├── contracts/           # Phase 1 output (N/A - no APIs)
└── tasks.md             # Phase 2 output (/speckit.tasks)
```

### Source Code (repository root)

```text
src/
├── config/
│   └── restaurant-week.ts  # MODIFY: Add GAME_CONFIG section
├── lib/
│   └── rate-limit.ts       # MODIFY: Import config instead of local constants
└── app/
    └── how-to-play/
        └── page.tsx        # MODIFY (optional): Interpolate config value
```

**Structure Decision**: No new files needed. Extend existing `restaurant-week.ts` with a new `GAME_CONFIG` export.

## Complexity Tracking

No violations - no complexity justification needed.
