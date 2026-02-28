# Restaurant Week Bingo Operations Runbook

This document provides step-by-step instructions for operating Restaurant Week Bingo throughout the seasonal cycle. Follow these procedures for each Restaurant Week event (Spring and Fall).

**Audience**: Developers or operators managing the application
**Last Updated**: 2026-02-17

## Table of Contents

1. [Overview](#overview)
2. [Pre-Event Setup (4-6 weeks before)](#pre-event-setup-4-6-weeks-before)
3. [Final Preparation (1 week before)](#final-preparation-1-week-before)
4. [During Event](#during-event)
5. [Post-Event Wrap-up](#post-event-wrap-up)
6. [Troubleshooting Reference](#troubleshooting-reference)
7. [Quick Reference](#quick-reference)

---

## Overview

Restaurant Week Bingo is a web application that allows users to "check in" at participating restaurants during Restaurant Week events. Users earn raffle entries (1 entry per 4 restaurants visited) for prizes.

**Seasonal Cycle**:
- Restaurant Week occurs twice yearly (typically Spring and Fall)
- Each event requires: pre-event setup, active monitoring, and post-event wrap-up
- This runbook covers all phases of the operational cycle

---

## Pre-Event Setup (4-6 weeks before)

Complete these tasks 4-6 weeks before Restaurant Week begins.

### Step 1: Update Event Dates

**File**: `src/config/restaurant-week.ts`

1. Open the configuration file:
   ```bash
   code src/config/restaurant-week.ts
   ```

2. Update the `startDate` and `endDate` values to the new Restaurant Week dates:
   ```typescript
   startDate: '2026-04-15',  // Format: YYYY-MM-DD
   endDate: '2026-04-30',
   ```

3. Update the display messages to reflect the new season dates:
   ```typescript
    messages: {
      title: "Restaurant Week Coming Soon!",
      beforeStart: "Restaurant Week check-ins will be available starting April 15, 2026...",
      duringEvent: "Restaurant Week is active! Enter restaurant codes to check in...",
      afterEndTitle: "Thanks For A Great Restaurant Week!",
      afterEnd: "Thanks for participating in Restaurant Week Spring 2026. See you next season!"
    }
    ```

4. Update the season logo if provided by the Chamber:
   - Add the new asset file under `public/` (example: `public/rest-week-logo-spring2026.png`).
   - Set `logoFile` in `src/config/restaurant-week.ts` to the new path.

5. **IMPORTANT**: Ensure `forceEnableInProduction` is set to `false`:
   ```typescript
   testing: {
     allowInDevelopment: true,
     forceEnableInProduction: false  // Must be false for production!
   }
   ```

**Verification checkpoint**:
- [ ] Run `npm run dev` and verify the countdown shows the correct number of days
- [ ] Verify the "coming soon" message displays the correct date

---

### Step 2: Archive Previous Season and Reset Active Gameplay Data

Do this once per new season so users start with zero check-ins while preserving historical records.

1. Create a production backup:
   ```bash
   npm run backup:prod
   ```

2. Ensure latest migrations are applied to production:
   ```bash
   supabase link --project-ref <prod-project-ref> --password '<db-password>'
   supabase migration list
   supabase db push
   ```

3. Run season rollover (archives `visits` + `user_stats`, then clears active tables):
   ```bash
   npm run season:rollover
   ```

4. When prompted, choose `Production` and enter previous season key (example: `fall2025`).

**Verification checkpoint**:
- [ ] `visits_archive` has rows for the archived season key
- [ ] `user_stats_archive` has rows for the archived season key
- [ ] Active `visits` table is empty
- [ ] Active `user_stats` table is empty

---

### Step 3: Import/Update Restaurant Data

Use the smart-import script to add or update restaurants from the Chamber of Commerce data.

1. Get the restaurant spreadsheet from the Chamber (CSV or Excel format)

2. Generate a template if needed:
   ```bash
    npm run restaurant:template
   ```

3. Place your data file in the project root (e.g., `restaurants.csv`)

4. Run the smart import:
   ```bash
    npm run restaurant:import
   ```

5. The script will:
   - Show what changes will be made (adds, updates, deletes)
   - Ask for confirmation before applying changes
   - Generate unique restaurant codes automatically

**Verification checkpoint**:
- [ ] Log into the dev site and verify all restaurants appear on the restaurants page
- [ ] Spot-check 3-5 restaurant names and codes are correct
- [ ] Verify total restaurant count matches the source spreadsheet

---

### Step 4: Import/Update Sponsor Data

Similar process for sponsors who are supporting the event.

1. Get sponsor information from the Chamber

2. Generate a template if needed:
   ```bash
    npm run sponsor:template
   ```

3. Run the smart import:
   ```bash
    npm run sponsor:import
   ```

**Verification checkpoint**:
- [ ] Verify sponsors appear correctly on the site
- [ ] Check sponsor logos display properly (if applicable)

---

### Step 5: Test on Dev Environment

Before deploying to production, thoroughly test the full user flow.

1. Ensure you're running against the dev database:
   ```bash
   # Check your .env.local points to dev Supabase project
   cat .env.local | grep SUPABASE
   ```

2. Test the complete user flow:
   - [ ] Sign up as a new user
   - [ ] Update profile with contact info
   - [ ] Check in at a restaurant using a code
   - [ ] Verify visit appears in history
   - [ ] Check in at 4 restaurants and verify raffle entry appears
   - [ ] View the restaurants list
   - [ ] View sponsors page

3. Run the consistency check:
   ```bash
   node scripts/check-db-consistency.js
   ```

**Verification checkpoint**:
- [ ] All user flow tests pass
- [ ] No console errors in browser dev tools
- [ ] Consistency check shows no issues

---

## Final Preparation (1 week before)

Complete these tasks during the final week before Restaurant Week begins.

### Step 1: Merge to Production

1. Ensure all changes are committed on the `dev` branch:
   ```bash
   git checkout dev
   git status  # Should be clean
   ```

2. Push dev branch to trigger Vercel preview deployment:
   ```bash
   git push origin dev
   ```

3. Test on the Vercel preview URL (check Vercel dashboard for URL)

4. If all tests pass, merge to main:
   ```bash
   git checkout main
   git pull origin main
   git merge dev
   git push origin main
   ```

5. Vercel will automatically deploy to production

**Verification checkpoint**:
- [ ] Vercel shows successful deployment to production
- [ ] No build errors in Vercel dashboard

---

### Step 2: Production Verification

After deployment, verify production is working correctly.

1. Visit the production URL
2. Verify these items:
   - [ ] Countdown shows correct days until event (or "active" if event started)
   - [ ] "Coming soon" message shows correct start date
   - [ ] Restaurants page shows all participating restaurants
   - [ ] Sponsors page displays correctly
   - [ ] Sign-in/sign-up works (test with a real account)

3. Run the production readiness audit (if available):
   ```bash
   node scripts/audit-production-readiness.js
   ```

**Verification checkpoint**:
- [ ] Production site loads without errors
- [ ] All pages render correctly
- [ ] Authentication works

---

### Step 3: Communication Checklist

Notify stakeholders that the system is ready.

- [ ] Confirm launch date with Chamber of Commerce
- [ ] Provide restaurant code list to Chamber for distribution
- [ ] Verify emergency contact information is up to date
- [ ] Test any promotional emails/links point to correct URLs

---

## During Event

Monitor the application while Restaurant Week is active.

### Monitoring Dashboards

Check these dashboards regularly (at least daily during the event):

| Dashboard | URL | What to Check |
|-----------|-----|---------------|
| Sentry | https://sentry.io | Errors, exceptions, performance issues |
| Supabase | https://supabase.com/dashboard | Database health, query performance |
| Vercel | https://vercel.com/dashboard | Deployment status, function logs |
| Clerk | https://dashboard.clerk.com | Authentication issues, user signups |

### Daily Health Check Routine

Perform these checks once daily during the event:

1. **Check Sentry for new errors**
   - Look for any new unresolved issues
   - Prioritize errors affecting check-in functionality

2. **Verify site accessibility**
   - Load the production site
   - Attempt a test check-in (use your own account)
   - Verify restaurants and stats load correctly

3. **Run consistency check** (if issues reported):
   ```bash
   # Point to production database first
   # Copy production credentials to .env.production
   node scripts/check-db-consistency.js
   ```

### Common Issues and Quick Fixes

**Issue 1: User can't sign in**
- Check Clerk dashboard for authentication errors
- Verify user's email is correct
- Ask user to clear browser cache and try again
- Check if Clerk service is operational: https://status.clerk.com

**Issue 2: Check-in code not working**
- Verify the code exists in the database
- Check if code is case-sensitive (codes should be uppercase)
- Verify user hasn't already checked in at this restaurant

**Issue 3: Raffle entries not updating**
- Run consistency check to verify user_stats matches visits
- Check if database trigger is working (see Troubleshooting section)
- Manually recalculate if needed (see Troubleshooting section)

### Emergency Escalation

If you encounter critical issues:

1. **Site completely down**: Check Vercel status, restart deployment if needed
2. **Database issues**: Check Supabase dashboard for connection/quota issues
3. **Authentication broken**: Check Clerk status page and dashboard

---

## Post-Event Wrap-up

Complete these tasks after Restaurant Week ends.

### Step 1: Run Raffle Draw

Draw raffle winners from eligible participants.

1. Ensure you have production database credentials in `.env.production`:
   ```bash
   # Create .env.production with production Supabase credentials
   # NEXT_PUBLIC_SUPABASE_URL=https://your-prod-project.supabase.co
   # SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   ```

2. Run the raffle draw script:
   ```bash
   node scripts/raffle-draw.js
   ```

3. The script will:
   - List all users with raffle entries
   - Show entry counts (1 entry = 4 restaurant visits)
   - Randomly select a winner weighted by entry count
   - Display winner's contact information

4. Record the winner(s) and notify the Chamber of Commerce

**Verification checkpoint**:
- [ ] Winner(s) selected and recorded
- [ ] Winner contact info provided to Chamber
- [ ] Winner notification sent (if applicable)

---

### Step 2: Backup Database

Create a backup of all event data before any cleanup.

1. Run the backup script:
   ```bash
   node scripts/backup-database.js
   ```

2. This creates a JSON backup in `backups/` with:
   - All restaurants and their codes
   - All sponsors
   - All visits (check-ins)
   - All user stats
   - User information

3. Verify the backup file was created:
   ```bash
   ls -la backups/
   ```

4. **Recommended**: Copy backup to external storage (cloud drive, etc.)

**Verification checkpoint**:
- [ ] Backup file created with today's date
- [ ] Backup file size is reasonable (not empty)
- [ ] Copy stored in external location

---

### Step 3: Archive Results for Chamber

Prepare summary data for the Chamber of Commerce records.

**Data to provide**:

1. **Participation Summary**:
   - Total unique users
   - Total check-ins
   - Total raffle entries awarded
   - Raffle winner(s)

2. **Restaurant Engagement**:
   - Check-ins per restaurant
   - Most visited restaurants

3. Generate this data via SQL (in Supabase dashboard):
   ```sql
   -- Total participation
   SELECT
     COUNT(DISTINCT user_id) as total_users,
     COUNT(*) as total_visits,
     SUM(FLOOR(visit_count / 3)) as total_raffle_entries
   FROM user_stats;

   -- Visits per restaurant
   SELECT r.name, COUNT(v.id) as visit_count
   FROM restaurants r
   LEFT JOIN visits v ON r.id = v.restaurant_id
   GROUP BY r.id, r.name
   ORDER BY visit_count DESC;
   ```

4. Export to CSV or format for Chamber reporting

**Verification checkpoint**:
- [ ] Summary report created
- [ ] Report sent to Chamber of Commerce

---

### Step 4: Reset for Next Event

Optionally clean up test data or prepare for the next event.

**DO NOT delete production data** unless specifically requested by stakeholders.

For development database cleanup:
```bash
node scripts/reset-dev-database.js
```

For cleaning up test visits only:
```bash
node scripts/cleanup-test-visits.js
```

**Verification checkpoint**:
- [ ] Decision made on data retention
- [ ] Next event dates identified (if known)

---

## Troubleshooting Reference

Common issues and their solutions.

### Issue 1: User Stats Don't Match Visits

**Symptom**: User's raffle entries or visit count seems wrong.

**Diagnosis**:
```bash
node scripts/check-db-consistency.js
```

**Fix** - Recalculate user stats:
```sql
-- Run in Supabase SQL Editor
UPDATE user_stats us
SET
  visit_count = (SELECT COUNT(*) FROM visits WHERE user_id = us.user_id),
  raffle_entries = FLOOR((SELECT COUNT(*) FROM visits WHERE user_id = us.user_id) / 3);
```

Or use the fix script:
```bash
node scripts/fix-user-stats.js
```

---

### Issue 2: Restaurant Code Not Found

**Symptom**: User enters a valid code but gets "not found" error.

**Diagnosis**:
```sql
-- Check if code exists
SELECT * FROM restaurants WHERE code = 'THECODE';

-- Check for whitespace issues
SELECT * FROM restaurants WHERE code LIKE '%THECODE%';
```

**Fix** - If code exists with wrong format:
```sql
UPDATE restaurants SET code = UPPER(TRIM(code)) WHERE id = 'restaurant-id';
```

---

### Issue 3: Duplicate Check-in Attempt

**Symptom**: User tries to check in but already has a visit recorded.

**Diagnosis**:
```sql
-- Find user's visits
SELECT v.*, r.name
FROM visits v
JOIN restaurants r ON v.restaurant_id = r.id
WHERE v.user_id = 'user-id-here';
```

**This is expected behavior** - users can only check in once per restaurant.

---

### Issue 4: Deployment Failed

**Symptom**: Vercel deployment fails.

**Diagnosis**:
1. Check Vercel dashboard for build logs
2. Look for TypeScript/ESLint errors
3. Check for missing environment variables

**Common fixes**:
- Run `npm run lint` locally to catch errors
- Run `npm run build` locally to test build
- Verify all env vars are set in Vercel dashboard

---

### Issue 5: Database Connection Failed

**Symptom**: "Failed to connect to database" or timeout errors.

**Diagnosis**:
1. Check Supabase dashboard for service status
2. Verify database URL in environment variables
3. Check connection pooling limits

**Fix**:
- Verify `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are correct
- Check Supabase's connection pool isn't exhausted
- For local development, verify `.env.local` has correct values

---

### Issue 6: User Can't Update Profile

**Symptom**: Profile updates fail with permission error.

**Diagnosis**: This may be an RLS (Row Level Security) issue.

**Fix**: The `/api/profile` route should handle updates. Check:
1. User is authenticated
2. API route is using service role key for writes
3. Profile endpoint is functioning: `curl -X GET /api/profile`

---

### Consistency Check Queries

Run these in Supabase SQL Editor for diagnostics:

```sql
-- Orphaned visits (visits pointing to deleted restaurants)
SELECT v.*
FROM visits v
LEFT JOIN restaurants r ON v.restaurant_id = r.id
WHERE r.id IS NULL;

-- Users with mismatched stats
SELECT
  us.user_id,
  us.visit_count as recorded_visits,
  COUNT(v.id) as actual_visits,
  us.raffle_entries as recorded_entries,
  FLOOR(COUNT(v.id) / 3) as expected_entries
FROM user_stats us
LEFT JOIN visits v ON us.user_id = v.user_id
GROUP BY us.user_id, us.visit_count, us.raffle_entries
HAVING us.visit_count != COUNT(v.id)
   OR us.raffle_entries != FLOOR(COUNT(v.id) / 3);

-- Restaurants without any visits
SELECT r.name, r.code
FROM restaurants r
LEFT JOIN visits v ON r.id = v.restaurant_id
WHERE v.id IS NULL
ORDER BY r.name;
```

---

### Rollback Procedures

**Wrong dates deployed to production**:
1. Update `src/config/restaurant-week.ts` with correct dates
2. Commit and push to trigger new deployment
3. Verify production shows correct dates

**Accidentally deleted restaurants**:
1. Restore from backup: `backups/database-backup-YYYY-MM-DD.json`
2. Use Supabase dashboard to import restaurant data
3. Note: Visits pointing to deleted restaurants will show as orphaned

**Need to undo a check-in** (rare):
```sql
-- Find the visit
SELECT * FROM visits WHERE user_id = 'user-id' AND restaurant_id = 'restaurant-id';

-- Delete it (careful!)
DELETE FROM visits WHERE id = 'visit-id';

-- Recalculate user stats
UPDATE user_stats
SET visit_count = visit_count - 1,
    raffle_entries = FLOOR((visit_count - 1) / 3)
WHERE user_id = 'user-id';
```

---

## Quick Reference

### Key File Paths

| File | Purpose |
|------|---------|
| `src/config/restaurant-week.ts` | Event dates, game config, testing overrides |
| `.env.local` | Local environment variables (dev database) |
| `.env.production` | Production environment variables |
| `scripts/smart-import-restaurants.js` | Import restaurant data |
| `scripts/smart-import-sponsors.js` | Import sponsor data |
| `scripts/check-db-consistency.js` | Verify database integrity |
| `scripts/backup-database.js` | Create database backup |
| `scripts/season-rollover.js` | Archive previous season and reset active gameplay data |
| `scripts/raffle-draw.js` | Draw raffle winner |
| `scripts/fix-user-stats.js` | Recalculate user statistics |
| `supabase/fix-user-stats-triggers.sql` | Database trigger (raffle calculation) |

### Dashboard URLs

| Service | URL | Purpose |
|---------|-----|---------|
| Supabase | https://supabase.com/dashboard | Database management |
| Clerk | https://dashboard.clerk.com | User authentication |
| Vercel | https://vercel.com/dashboard | Deployment & hosting |
| Sentry | https://sentry.io | Error monitoring |

### Environment Variables

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase admin key (server-side only) |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk public key |
| `CLERK_SECRET_KEY` | Clerk secret key |
| `SENTRY_DSN` | Sentry error tracking |
| `NEXT_PUBLIC_DEV_HOSTNAME` | Dev preview hostname for testing override |

### Common Commands

```bash
# Development
npm run dev                              # Start local dev server
npm run build                            # Test production build
npm run lint                             # Check for lint errors

# Data Import
npm run season:rollover                  # Archive old season + reset active data
npm run restaurant:import                # Import restaurants
npm run sponsor:import                   # Import sponsors

# Diagnostics
node scripts/check-db-consistency.js     # Check data integrity
node scripts/audit-production-readiness.js # Pre-launch audit

# Post-Event
node scripts/raffle-draw.js             # Draw raffle winner
node scripts/backup-database.js          # Backup all data

# Maintenance
node scripts/fix-user-stats.js          # Fix user statistics
node scripts/cleanup-test-visits.js      # Clean test data (dev only)
node scripts/reset-dev-database.js       # Reset dev database
```

### Game Rules Reference

| Rule | Value | Location |
|------|-------|----------|
| Restaurants per raffle entry | 4 | `config/game-rules.json` (`src/config/restaurant-week.ts` reads this) |
| Rate limit (requests) | 10 per minute | `GAME_CONFIG.rateLimit.maxRequestsPerWindow` |
| Rate limit (window) | 60,000ms (1 min) | `GAME_CONFIG.rateLimit.windowMs` |

### Seasonal Timeline Summary

| When | What to Do |
|------|------------|
| 4-6 weeks before | Update dates, import data, test on dev |
| 1 week before | Merge to production, verify, communicate |
| During event | Monitor dashboards, handle issues |
| After event | Run raffle, backup data, archive for Chamber |
