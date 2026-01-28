# Quickstart: Error Monitoring Setup

**Branch**: `003-error-monitoring`
**Date**: 2026-01-26

This guide walks through setting up Sentry error monitoring for the Restaurant Week Bingo application.

## Prerequisites

- Sentry account (free tier is sufficient)
- Access to Vercel project settings (for environment variables)
- Admin access to the codebase

## Step 1: Create Sentry Projects

1. Log in to [sentry.io](https://sentry.io)
2. Create **two projects** (one for each environment):
   - `restaurant-week-bingo-dev` (Development)
   - `restaurant-week-bingo-prod` (Production)
3. Select "Next.js" as the platform for both
4. Note the DSN for each project (Settings → Client Keys)

## Step 2: Configure Environment Variables

### Local Development (.env.local)

```bash
# Sentry - Development Project
NEXT_PUBLIC_SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/dev-project-id
```

### Vercel Production Environment

In Vercel Dashboard → Project → Settings → Environment Variables:

```bash
# Sentry - Production Project
NEXT_PUBLIC_SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/prod-project-id

# Optional: For source map uploads (improves stack traces)
SENTRY_ORG=your-org-slug
SENTRY_PROJECT=restaurant-week-bingo-prod
SENTRY_AUTH_TOKEN=sntrys_xxx  # Generate in Sentry: Settings → Auth Tokens
```

## Step 3: Install Sentry SDK

```bash
npx @sentry/wizard@latest -i nextjs
```

The wizard will:
1. Install `@sentry/nextjs` package
2. Create configuration files:
   - `sentry.client.config.ts`
   - `sentry.server.config.ts`
   - `sentry.edge.config.ts`
3. Update `next.config.ts` to include Sentry webpack plugin
4. Create example API route for testing

## Step 4: Configure User Context (Manual Step)

After the wizard completes, add user context integration with Clerk.

Create `src/lib/sentry/user-context.ts`:

```typescript
import * as Sentry from '@sentry/nextjs';

/**
 * Set Sentry user context from Clerk user ID.
 * IMPORTANT: Only pass user ID, never PII (email, name, phone).
 */
export function setSentryUserContext(userId: string | null): void {
  if (userId) {
    Sentry.setUser({ id: userId });
  } else {
    Sentry.setUser(null);
  }
}
```

Then integrate in your auth state (e.g., in a layout or provider component):

```typescript
import { useUser } from '@clerk/nextjs';
import { useEffect } from 'react';
import { setSentryUserContext } from '@/lib/sentry/user-context';

// In a client component
const { user } = useUser();

useEffect(() => {
  setSentryUserContext(user?.id ?? null);
}, [user?.id]);
```

## Step 5: Configure Alerting

**Alert Recipients**: Add the following team members to receive error alerts:
- Primary: [Your email - project owner]
- Secondary: [Additional team member if applicable]

1. Go to Sentry → Alerts → Create Alert Rule
2. Configure:
   - **When**: A new issue is created
   - **Then**: Send email to team members
   - **Environment**: Production only (to avoid dev noise)
3. Add team member emails

## Step 6: Verify Installation

### Test Client-Side Error

1. Add a test button somewhere (temporarily):
   ```typescript
   <button onClick={() => { throw new Error('Test client error'); }}>
     Test Error
   </button>
   ```
2. Click the button
3. Check Sentry dashboard - error should appear within 30 seconds

### Test Server-Side Error

1. The wizard creates `/api/sentry-example-api` route
2. Visit `http://localhost:3000/api/sentry-example-api`
3. Check Sentry dashboard

### Test Alert

1. Trigger a new unique error in production
2. Verify email notification arrives within 5 minutes

## Step 7: Clean Up

1. Remove any test buttons/routes
2. Delete `/api/sentry-example-api` if not needed
3. Verify `debug: false` in production config

## Verification Checklist

- [ ] Dev Sentry project created
- [ ] Prod Sentry project created
- [ ] `NEXT_PUBLIC_SENTRY_DSN` set in .env.local (dev DSN)
- [ ] `NEXT_PUBLIC_SENTRY_DSN` set in Vercel (prod DSN)
- [ ] Client-side error appears in Sentry dashboard
- [ ] Server-side error appears in Sentry dashboard
- [ ] User ID visible in error context (when signed in)
- [ ] No PII (email, name) visible in error context
- [ ] Alert email received for new error
- [ ] Dev errors appear in dev project only
- [ ] Prod errors appear in prod project only

## Troubleshooting

### Errors not appearing in Sentry

1. Check DSN is correct in environment variables
2. Verify `debug: true` in dev config to see console logs
3. Check browser network tab for requests to `ingest.sentry.io`
4. Ensure Sentry is initialized before errors occur

### Source maps not working (stack traces show minified code)

1. Verify `SENTRY_AUTH_TOKEN` is set in Vercel
2. Check Sentry project settings → Source Maps
3. Ensure `next.config.ts` includes Sentry webpack plugin

### Too many alerts (alert fatigue)

1. Configure alert rules to group similar errors
2. Set minimum threshold (e.g., 10 occurrences before alert)
3. Exclude development environment from alerts

## Resources

- [Sentry Next.js SDK Docs](https://docs.sentry.io/platforms/javascript/guides/nextjs/)
- [Sentry Alerting Guide](https://docs.sentry.io/product/alerts/)
- [Sentry + Vercel Integration](https://docs.sentry.io/product/integrations/deployment/vercel/)
