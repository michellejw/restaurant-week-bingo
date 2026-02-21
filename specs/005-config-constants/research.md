# Research: Centralized Game Configuration

**Feature**: 005-config-constants
**Date**: 2026-02-11

## Summary

No significant unknowns for this feature. The implementation is straightforward TypeScript refactoring.

## Decisions

### D1: Config Location

**Decision**: Add `GAME_CONFIG` to existing `src/config/restaurant-week.ts`

**Rationale**:
- Keeps all game-related configuration in one file
- File already exists and is imported where needed
- No new file means no new import paths to manage

**Alternatives considered**:
- Create new `src/config/game-config.ts` - Rejected: adds unnecessary file when existing location works
- Create `src/constants.ts` at root - Rejected: too generic, game-specific config belongs in game config file

### D2: SQL Trigger Dependency

**Decision**: Document the dependency with warning comments; do not attempt to eliminate it

**Rationale**:
- The SQL trigger calculates `raffle_entries` on INSERT/DELETE - this is correct behavior (database is source of truth)
- The JS config value is only needed for display text, not calculations
- Eliminating the dependency would require either:
  - Storing config in database (overkill for static values)
  - Making the trigger read from an external source (complex, error-prone)

**Mitigation**: Clear warning comment in config file + documented in this research

### D3: Rate Limit Constants

**Decision**: Move `MAX_REQUESTS` and `WINDOW_MS` to GAME_CONFIG; keep `MAX_ENTRIES` local

**Rationale**:
- `MAX_REQUESTS` (10) and `WINDOW_MS` (60000) are game rules that might be adjusted
- `MAX_ENTRIES` (1000) is an implementation detail for memory management, not a game rule

## No Further Research Needed

- No new dependencies required
- No API changes
- No database changes
- Pattern is simple TypeScript imports/exports
