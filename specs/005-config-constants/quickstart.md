# Quickstart: Centralized Game Configuration

**Feature**: 005-config-constants
**Date**: 2026-02-11

## Prerequisites

- Node.js and npm installed
- Repository cloned and dependencies installed (`npm install`)
- No additional setup required - this feature modifies existing files only

## Verification Steps

### Test 1: Config Import Check

Verify the config exports correctly and TypeScript compiles without errors.

```bash
npm run build
```

**Expected**: Build completes with no errors related to GAME_CONFIG imports.

### Test 2: Rate Limiter Uses Config

1. Start the dev server: `npm run dev`
2. Sign in as a test user
3. Open browser DevTools → Network tab
4. Click "Check In" and submit 11 rapid check-in attempts (with any code)
5. Observe the 11th request returns 429 (rate limited)

**Expected**: Rate limiting still works at 10 requests per minute (unchanged behavior, just sourced from config now).

### Test 3: Config Discoverability

1. Open `src/config/restaurant-week.ts`
2. Look for `GAME_CONFIG` export

**Expected**:
- `GAME_CONFIG.raffle.restaurantsPerEntry` = 4 with SQL warning comment
- `GAME_CONFIG.rateLimit.maxRequestsPerWindow` = 10
- `GAME_CONFIG.rateLimit.windowMs` = 60000

### Test 4: How-to-Play Text (if implemented)

1. Navigate to `/how-to-play`
2. Read the instructions about raffle entries

**Expected**: Text says "Every 4 check-ins = 1 entry" (value from config, not hardcoded).

### Test 5: No Duplicate Definitions

Search the codebase for magic numbers that should now be in config:

```bash
# Should find only GAME_CONFIG definition, not usage in rate-limit.ts
grep -r "= 10" src/lib/rate-limit.ts
grep -r "= 60" src/lib/rate-limit.ts

# Should find config import, not hardcoded "/ 4" in page.tsx
grep -r "/ 4" src/app/
```

**Expected**:
- `rate-limit.ts` has no local `MAX_REQUESTS = 10` or `WINDOW_MS = 60`
- No `/ 4` calculations outside of config file (how-to-play may have text with "4" from config)

## Troubleshooting

### "Cannot find module" errors

If TypeScript complains about GAME_CONFIG imports:
- Verify `GAME_CONFIG` is exported from `src/config/restaurant-week.ts`
- Restart TypeScript server in your editor (Cmd+Shift+P → "TypeScript: Restart TS Server")

### Rate limiter not working

If rate limiting seems broken after changes:
- Check that `rate-limit.ts` imports from `@/config/restaurant-week`
- Verify import destructuring matches export structure: `GAME_CONFIG.rateLimit.maxRequestsPerWindow`

### SQL mismatch warning

The config file has a warning about SQL trigger sync. This is intentional documentation, not an error. The SQL trigger and config value are independent but should match.
