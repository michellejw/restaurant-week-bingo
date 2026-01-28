# Research: Error Monitoring

**Branch**: `003-error-monitoring`
**Date**: 2026-01-26

## Research Questions

1. What is the best error monitoring solution for Next.js 15 with App Router?
2. How to integrate Sentry with Clerk for user context without exposing PII?
3. How to configure separate dev/prod Sentry projects?
4. What is the recommended setup for Next.js 15 instrumentation?

---

## 1. Error Monitoring Solution for Next.js 15

### Decision
Use **Sentry** with `@sentry/nextjs` package.

### Rationale
- First-class Next.js support with official SDK
- Automatic capture of both client and server errors
- Built-in source map upload for readable stack traces
- Free tier (5K errors/month) sufficient for seasonal app
- Excellent App Router and React Server Components support
- Vercel integration for seamless deployment

### Alternatives Considered

| Alternative | Why Rejected |
|-------------|--------------|
| LogRocket | More focused on session replay; overkill for error monitoring |
| Bugsnag | Similar to Sentry but less Next.js-specific tooling |
| Rollbar | Good but Sentry has better React/Next.js integration |
| DIY (console + CloudWatch) | No alerting, no grouping, poor developer experience |

---

## 2. Clerk Integration for User Context

### Decision
Set Sentry user context with Clerk's `userId` only. Do NOT include email, name, or phone.

### Rationale
- FR-005 requires no PII capture
- Clerk user ID is sufficient to identify which user experienced an error
- If needed, admin can look up user details in Clerk dashboard separately
- Sentry's `setUser()` accepts arbitrary fields - we control what's sent

### Implementation Pattern
```typescript
// In a client component or middleware
import * as Sentry from '@sentry/nextjs';
import { useUser } from '@clerk/nextjs';

// Only set user ID, never PII
Sentry.setUser({ id: userId });

// On sign-out, clear user context
Sentry.setUser(null);
```

---

## 3. Dev/Prod Environment Separation

### Decision
Use **separate Sentry projects** for dev and prod, selected by environment variable.

### Rationale
- FR-009 requires dev errors don't pollute prod dashboard
- Separate DSN per environment is Sentry's recommended approach
- Environment-based config aligns with existing Clerk/Supabase pattern

### Implementation
```bash
# .env.local (dev)
NEXT_PUBLIC_SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/dev-project

# Vercel prod environment
NEXT_PUBLIC_SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/prod-project
```

### Alternative Considered

| Alternative | Why Rejected |
|-------------|--------------|
| Single project with environment tag | Harder to filter; risk of alert fatigue from dev errors |
| Disable in dev entirely | Lose ability to test Sentry integration locally |

---

## 4. Next.js 15 Instrumentation Setup

### Decision
Use the **instrumentation.ts** file pattern for server-side initialization, plus config files for client/edge.

### Rationale
- Next.js 15 uses `instrumentation.ts` as the standard server initialization hook
- Sentry wizard generates this structure automatically
- Separates concerns: client config, server config, edge config

### File Structure
```
sentry.client.config.ts   # Browser SDK initialization
sentry.server.config.ts   # Node.js server SDK initialization
sentry.edge.config.ts     # Edge runtime SDK initialization
src/instrumentation.ts    # Next.js instrumentation hook (imports server config)
```

### Key Configuration Points
- `dsn`: From environment variable
- `tracesSampleRate`: 0.1 (10% sampling for performance traces - optional)
- `replaysSessionSampleRate`: 0 (no session replay needed)
- `environment`: Auto-detected from Vercel environment

---

## 5. Alerting Configuration

### Decision
Use Sentry's built-in email alerts for new issue types.

### Rationale
- FR-002 requires alerts within 5 minutes
- Sentry's default alert rules notify on first occurrence of new issue
- Email is sufficient for this low-volume app (assumption in spec)
- Can add Slack integration later if needed

### Setup
1. Create Sentry project
2. Add team members' emails
3. Configure alert rule: "When a new issue is created, send email to team"
4. Default 1-minute check interval meets 5-minute SLA

---

## Summary of Decisions

| Topic | Decision | Confidence |
|-------|----------|------------|
| Error monitoring service | Sentry with @sentry/nextjs | High |
| User context | Clerk userId only, no PII | High |
| Environment separation | Separate Sentry projects | High |
| Initialization pattern | instrumentation.ts + config files | High |
| Alerting | Sentry email alerts | High |

All research questions resolved. No NEEDS CLARIFICATION remaining.
