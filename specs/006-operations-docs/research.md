# Research: Seasonal Operations Documentation

**Feature**: 006-operations-docs
**Date**: 2026-02-12

## Summary

This research documents the current system inventory - what configuration files, scripts, and processes exist that need to be documented in the operations runbook.

## System Inventory

### Configuration Files to Document

| File | Purpose | When Modified |
|------|---------|---------------|
| `src/config/restaurant-week.ts` | Event dates, testing overrides, display messages | Pre-event (update dates) |
| `src/config/restaurant-week.ts` → `GAME_CONFIG` | Raffle rules, rate limiting | Rarely (if game rules change) |
| `.env.local` / Vercel env vars | Database URLs, API keys | Environment setup |

### External Services to Document

| Service | Purpose | Dashboard URL |
|---------|---------|---------------|
| Supabase | Database (PostgreSQL) | https://supabase.com/dashboard |
| Clerk | Authentication | https://dashboard.clerk.com |
| Vercel | Hosting/deployment | https://vercel.com/dashboard |
| Sentry | Error monitoring | https://sentry.io (if configured) |

### Scripts/Processes to Document

| Process | Current Status | Notes |
|---------|----------------|-------|
| Update event dates | Manual edit of config file | Exists - document steps |
| Import restaurant data | Smart-import scripts exist | Document usage |
| Import sponsor data | Smart-import scripts exist | Document usage |
| Run consistency checks | Manual SQL queries | Document queries |
| Raffle draw | Manual process | Script doesn't exist yet - document manual alternative |
| Database backup | Supabase dashboard export | Document steps |
| Archive results | Manual export | Document format for Chamber |

### Database Tables to Reference

| Table | Purpose | Backup Priority |
|-------|---------|-----------------|
| `restaurants` | Restaurant list with codes | High |
| `sponsors` | Sponsor information | High |
| `visits` | User check-ins | High |
| `user_stats` | Aggregated user statistics | High |
| `users` (Clerk-managed) | User accounts | Managed by Clerk |

## Decisions

### D1: Runbook Structure

**Decision**: Organize runbook by timeline (pre/during/post) rather than by task type

**Rationale**:
- Operators think in terms of "what do I do before the event?" not "where are all the config files?"
- Matches the constitution's seasonal operations outline
- Easier to follow as a checklist during actual event preparation

**Alternatives considered**:
- Task-type organization (config, scripts, monitoring) - Rejected: harder to ensure nothing is missed
- Two separate docs (setup + operations) - Rejected: violates single-file requirement

### D2: Missing Scripts

**Decision**: Document manual workarounds for scripts that don't exist yet

**Rationale**:
- The raffle draw script doesn't exist - document manual SQL/process instead
- Documentation shouldn't block on script creation
- Notes can indicate "future: automate with script"

### D3: Verification Checkpoints

**Decision**: Include specific verification steps after each action

**Rationale**:
- Spec requires verification checkpoints (FR-005)
- Prevents operator uncertainty ("did that work?")
- Examples: "verify countdown shows X days", "verify N restaurants appear"

## Content Outline

Based on research, the runbook should include these sections:

1. **Overview** - What this document covers, when to use it
2. **Pre-Event Setup (4-6 weeks before)**
   - Update event dates in config
   - Import/update restaurant data
   - Import/update sponsor data
   - Test on dev environment
   - Verification checklist
3. **Final Preparation (1 week before)**
   - Merge to production
   - Production verification
   - Communication checklist
4. **During Event**
   - Monitoring dashboard links
   - Health check procedures
   - Troubleshooting common issues
   - Emergency contacts/escalation
5. **Post-Event Wrap-up**
   - Raffle draw process
   - Data backup procedure
   - Archive for Chamber
   - Reset for next event
6. **Troubleshooting Reference**
   - Common issues and solutions
   - Consistency check queries
   - Rollback procedures
7. **Quick Reference**
   - Key file paths
   - Dashboard URLs
   - Environment variable reference
