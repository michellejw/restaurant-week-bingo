# Implementation Tasks: Seasonal Operations Documentation

**Feature**: 006-operations-docs | **Date**: 2026-02-17 | **Branch**: `006-operations-docs`
**Input**: Plan from [plan.md](./plan.md), Research from [research.md](./research.md)

## Task Overview

| ID | Task | Priority | Depends On | Story | Status |
|----|------|----------|------------|-------|--------|
| T001 | Create docs/OPERATIONS.md skeleton | P1 | - | US1 | ✅ Done |
| T002 | Write Pre-Event Setup section | P1 | T001 | US1 | ✅ Done |
| T003 | Write Final Preparation section | P1 | T001 | US1 | ✅ Done |
| T004 | Write During-Event section | P2 | T001 | US2 | ✅ Done |
| T005 | Write Post-Event Wrap-up section | P3 | T001 | US3 | ✅ Done |
| T006 | Write Troubleshooting Reference section | P2 | T002,T004 | US2 | ✅ Done |
| T007 | Write Quick Reference section | P3 | T002-T006 | All | ✅ Done |
| T008 | Verification and polish | P1 | T001-T007 | All | ✅ Done |

## Detailed Tasks

### T001: Create docs/OPERATIONS.md skeleton

**Priority**: P1 | **Story**: US1 | **Depends on**: None | **Status**: ✅ Complete

Create the runbook file with section headings and table of contents.

**File**: `docs/OPERATIONS.md`

**Acceptance Criteria**:
- [x] File exists at `docs/OPERATIONS.md`
- [x] Contains clear title and purpose statement
- [x] Table of contents with all 7 sections from research.md outline
- [x] Section headings in place with placeholder content

---

### T002: Write Pre-Event Setup section (4-6 weeks before)

**Priority**: P1 | **Story**: US1 | **Depends on**: T001 | **Status**: ✅ Complete

Document the pre-event setup tasks with verification checkpoints.

**Content to include** (from research.md):
- Update event dates in `src/config/restaurant-week.ts`
- Import/update restaurant data using smart-import scripts
- Import/update sponsor data using smart-import scripts
- Test on dev environment
- Verification checklist after each step

**Acceptance Criteria**:
- [x] Step-by-step numbered instructions
- [x] Exact file paths documented
- [x] Verification checkpoint after each major step
- [x] Instructions assume no prior knowledge

---

### T003: Write Final Preparation section (1 week before)

**Priority**: P1 | **Story**: US1 | **Depends on**: T001 | **Status**: ✅ Complete

Document the final week preparation tasks.

**Content to include**:
- Merge to production branch
- Production verification steps
- Communication checklist (what to tell stakeholders)

**Acceptance Criteria**:
- [x] Clear merge workflow documented
- [x] Production verification steps with expected outcomes
- [x] Checklist format for easy follow-along

---

### T004: Write During-Event section

**Priority**: P2 | **Story**: US2 | **Depends on**: T001 | **Status**: ✅ Complete

Document monitoring and health check procedures during the event.

**Content to include** (from research.md):
- Monitoring dashboard links (Sentry, Supabase, Vercel)
- Health check procedures
- Common issues and quick fixes
- Emergency contacts/escalation path

**Acceptance Criteria**:
- [x] Links to all monitoring dashboards
- [x] At least 3 common issues with solutions
- [x] Daily/weekly health check routine documented

---

### T005: Write Post-Event Wrap-up section

**Priority**: P3 | **Story**: US3 | **Depends on**: T001 | **Status**: ✅ Complete

Document post-event tasks including raffle and archiving.

**Content to include** (from research.md):
- Raffle draw process (script exists at `scripts/raffle-draw.js`)
- Data backup procedure via backup script
- Archive format for Chamber of Commerce
- Reset for next event

**Acceptance Criteria**:
- [x] Raffle draw script documented
- [x] Backup steps with backup-database.js script
- [x] Archive format specification for Chamber
- [x] Reset/cleanup checklist

---

### T006: Write Troubleshooting Reference section

**Priority**: P2 | **Story**: US2 | **Depends on**: T002, T004 | **Status**: ✅ Complete

Create troubleshooting reference with common issues and SQL queries.

**Content to include**:
- At least 5 common issues with solutions
- SQL queries for consistency checks
- Rollback guidance for common mistakes

**Acceptance Criteria**:
- [x] Minimum 5 issues documented (6 total)
- [x] SQL queries formatted and tested
- [x] Rollback procedures for each major operation

---

### T007: Write Quick Reference section

**Priority**: P3 | **Story**: All | **Depends on**: T002-T006 | **Status**: ✅ Complete

Create quick reference card with key paths and URLs.

**Content to include** (from research.md):
- Key file paths (config, scripts)
- Dashboard URLs (Supabase, Clerk, Vercel, Sentry)
- Environment variable reference

**Acceptance Criteria**:
- [x] Table format for easy scanning
- [x] All paths verified against current codebase
- [x] URLs are clickable links

---

### T008: Verification and polish

**Priority**: P1 | **Story**: All | **Depends on**: T001-T007 | **Status**: ✅ Complete

Final verification against quickstart.md test cases.

**Verification tests** (from quickstart.md):
1. ✅ Runbook exists with clear title and TOC
2. ✅ Pre-event section has numbered steps, file paths, verification checkpoints
3. ✅ During-event section has dashboard links and common issues
4. ✅ Post-event section has raffle, backup, and archive instructions
5. ✅ Troubleshooting has 5+ issues and SQL queries
6. ✅ Beginner-friendly test (can find what to do 4 weeks before, config file path, verification checkpoints)
7. ✅ All constitution seasonal operations tasks are covered

**Acceptance Criteria**:
- [x] All 7 quickstart.md tests pass
- [x] All 10 constitution tasks have corresponding documentation
- [x] No broken links or incorrect file paths
- [x] Update roadmap to mark 006 complete

---

## Constitution Checklist

From quickstart.md Test 7, verify all these are documented:

- [x] Update event dates in configuration
- [x] Import updated restaurant/sponsor data
- [x] Test full user flow on dev
- [x] Final merge from dev to main
- [x] Verify production shows correct dates
- [x] Monitor for errors (Sentry)
- [x] Run consistency checks
- [x] Run raffle draw script
- [x] Backup all data
- [x] Archive results for Chamber

## Notes

- This is a documentation-only feature - no code changes
- Raffle draw script exists at `scripts/raffle-draw.js` (updated from research)
- All dashboard URLs documented with generic links (user fills in project-specific URLs)
- Research.md decision D2: Document manual workarounds for missing scripts - N/A, scripts exist
