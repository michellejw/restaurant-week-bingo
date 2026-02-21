# Feature Specification: Centralized Game Configuration

**Feature Branch**: `005-config-constants`
**Created**: 2026-02-11
**Status**: Draft
**Input**: User description: "Centralize magic numbers into GAME_CONFIG. Extract rate limit settings (MAX_REQUESTS=10, WINDOW_MS=60000) from rate-limit.ts into config. Add restaurantsPerRaffleEntry=4 with comment noting it must match SQL trigger. Update rate-limit.ts to import from config. Optionally interpolate the '4' in how-to-play text."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Developer Changes Game Rules (Priority: P1)

A developer needs to adjust game parameters (like how many restaurant visits equal one raffle entry, or the rate limit for check-ins) for a new event season. They want to change these values in one central location rather than hunting through multiple files.

**Why this priority**: This is the core purpose of the feature - making configuration changes safe and discoverable. Without this, the same value scattered across files leads to bugs when only some are updated.

**Independent Test**: Developer changes `restaurantsPerRaffleEntry` from 4 to 5 in the config file. The how-to-play page text and any display calculations reflect the new value without requiring changes elsewhere.

**Acceptance Scenarios**:

1. **Given** a developer needs to change the raffle entry threshold, **When** they update the single config value, **Then** all affected displays and calculations use the new value.
2. **Given** a developer opens the config file, **When** they look for game-related settings, **Then** all configurable game parameters are grouped together with clear documentation.
3. **Given** a config value has a dependency on external systems (SQL trigger), **When** a developer views that value, **Then** a clear warning comment explains the dependency and what else must be updated.

---

### User Story 2 - Developer Adjusts Rate Limiting (Priority: P2)

A developer needs to adjust rate limiting settings (requests per minute, time window) to handle different traffic patterns. They should find these settings alongside other game configuration, not buried in implementation files.

**Why this priority**: Rate limiting is important but changes less frequently than game rules. It's still a maintenance burden when scattered.

**Independent Test**: Developer changes `maxRequestsPerWindow` from 10 to 15 in the config file. The rate limiter uses the new value without any other code changes.

**Acceptance Scenarios**:

1. **Given** a developer needs to adjust rate limiting, **When** they update the config value, **Then** the rate limiter uses the new setting.
2. **Given** rate limit settings exist in config, **When** the rate limiter initializes, **Then** it imports and uses the centralized values.

---

### User Story 3 - User Sees Accurate Instructions (Priority: P3)

A user reading the "How to Play" page sees accurate information about how many check-ins equal a raffle entry. This number should stay in sync with the actual game logic.

**Why this priority**: User-facing content accuracy is important but the current text works fine. This is an enhancement to prevent future drift.

**Independent Test**: After changing `restaurantsPerRaffleEntry` in config, the how-to-play page displays the correct number in the instructions text.

**Acceptance Scenarios**:

1. **Given** the config specifies 4 restaurants per raffle entry, **When** a user views the how-to-play page, **Then** the text accurately states "Every 4 check-ins = 1 entry".
2. **Given** the config is changed to 5 restaurants per raffle entry, **When** a user views the how-to-play page, **Then** the text accurately states "Every 5 check-ins = 1 entry".

---

### Edge Cases

- What happens if someone changes the config but not the SQL trigger? The database-calculated `raffle_entries` will differ from any client-side calculations. Config comments must warn about this.
- What happens if rate limit values are set to invalid numbers (0, negative)? The rate limiter should handle gracefully or fail fast at startup.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST define all game configuration values in a single, discoverable location.
- **FR-002**: System MUST include `restaurantsPerRaffleEntry` (default: 4) in the centralized config with a clear warning that it must match the SQL trigger.
- **FR-003**: System MUST include rate limiting configuration (`maxRequestsPerWindow`, `windowMs`) in the centralized config.
- **FR-004**: Rate limiting module MUST import its settings from the centralized config rather than defining local constants.
- **FR-005**: How-to-play page SHOULD interpolate the raffle entry threshold from config into user-facing text.
- **FR-006**: Configuration file MUST include documentation comments explaining each value and any external dependencies.

### Key Entities

- **GAME_CONFIG**: Central configuration object containing game rules (raffle thresholds) and operational settings (rate limits).
- **Rate Limiter**: Module that enforces check-in frequency limits, now reading settings from GAME_CONFIG instead of local constants.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: All game-related magic numbers are defined in exactly one file, with zero duplicate definitions elsewhere.
- **SC-002**: Developers can locate any configurable game parameter within 30 seconds by checking the config file.
- **SC-003**: Changing a config value requires editing exactly one file (plus SQL for database-dependent values, which is documented).
- **SC-004**: The config file includes a warning comment for any value that has external dependencies (SQL trigger).

## Assumptions

- The existing `src/config/restaurant-week.ts` file is the appropriate location to extend with GAME_CONFIG (keeps all game configuration together).
- The SQL trigger dependency is acceptable - we document it rather than trying to eliminate it.
- Rate limit cleanup threshold (`MAX_ENTRIES = 1000`) is an implementation detail and does not need to be in the central config.
- No runtime/environment-based config switching is needed - these are static values.

## Out of Scope

- Modifying the SQL trigger itself (that would be a database migration).
- Creating an admin UI for changing config values.
- Environment-variable-driven configuration.
