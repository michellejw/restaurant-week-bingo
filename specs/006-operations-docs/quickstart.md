# Quickstart: Seasonal Operations Documentation

**Feature**: 006-operations-docs
**Date**: 2026-02-12

## Prerequisites

- Access to the repository
- Familiarity with markdown editing
- Knowledge of current system configuration (from codebase exploration)

## Verification Steps

### Test 1: Runbook Exists

Verify the operations runbook was created.

```bash
cat docs/OPERATIONS.md | head -20
```

**Expected**: File exists with clear title and table of contents.

### Test 2: Pre-Event Section Complete

Review the pre-event setup section.

**Expected**:
- Numbered steps for updating event dates
- Exact file path: `src/config/restaurant-week.ts`
- Verification checkpoint after each major step
- Instructions assume no prior knowledge

### Test 3: During-Event Section Complete

Review the during-event monitoring section.

**Expected**:
- Links to monitoring dashboards (Sentry, Supabase, Vercel)
- Common issues and their solutions
- Instructions for running consistency checks

### Test 4: Post-Event Section Complete

Review the post-event wrap-up section.

**Expected**:
- Raffle draw process (manual steps or script reference)
- Database backup instructions
- Archive format for Chamber of Commerce

### Test 5: Troubleshooting Section Complete

Review the troubleshooting reference.

**Expected**:
- At least 5 common issues with solutions
- SQL queries for consistency checks
- Rollback guidance for common mistakes

### Test 6: Beginner-Friendly Test

Have someone unfamiliar with the project read the runbook.

**Expected**:
- They can identify what to do 4 weeks before an event
- They can find the configuration file path
- They understand verification checkpoints

### Test 7: Constitution Alignment

Verify all constitution seasonal operations tasks are covered.

**Constitution tasks**:
- [ ] Update event dates in configuration
- [ ] Import updated restaurant/sponsor data
- [ ] Test full user flow on dev
- [ ] Final merge from dev to main
- [ ] Verify production shows correct dates
- [ ] Monitor for errors (Sentry)
- [ ] Run consistency checks
- [ ] Run raffle draw script
- [ ] Backup all data
- [ ] Archive results for Chamber

**Expected**: All items have corresponding documentation in the runbook.

## Troubleshooting

### Runbook seems incomplete

If sections are missing or sparse:
- Check that research.md was consulted during writing
- Verify all constitution seasonal operations are covered
- Ensure verification checkpoints exist for each major step

### File paths are wrong

If documented paths don't match actual files:
- Verify paths against current codebase
- Update runbook with correct paths
- Add note if file structure has changed
