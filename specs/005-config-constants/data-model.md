# Data Model: Centralized Game Configuration

**Feature**: 005-config-constants
**Date**: 2026-02-11

## Overview

This feature adds a `GAME_CONFIG` export to the existing `restaurant-week.ts` configuration file. No database changes required.

## Configuration Schema

### GAME_CONFIG Structure

```typescript
export const GAME_CONFIG = {
  /**
   * 🎟️ RAFFLE RULES
   */
  raffle: {
    /**
     * Number of restaurant check-ins required for one raffle entry.
     *
     * ⚠️ CRITICAL: This value MUST match the SQL trigger!
     * The database trigger at `supabase/fix-user-stats-triggers.sql` uses:
     *   FLOOR(visit_count / 4)
     *
     * If you change this value, you MUST also update the SQL trigger
     * and run a migration to recalculate existing raffle_entries.
     */
    restaurantsPerEntry: number; // default: 4
  };

  /**
   * 🚦 RATE LIMITING
   *
   * Controls how often users can submit check-in requests.
   * Prevents abuse and accidental rapid submissions.
   */
  rateLimit: {
    /**
     * Maximum check-in requests allowed per time window.
     */
    maxRequestsPerWindow: number; // default: 10

    /**
     * Time window in milliseconds.
     * After this duration, the request count resets.
     */
    windowMs: number; // default: 60000 (1 minute)
  };
} as const;
```

### Type Definitions

```typescript
// Inferred from `as const` - no separate type needed
// Access: typeof GAME_CONFIG
// Values are readonly and literal types
```

## Relationships

### Config → Rate Limiter

- `rate-limit.ts` imports `GAME_CONFIG.rateLimit.maxRequestsPerWindow` and `GAME_CONFIG.rateLimit.windowMs`
- Replaces local `MAX_REQUESTS` and `WINDOW_MS` constants

### Config → How-to-Play Page (optional)

- `how-to-play/page.tsx` may import `GAME_CONFIG.raffle.restaurantsPerEntry`
- Used to interpolate the number into display text: "Every {n} check-ins = 1 entry"

### Config ↔ SQL Trigger (documentation only)

- `GAME_CONFIG.raffle.restaurantsPerEntry` documents the value used in SQL
- SQL trigger at `supabase/fix-user-stats-triggers.sql` uses `FLOOR(visit_count/4)`
- **No runtime relationship** - this is a documentation link only
- Developer must manually keep these in sync

## Validation Rules

| Field | Constraint | Rationale |
|-------|------------|-----------|
| `restaurantsPerEntry` | Must be positive integer ≥ 1 | Zero or negative makes no sense for raffle math |
| `maxRequestsPerWindow` | Must be positive integer ≥ 1 | Zero would block all requests |
| `windowMs` | Must be positive integer ≥ 1000 | Sub-second windows don't make practical sense |

Note: TypeScript's `as const` provides compile-time safety. Runtime validation is not implemented (values are hardcoded, not user input).

## Migration Notes

No database migration required. This is a code-only change.

If `restaurantsPerEntry` is ever changed from 4:
1. Update `GAME_CONFIG.raffle.restaurantsPerEntry`
2. Update SQL trigger in `supabase/fix-user-stats-triggers.sql`
3. Run migration to recalculate all `user_stats.raffle_entries`
