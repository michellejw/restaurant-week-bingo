# Research: Developer Onboarding Documentation

**Feature**: 007-developer-docs
**Date**: 2026-02-17

## Summary

This research analyzes the current documentation state and identifies gaps to be addressed. The README.md already has substantial content; the focus will be on creating a dedicated environment setup guide and improving the quick start experience.

## Current State Analysis

### README.md Assessment

The current README.md (~400 lines) is comprehensive but mixes multiple audiences:
- Marketing content (hosted service pitch)
- Self-hosting setup
- Data management commands
- Architecture overview

**Strengths**:
- Complete environment variables list
- Project structure overview
- Database schema description
- Data management commands documented

**Gaps**:
- Quick start is buried after marketing content
- No troubleshooting for common setup issues
- Architecture section is brief (just 5 bullet points)
- No explanation of how components interact

### Environment Variables Inventory

| Variable | Service | Current Documentation |
|----------|---------|----------------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase | ✅ Documented |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Supabase | ✅ Documented |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase | ✅ Documented |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk | ✅ Documented |
| `CLERK_SECRET_KEY` | Clerk | ✅ Documented |
| `NEXT_PUBLIC_DEV_HOSTNAME` | App | ✅ Documented |
| `SENTRY_DSN` | Sentry | ❌ Missing |
| `SENTRY_AUTH_TOKEN` | Sentry | ❌ Missing |

### Directory Structure Analysis

```text
src/
├── app/                    # Next.js App Router pages
│   ├── api/               # API routes (check-in, profile, restaurants)
│   ├── admin/             # Admin dashboard page
│   ├── stats/             # Statistics page
│   └── [other pages]      # User-facing pages
├── components/            # Reusable React components
├── config/               # Configuration (restaurant-week.ts, GAME_CONFIG)
├── hooks/                # Custom React hooks (SWR-based)
├── lib/                  # Core services
│   ├── auth/            # Admin authentication helpers
│   ├── services/        # Database service layer
│   ├── sentry/          # Error tracking utilities
│   ├── rate-limit.ts    # API rate limiting
│   └── supabase.ts      # Supabase client
└── types/               # TypeScript type definitions

scripts/                   # Admin/maintenance scripts
supabase/                 # Database schema and migrations
```

### Key User Flows to Document

1. **Check-in Flow**: User → API route → Database → Stats update
2. **Authentication Flow**: Clerk → Middleware → Protected pages
3. **Data Fetch Flow**: Page → SWR hook → API route → Supabase

## Decisions

### D1: Document Structure

**Decision**: Create `docs/ENVIRONMENT_SETUP.md` with architecture overview included as a section

**Rationale**:
- Keeps onboarding content in one place
- Architecture context helps understanding environment requirements
- Matches 006-operations-docs pattern (single file per topic)

**Alternatives considered**:
- Separate `docs/ARCHITECTURE.md` - Rejected: would fragment onboarding content
- Expand README only - Rejected: README already too long

### D2: README Restructuring

**Decision**: Restructure README to lead with quick start, move detailed content to links

**Rationale**:
- Developer first impression matters
- "Clone → install → run" should be visible in first scroll
- Marketing content can follow or link out

**Structure**:
```text
1. One-sentence description
2. Quick Start (5 commands)
3. Documentation Links (setup, operations, architecture)
4. Features list
5. Hosted service section (for non-developers)
```

### D3: Sentry Variables

**Decision**: Document Sentry environment variables in ENVIRONMENT_SETUP.md

**Rationale**:
- Sentry was added in 003-error-monitoring but not documented
- Optional for development but important for production

## Content Outline

### docs/ENVIRONMENT_SETUP.md

1. **Prerequisites** - Node.js, git, accounts needed
2. **Quick Start** - Clone, install, configure, run
3. **Environment Variables** - Complete reference with how-to-obtain instructions
4. **External Services Setup**
   - Supabase (database)
   - Clerk (authentication)
   - Sentry (error monitoring - optional)
5. **Architecture Overview**
   - Directory structure with descriptions
   - Key files and their purposes
   - User flow diagrams (text-based)
6. **Verification** - How to know setup worked
7. **Troubleshooting** - Common issues and fixes

### README.md Updates

1. Move quick start to top
2. Shorten to 5 commands max
3. Link to docs/ENVIRONMENT_SETUP.md for details
4. Keep feature list but move after quick start
5. Maintain hosted service section (important for business)
